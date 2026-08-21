import { supabase } from "@/integrations/supabase/client";

export function makeJoinCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export type SchoolActionResult = { ok: true; schoolName: string } | { ok: false; error: string };

// Sweeps up any of this teacher's existing classes that aren't attached to
// a school yet - covers both "creating/joining a school after already
// having classes" and the signup-time path, with the same one call.
async function attachToSchool(
  userId: string,
  schoolId: string,
  schoolName: string,
): Promise<SchoolActionResult> {
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ school_id: schoolId })
    .eq("id", userId);
  if (profileError) return { ok: false, error: profileError.message };

  await supabase
    .from("classes")
    .update({ school_id: schoolId })
    .eq("teacher_id", userId)
    .is("school_id", null);

  return { ok: true, schoolName };
}

export async function createSchool(userId: string, name: string): Promise<SchoolActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Give the school a name" };
  const { data: school, error } = await supabase
    .from("schools")
    .insert({ name: trimmed, join_code: makeJoinCode(), created_by: userId })
    .select("id, name")
    .single();
  if (error || !school) return { ok: false, error: error?.message ?? "Could not create school" };
  return attachToSchool(userId, school.id, school.name);
}

export async function joinSchool(userId: string, code: string): Promise<SchoolActionResult> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { ok: false, error: "Enter a join code" };
  const { data, error } = await supabase.rpc("school_for_join_code", { _code: trimmed });
  const school = data?.[0];
  if (error || !school) return { ok: false, error: "No school found with that code" };
  return attachToSchool(userId, school.id, school.name);
}
