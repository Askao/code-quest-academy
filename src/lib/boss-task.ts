import { generateBossTask } from "@/lib/boss-task.server";
import { runTests, type TestCase } from "@/lib/python-runner";
import type { Challenge } from "@/lib/progress";
import type { TrackKey } from "@/lib/game";

/**
 * Generates one AI-authored task for the mixed boss battle, targeting
 * whichever topic the student most needs to practise, then self-verifies
 * it before ever handing it back: the model's own reference solution is
 * run against its own tests through the exact same Pyodide grading path a
 * real student's code goes through (see runTests). A task that fails its
 * own tests - or fails to generate or parse at all - is discarded here;
 * this returns null in every failure case, so the caller can fall straight
 * back to the normal static pool without the student ever seeing a broken
 * task or an error message about it.
 */
export async function generateVerifiedBossTask(opts: {
  track: TrackKey;
  topic: string;
  topicLabel: string;
  topicBlurb: string;
  level: number;
}): Promise<Challenge | null> {
  try {
    const { challenge, referenceSolution } = await generateBossTask({ data: opts });
    const tests = challenge.tests as unknown as TestCase[];
    const outcome = await runTests(referenceSolution, tests);
    if (!outcome.passed) return null;
    return challenge as unknown as Challenge;
  } catch {
    return null;
  }
}
