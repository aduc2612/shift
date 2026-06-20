import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai";
import { z } from "npm:zod";
import { zodResponseFormat } from "npm:openai/helpers/zod";
import {
  MODELS,
  OPENROUTER_BASE_URL,
  SYSTEM_PROMPT,
  TOKENS_PER_TASK,
  TOKENS_BASE,
  TIMEOUT_PER_TASK,
  TIMEOUT_BASE,
  MAX_TOKENS,
  MAX_TIMEOUT_MS,
} from "./config.ts";
import { buildSystemPrompt } from "../_shared/ai-prompt.ts";
import {
  createUserClient,
  fetchUserPreferences,
} from "../_shared/supabase-client.ts";

// --- Zod schema for structured output ---
const TaskResultSchema = z.object({
  id: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.number(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD format required").nullable(),
  aiJustification: z.string(),
  aiContext: z.string(),
});

const RescheduleSchema = z.object({
  tasks: z.array(TaskResultSchema),
});

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
      });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid or malformed JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const { tasks, userContext, whatChanged, timezone } = body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return new Response(JSON.stringify({ error: "tasks array required" }), {
        status: 400,
      });
    }

    const tz = timezone || "UTC";

    // Validate timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
    } catch {
      return new Response(
        JSON.stringify({ error: `Invalid timezone: ${tz}` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const now = new Date();
    const nowUTC = now.toLocaleString("en-US", { timeZone: "UTC" }) + " UTC";
    const nowLocal = now.toLocaleString("en-US", { timeZone: tz });
    const dayOfWeek = now.toLocaleDateString("en-US", {
      timeZone: tz,
      weekday: "long",
    });
    const isWeekend = ["Saturday", "Sunday"].includes(dayOfWeek);
    const offset = now
      .toLocaleString("en-US", { timeZone: tz, timeZoneName: "shortOffset" })
      .split(" ")
      .pop();
    const tzDisplay = `${tz} (${offset})`;

    const systemPrompt = SYSTEM_PROMPT.replace("{now}", nowUTC)
      .replace("{nowLocal}", nowLocal)
      .replace("{dayOfWeek}", dayOfWeek)
      .replace("{isWeekend}", isWeekend ? "Yes" : "No")
      .replace("{timezone}", tzDisplay);

    // Augment with user's onboarding-completed preferences (best-effort).
    // If the user hasn't done onboarding or the prefs read fails, we fall
    // through with the unmodified system prompt.
    let augmentedPrompt = systemPrompt;
    try {
      const userClient = createUserClient(authHeader);
      const { data: userData } = await userClient.auth.getUser();
      if (userData?.user) {
        const prefs = await fetchUserPreferences(userClient, userData.user.id);
        if (prefs) {
          const fragment = buildSystemPrompt(prefs);
          if (fragment) {
            augmentedPrompt = `${systemPrompt}\n\nUser preferences (from onboarding):\n${fragment}`;
          }
        }
      }
    } catch (err) {
      console.error("Failed to load user preferences:", err);
    }

    const inputIds = new Set(tasks.map((t: { id: string }) => t.id));

    // Strip fields the AI might treat as fixed constraints.
    // Keep: id, name, startTime, endTime, deadline (current state, all mutable except id/name).
    // Remove: durationMinutes (AI decides duration), aiJustification (AI wrote this),
    //         completed, createdAt, updatedAt (metadata, irrelevant for scheduling).
    // Keep: aiContext (task characteristics, useful for rescheduling).
    const strippedTasks = tasks.map((t: Record<string, unknown>) => ({
      id: t.id,
      name: t.name,
      startTime: t.startTime,
      endTime: t.endTime,
      deadline: t.deadline || null,
      aiContext: t.aiContext || null,
    }));

    const userMessage = `Tasks (current schedule — all fields except id and name are mutable):\n${JSON.stringify(strippedTasks, null, 2)}\n\nUser context: ${userContext || "None provided"}\n\nWhat changed: ${whatChanged || "Initial scheduling"}`;

    const maxTokens = Math.min(
      tasks.length * TOKENS_PER_TASK + TOKENS_BASE,
      MAX_TOKENS,
    );
    const timeout = Math.min(
      tasks.length * TIMEOUT_PER_TASK + TIMEOUT_BASE,
      MAX_TIMEOUT_MS,
    );

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const openai = new OpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey,
      timeout,
      maxRetries: 0,
    });

    let lastError: Error | null = null;

    for (const model of MODELS) {
      try {
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            { role: "system", content: augmentedPrompt },
            { role: "user", content: userMessage },
          ],
          response_format: zodResponseFormat(RescheduleSchema, "reschedule"),
          max_tokens: maxTokens,
          reasoning: {
            effort: "low",
            exclude: true,
          },
        });

        let content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error("Model returned empty response");
        }

        // Strip markdown fences if model wraps JSON
        content = content
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "")
          .trim();

        // Zod validates the response matches the schema exactly
        const parsed = RescheduleSchema.parse(JSON.parse(content));

        // Validate exact task ID parity — no extras, no duplicates
        const outputIds = new Set(parsed.tasks.map((t) => t.id));
        if (parsed.tasks.length !== inputIds.size || outputIds.size !== inputIds.size) {
          throw new Error(
            `Task count mismatch: expected ${inputIds.size}, got ${parsed.tasks.length} (${outputIds.size} unique)`,
          );
        }
        for (const id of inputIds) {
          if (!outputIds.has(id)) {
            throw new Error(`Missing task id in output: ${id}`);
          }
        }

        return new Response(JSON.stringify({ tasks: parsed.tasks }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`Model ${model} failed:`, lastError.message);
        continue;
      }
    }

    return new Response(
      JSON.stringify({
        error: `All models failed. Last error: ${lastError?.message}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Edge Function error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
