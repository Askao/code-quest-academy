import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function makeCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function Teacher() {
  const { user, isTeacher } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [track, setTrack] = useState<TrackKey>("gcse");
  const [improvedWindowDays, setImprovedWindowDays] = useState(7);

  const { data: classes } = useQuery({
    queryKey: ["teacher-classes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [owned, coTaught] = await Promise.all([
        supabase
          .from("classes")
          .select("*, class_members(count)")
          .eq("teacher_id", user!.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("class_co_teachers")
          .select("classes(*, class_members(count))")
          .eq("teacher_id", user!.id),
      ]);
      const mine = (owned.data ?? []).map((c) => ({ ...c, shared: false }));
      const shared = (coTaught.data ?? [])
        .map((r) => r.classes)
        .filter((c): c is NonNullable<typeof c> => !!c)
        .map((c) => ({ ...c, shared: true }));
      const seen = new Set(mine.map((c) => c.id));
      return [...mine, ...shared.filter((c) => !seen.has(c.id))];
    },
  });

  const createClass = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("classes").insert({
      name: name.trim(),
      track,
      teacher_id: user!.id,
      join_code: makeCode(),
      improved_window_days: improvedWindowDays,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Class created");
      setName("");
      void qc.invalidateQueries({ queryKey: ["teacher-classes"] });
    }
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
