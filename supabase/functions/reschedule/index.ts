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
import { buildMessages } from "../_shared/build-messages.ts";
import {
  createUserClient,
  fetchUserPreferences,
} from "../_shared/supabase-client.ts";

// --- Zod schema for structured output ---

function isValidDateString(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
}

const dateSchema = z.string().refine(isValidDateString, "Valid YYYY-MM-DD date required");

const TaskResultSchema = z.object({
  id: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.number(),
  deadline: dateSchema.nullable(),
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

    const inputIds = new Set(tasks.map((t: { id: string }) => t.id));

    // Fetch user preferences (best-effort). The pure prompt assembly
    // lives in buildMessages so it can be tested outside Deno.
    let prefs = null;
    try {
      const userClient = createUserClient(authHeader);
      const { data: userData } = await userClient.auth.getUser();
      if (userData?.user) {
        prefs = await fetchUserPreferences(userClient, userData.user.id);
      }
    } catch (err) {
      console.error("Failed to load user preferences:", err);
    }

    const messages = buildMessages({
      mode: "reschedule",
      systemPromptTemplate: SYSTEM_PROMPT,
      now: new Date(),
      timezone: tz,
      prefs,
      tasks: tasks as {
        id: string;
        name: string;
        startTime: string;
        endTime: string;
        deadline?: string | null;
        aiContext?: string | null;
      }[],
      userContext: userContext as string | undefined,
      whatChanged: whatChanged as string | undefined,
    });

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
          messages,
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
