import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai";
import { z } from "npm:zod";
import { zodResponseFormat } from "npm:openai/helpers/zod";
import {
  MODELS,
  OPENROUTER_BASE_URL,
  SYSTEM_PROMPT,
  MAX_TOKENS,
  TIMEOUT_MS,
} from "./config.ts";

// --- Zod schemas for structured output ---

const NewTaskSchema = z.object({
  id: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.number(),
  aiJustification: z.string(),
  aiContext: z.string(),
});

const PlaceTaskResponseSchema = z.object({
  task: NewTaskSchema,
});

// --- Handler exported for testing ---

export async function handler(req: Request): Promise<Response> {
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

    const { task, existingTasks, userContext, whatChanged, timezone } =
      body as {
        task: Record<string, unknown>;
        existingTasks: unknown[];
        userContext: string;
        whatChanged: string;
        timezone: string;
      };

    // Validate task input
    if (!task || typeof task !== "object") {
      return new Response(JSON.stringify({ error: "task object required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!task.id || !task.name || typeof task.durationMinutes !== "number") {
      return new Response(
        JSON.stringify({
          error: "task must have id, name, and durationMinutes",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!Array.isArray(existingTasks)) {
      return new Response(
        JSON.stringify({ error: "existingTasks array required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
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

    const newTaskInfo = {
      id: task.id,
      name: task.name,
      durationMinutes: task.durationMinutes,
      deadline: task.deadline || null,
      aiContext: task.aiContext || null,
    };

    const userMessage =
      `New task to place:\n${JSON.stringify(newTaskInfo, null, 2)}\n\n` +
      `Existing scheduled tasks (READ-ONLY — do not modify):\n${JSON.stringify(existingTasks, null, 2)}\n\n` +
      `User context: ${userContext || "None provided"}\n\n` +
      `What changed: ${whatChanged || "Adding a new task"}`;

    const openai = new OpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey: Deno.env.get("OPENROUTER_API_KEY"),
      timeout: TIMEOUT_MS,
      maxRetries: 0,
    });

    let lastError: Error | null = null;

    for (const model of MODELS) {
      try {
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          response_format: zodResponseFormat(
            PlaceTaskResponseSchema,
            "place_task",
          ),
          max_tokens: MAX_TOKENS,
          reasoning_effort: "minimal",
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
        const parsed = PlaceTaskResponseSchema.parse(JSON.parse(content));

        // Validate returned task ID matches input
        if (parsed.task.id !== task.id) {
          throw new Error(
            `Task ID mismatch: expected ${task.id}, got ${parsed.task.id}`,
          );
        }

        return new Response(JSON.stringify({ task: parsed.task }), {
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
}

// --- Deno server entry point ---
Deno.serve(handler);
