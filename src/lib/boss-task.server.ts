import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import type { Database } from "@/integrations/supabase/types";

/**
 * Generates one AI-authored practice task for the mixed boss battle,
 * targeting whichever topic the student most needs to practise. Runs
 * server-side only - see src/lib/boss-task.ts for the client half, which
 * self-verifies whatever this returns (against the real Pyodide grading
 * path) before a student ever sees it, and falls back to the ordinary
 * static pool if generation or verification fails for any reason.
 */

const SYSTEM_PROMPT = `You write short Python programming exercises for GCSE Computer Science students (OCR exam board, UK). Match a plain, direct wording style - a student should understand exactly what to do without ambiguity, similar to: "Input a whole number N, then N more whole numbers. Print the sum of all of them."

Respond with ONLY a single JSON object, no markdown code fences, no commentary before or after. Match exactly this shape:
{"title": string, "brief": string, "hints": [string, string], "tests": [{"stdin": string, "expect": string}, {"stdin": string, "expect": string}], "reference_solution": string}

Rules:
- "reference_solution" is a complete, correct Python 3 program that solves the task exactly as described in "brief", using only input() and print() for I/O.
- "tests" must have exactly 2 cases. Each "stdin" is realistic input matching what reference_solution actually reads (one value per line, in the order the program calls input()). Each "expect" is the EXACT stdout reference_solution produces for that stdin, including capitalisation and punctuation, with line breaks written as \\n - work this out precisely by tracing the code, don't guess it.
- Stay strictly within the given topic and difficulty level. Do not use Python features a student at this stage would not have been taught yet (e.g. no list comprehensions, recursion, or advanced string/list methods unless the topic is explicitly about them).
- "hints" are two short, non-spoiling hints in the same plain style as the brief - the first gentler, the second more concrete.
- Higher difficulty should mean a genuinely longer or more involved task (more inputs, more steps, more branching), not just harder vocabulary.`;

const xpForDifficulty = (d: number) => 10 + (d - 1) * 5;

type GeneratedTask = {
  title: string;
  brief: string;
  hints: string[];
  tests: { stdin: string; expect: string }[];
  reference_solution: string;
};

// Mirrors src/integrations/supabase/client.ts's handling of both legacy JWT
// keys and the newer opaque sb_publishable_/sb_secret_ format - this
// deployment's keys could be either, and a raw createClient() call sends a
// conflicting Authorization header for the new format.
function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createBackendFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(init?.headers);
    if (isNewSupabaseApiKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

export const generateBossTask = createServerFn({ method: "POST" })
  .validator(
    (data: {
      track: "gcse" | "alevel";
      topic: string;
      topicLabel: string;
      topicBlurb: string;
      level: number;
    }) => data,
  )
  .handler(async ({ data }) => {
    const authHeader = getRequestHeader("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) throw new Error("Not authenticated");

    const supabaseUrl = process.env["SUPABASE_URL"];
    const anonKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
    const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    const anthropicKey = process.env["ANTHROPIC_API_KEY"];
    if (!supabaseUrl || !anonKey || !serviceKey) throw new Error("Server is not configured");
    if (!anthropicKey) throw new Error("AI task generation is not configured on this server");

    // Confirm the caller is a genuine, currently-signed-in user before
    // spending an API call on their behalf - the elevated insert below
    // bypasses the normal admin/teacher-only RLS on challenges (see
    // "staff manage challenges" policy), so this check is the only thing
    // standing between "any authenticated student" and "anyone at all".
    const authed = createClient<Database>(supabaseUrl, anonKey, {
      global: { fetch: createBackendFetch(anonKey) },
      auth: { persistSession: false },
    });
    const { data: userData, error: userErr } = await authed.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("Not authenticated");

    const level = Math.max(1, Math.min(5, Math.round(data.level)));
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Topic: ${data.topicLabel} (${data.topicBlurb}). Target difficulty: ${level}/5. Generate one new, original task at this difficulty for this topic.`,
        },
      ],
    });
    const raw = response.content.find((block) => block.type === "text")?.text ?? "";

    let parsed: GeneratedTask;
    try {
      parsed = JSON.parse(raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, "")) as GeneratedTask;
    } catch {
      throw new Error("Generation failed — could not parse the response");
    }
    if (
      !parsed.title ||
      !parsed.brief ||
      !parsed.reference_solution ||
      !Array.isArray(parsed.tests) ||
      parsed.tests.length === 0
    ) {
      throw new Error("Generation failed — incomplete response");
    }

    const service = createClient<Database>(supabaseUrl, serviceKey, {
      global: { fetch: createBackendFetch(serviceKey) },
      auth: { persistSession: false },
    });
    const slug = `ai-${data.topic}-${crypto.randomUUID().slice(0, 8)}`;
    const { data: inserted, error: insertErr } = await service
      .from("challenges")
      .insert({
        slug,
        track: data.track,
        topic: data.topic,
        title: parsed.title,
        brief: parsed.brief,
        difficulty: level,
        xp: xpForDifficulty(level),
        starter_code: "",
        hints: parsed.hints ?? [],
        tests: parsed.tests,
      })
      .select("*")
      .single();
    if (insertErr || !inserted) throw new Error("Could not save the generated task");

    return { challenge: inserted, referenceSolution: parsed.reference_solution };
  });
