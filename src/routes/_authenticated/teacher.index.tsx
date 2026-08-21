import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSchool, joinSchool, leaveSchool, makeJoinCode } from "@/lib/school";
import type { TrackKey } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/teacher/")({
  head: () => ({
    meta: [
      { title: "Teacher — H-Code" },
      { name: "description", content: "Create classes, set homework and track your students." },
      { property: "og:title", content: "Teacher — H-Code" },
      {
        property: "og:description",
        content: "Create classes, set homework and track your students.",
      },
    ],
  }),
  component: Teacher,
});

const CLASS_CAP = 25;
const CLASS_COOLDOWN_MS = 60_000;

function Teacher() {
  const { user, isTeacher, schoolId, refresh } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [track, setTrack] = useState<TrackKey>("gcse");
  const [improvedWindowDays, setImprovedWindowDays] = useState(7);
  const [schoolName, setSchoolName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [schoolBusy, setSchoolBusy] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const { data: classes } = useQuery({
    queryKey: ["teacher-classes", user?.id, schoolId],
    enabled: !!user,
    queryFn: async () => {
      const [owned, coTaught, schoolClasses] = await Promise.all([
        supabase
          .from("classes")
          .select("*, class_members(count)")
          .eq("teacher_id", user!.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("class_co_teachers")
          .select("classes(*, class_members(count))")
          .eq("teacher_id", user!.id),
        // Every teacher at the same school now gets automatic access to
        // every class in it (see is_class_teacher()) - so this list needs
        // to show them too, not just explicit co-teacher invites.
        schoolId
          ? supabase
              .from("classes")
              .select("*, class_members(count)")
              .eq("school_id", schoolId)
              .neq("teacher_id", user!.id)
          : Promise.resolve({ data: [] }),
      ]);
      const mine = (owned.data ?? []).map((c) => ({ ...c, shared: false }));
      const sharedRaw = [
        ...(coTaught.data ?? []).map((r) => r.classes).filter(Boolean),
        ...(schoolClasses.data ?? []),
      ] as NonNullable<typeof owned.data>[number][];
      const seen = new Set(mine.map((c) => c.id));
      const shared: typeof mine = [];
      for (const c of sharedRaw) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        shared.push({ ...c, shared: true });
      }
      return [...mine, ...shared];
    },
  });

  const { data: school } = useQuery({
    queryKey: ["teacher-school", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data } = await supabase
        .from("schools")
        .select("name, join_code, created_by")
        .eq("id", schoolId!)
        .maybeSingle();
      return data;
    },
  });

  // Owned classes only - a colleague covering someone else's class
  // shouldn't be blocked by that class's owner's own creation history.
  const ownedClasses = (classes ?? []).filter((c) => !c.shared);
  const ownedSchoolClassCount = ownedClasses.filter((c) => c.school_id === schoolId).length;
  const isSchoolOwner = !!school && school.created_by === user?.id;
  // The full class list already includes every class in the school (mine
  // plus every colleague's, via automatic same-school access) - exactly
  // what the owner needs to know is about to be detached.
  const schoolClassCount = (classes ?? []).filter((c) => c.school_id === schoolId).length;

  const createClass = async () => {
    if (!name.trim()) return;
    if (ownedClasses.length >= CLASS_CAP) {
      toast.error(
        `You've hit the ${CLASS_CAP}-class limit — delete an old class first, or ask an admin for more.`,
      );
      return;
    }
    const lastCreated = ownedClasses[0]?.created_at ? new Date(ownedClasses[0].created_at) : null;
    if (lastCreated && Date.now() - lastCreated.getTime() < CLASS_COOLDOWN_MS) {
      toast.error("Give it a moment — you can only create one class per minute.");
      return;
    }
    const { error } = await supabase.from("classes").insert({
      name: name.trim(),
      track,
      teacher_id: user!.id,
      join_code: makeJoinCode(),
      improved_window_days: improvedWindowDays,
      ...(schoolId ? { school_id: schoolId } : {}),
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Class created");
      setName("");
      void qc.invalidateQueries({ queryKey: ["teacher-classes"] });
    }
  };

  const handleCreateSchool = async () => {
    if (!user) return;
    setSchoolBusy(true);
    const result = await createSchool(user.id, schoolName);
    setSchoolBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${result.schoolName} created — share its join code with colleagues`);
    setSchoolName("");
    await refresh();
    void qc.invalidateQueries({ queryKey: ["teacher-classes"] });
  };

  const handleJoinSchool = async () => {
    if (!user) return;
    setSchoolBusy(true);
    const result = await joinSchool(user.id, schoolCode);
    setSchoolBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Joined ${result.schoolName}`);
    setSchoolCode("");
    await refresh();
    void qc.invalidateQueries({ queryKey: ["teacher-classes"] });
  };

  const copySchoolCode = async () => {
    if (!school?.join_code) return;
    await navigator.clipboard.writeText(school.join_code);
    toast.success("School join code copied");
  };

  const handleLeaveSchool = async () => {
    if (!user || !schoolId) return;
    setSchoolBusy(true);
    const result = await leaveSchool(schoolId);
    setSchoolBusy(false);
    setConfirmingLeave(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      isSchoolOwner
        ? "School deleted — everyone's classes went back out with them"
        : "You've left the school — your classes went with you",
    );
    await refresh();
    void qc.invalidateQueries({ queryKey: ["teacher-classes"] });
  };

  if (!isTeacher) {
    return <p className="text-muted-foreground">This area is for teachers.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Teacher area</h1>
        <p className="mt-1 text-muted-foreground">
          Create a class, share the join code, then set homework and watch progress.
        </p>
      </div>

      <div className="panel space-y-3 p-5">
        <h2 className="text-lg font-semibold">Your school</h2>
        {schoolId ? (
          <>
            <p className="text-sm text-muted-foreground">
              You're part of <span className="text-foreground font-medium">{school?.name}</span> —
              every teacher there automatically gets full access to every class in it (roster,
              homework, lessons), the same as an explicitly-added co-teacher, no invite needed. You
              can only be in one school at a time.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-border bg-secondary/40 px-2 py-1 font-mono text-xs text-muted-foreground">
                {school?.join_code}
              </span>
              <Button size="sm" variant="secondary" onClick={copySchoolCode}>
                Copy code
              </Button>
            </div>
            {!confirmingLeave ? (
              <Button size="sm" variant="secondary" onClick={() => setConfirmingLeave(true)}>
                {isSchoolOwner ? "Delete school" : "Leave school"}
              </Button>
            ) : (
              <div className="space-y-2 rounded-lg border border-border bg-secondary/10 p-3">
                {isSchoolOwner ? (
                  <p className="text-sm">
                    You created {school?.name} — leaving deletes it entirely.{" "}
                    <strong>
                      Every teacher in it loses access, and all {schoolClassCount} class
                      {schoolClassCount === 1 ? "" : "es"}
                    </strong>{" "}
                    (yours and theirs) go back to having no school, exactly as if each teacher had
                    left individually. Explicit co-teacher invites aren't affected.
                  </p>
                ) : (
                  <p className="text-sm">
                    Leaving takes{" "}
                    <strong>
                      {ownedSchoolClassCount} class{ownedSchoolClassCount === 1 ? "" : "es"}
                    </strong>{" "}
                    you own out of {school?.name} with you, and ends your colleagues' automatic
                    access to them immediately. Classes you only co-teach for someone else aren't
                    affected.
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleLeaveSchool}
                    disabled={schoolBusy}
                  >
                    {schoolBusy
                      ? isSchoolOwner
                        ? "Deleting…"
                        : "Leaving…"
                      : isSchoolOwner
                        ? "Yes, delete for everyone"
                        : "Yes, leave"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setConfirmingLeave(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Not everyone using H-Code is from the same school. You can only be part of one school
              at a time — create one, or join a colleague's with their code, and every class you
              currently own moves with you into it automatically (leaving later takes them back out
              with you too).
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Riverside Academy"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                />
                <Button onClick={handleCreateSchool} disabled={schoolBusy}>
                  Create
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Join code"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                />
                <Button variant="secondary" onClick={handleJoinSchool} disabled={schoolBusy}>
                  Join
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="panel space-y-3 p-5">
        <h2 className="text-lg font-semibold">New class</h2>
        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-xs"
            placeholder="e.g. Year 10 Computer Science"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="rounded-md border border-border bg-card px-3 py-2 text-sm"
            value={track}
            onChange={(e) => setTrack(e.target.value as TrackKey)}
          >
            <option value="gcse">GCSE (OCR)</option>
            <option value="alevel">A level</option>
          </select>
          <select
            className="rounded-md border border-border bg-card px-3 py-2 text-sm"
            value={improvedWindowDays}
            onChange={(e) => setImprovedWindowDays(Number(e.target.value))}
          >
            <option value={7}>Most improved: last 7 days</option>
            <option value={14}>Most improved: last 14 days</option>
            <option value={30}>Most improved: last 30 days</option>
          </select>
          <Button onClick={createClass}>Create class</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The "most improved" window sets how far back that class's leaderboard looks for XP gained
          — pick whatever fits how often you want it to reset.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(classes ?? []).map((c) => (
          <div key={c.id} className="panel p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{c.name}</p>
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                {c.shared ? (
                  <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
                    Shared with you
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-xs ${
                    c.track === "gcse" ? "bg-gcse/15 text-gcse" : "bg-alevel/15 text-alevel"
                  }`}
                >
                  {c.track === "gcse" ? "GCSE" : "A LEVEL"}
                </span>
              </div>
            </div>
            <p className="mt-3 font-mono text-sm">
              Join code: <span className="text-primary">{c.join_code}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {c.class_members?.[0]?.count ?? 0} student(s)
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link to="/teacher/$classId" params={{ classId: c.id }}>
                Open class
              </Link>
            </Button>
          </div>
        ))}
        {(classes ?? []).length === 0 ? (
          <p className="text-muted-foreground">No classes yet — create your first one above.</p>
        ) : null}
      </div>
    </div>
  );
}
