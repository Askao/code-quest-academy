import { supabase } from "@/integrations/supabase/client";

export function makeJoinCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export type SchoolActionResult = { ok: true; schoolName: string } | { ok: false; error: string };
export type SimpleResult = { ok: true } | { ok: false; error: string };

async function currentSchoolId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", userId)
    .maybeSingle();
  return data?.school_id ?? null;
}

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
  if (await currentSchoolId(userId)) {
    return { ok: false, error: "You're already part of a school — leave it first to switch." };
  }
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
  if (await currentSchoolId(userId)) {
    return { ok: false, error: "You're already part of a school — leave it first to switch." };
  }
  const { data, error } = await supabase.rpc("school_for_join_code", { _code: trimmed });
  const school = data?.[0];
  if (error || !school) return { ok: false, error: "No school found with that code" };
  return attachToSchool(userId, school.id, school.name);
}

// Leaving takes every class this teacher owns out of the school with them
// - classes they only co-teach for someone else aren't touched, since they
// don't own those. Explicit class_co_teachers grants on their own classes
// are untouched too (sticky invites survive a school change); it's only
// the automatic same-school access (see is_class_teacher()) that ends,
// immediately, since that's derived live from school_id.
//
// If the leaver is the school's creator, the leave_school() function deletes
// the school outright and detaches every other teacher and class in it too
// - same end state as if each of them had individually left. Handled
// server-side (not here) so it's atomic and can't be triggered by anyone
// but the actual creator.
export async function leaveSchool(schoolId: string): Promise<SimpleResult> {
  const { error } = await supabase.rpc("leave_school", { _school_id: schoolId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
