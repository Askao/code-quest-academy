import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { sb } from "@/lib/assessments-db";
import { BADGES, levelFromXp, skillLabel, skillPercent, topicLabel } from "@/lib/game";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Account — H-Code" },
      { name: "description", content: "Your profile, stats and account settings." },
      { property: "og:title", content: "Account — H-Code" },
      { property: "og:description", content: "Your profile, stats and account settings." },
    ],
  }),
  component: Account,
});

function Account() {
  const { user, fullName, isTeacher, isAdmin } = useAuth();
  const qc = useQueryClient();

  const { data: weekly } = useQuery({
    queryKey: ["weekly-reports-setting", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: row } = await sb
        .from("profiles")
        .select("weekly_reports")
        .eq("id", user!.id)
        .maybeSingle();
      return row?.weekly_reports !== false;
    },
  });
  const setWeekly = async (on: boolean) => {
    const { error } = await sb.from("profiles").update({ weekly_reports: on }).eq("id", user!.id);
    if (error) {
      toast.error("Couldn't save that. Try again in a moment.");
      return;
    }
    qc.setQueryData(["weekly-reports-setting", user?.id], on);
    toast.success(on ? "Weekly emails are on." : "Weekly emails are off.");
  };

  const { data } = useQuery({
    queryKey: ["account", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const [stats, skills, badges, memberships, attempts] = await Promise.all([
        supabase.from("stats").select("*").eq("user_id", uid).maybeSingle(),
        supabase.from("skills").select("*").eq("user_id", uid),
        supabase.from("badges").select("*").eq("user_id", uid),
        supabase.from("class_members").select("class_id, classes(*)").eq("student_id", uid),
        supabase.from("attempts").select("passed").eq("user_id", uid),
      ]);
      const total = attempts.data?.length ?? 0;
      const passed = attempts.data?.filter((a) => a.passed).length ?? 0;
      return {
        stats: stats.data,
        skills: skills.data ?? [],
        badges: badges.data ?? [],
        classes: (memberships.data ?? []).map((m) => m.classes).filter(Boolean),
        totalAttempts: total,
        accuracy: total ? Math.round((passed / total) * 100) : 0,
      };
    },
  });

  const xp = data?.stats?.xp ?? 0;
  const { level } = levelFromXp(xp);
  const role = isAdmin ? "Admin" : isTeacher ? "Teacher" : "Student";
  const earnedBadges = (data?.badges ?? []).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{fullName || "Your account"}</h1>
        <p className="mt-1 font-mono text-xs tracking-[0.15em] text-muted-foreground uppercase">
          {role} · {user?.email}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel p-5">
          <p className="font-mono text-xs text-muted-foreground">LEVEL</p>
          <p className="mt-1 text-3xl font-bold text-primary">{level}</p>
        </div>
        <div className="panel p-5">
          <p className="font-mono text-xs text-muted-foreground">TOTAL XP</p>
          <p className="mt-1 text-3xl font-bold text-accent">{xp}</p>
        </div>
        <div className="panel p-5">
          <p className="font-mono text-xs text-muted-foreground">STREAK</p>
          <p className="mt-1 text-3xl font-bold text-warning">{data?.stats?.streak_days ?? 0} 🔥</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Best: {data?.stats?.best_streak ?? 0} days
          </p>
        </div>
        <div className="panel p-5">
          <p className="font-mono text-xs text-muted-foreground">ACCURACY</p>
          <p className="mt-1 text-3xl font-bold text-success">{data?.accuracy ?? 0}%</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data?.totalAttempts ?? 0} attempt{(data?.totalAttempts ?? 0) === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Skill levels</h2>
        {(data?.skills ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No practice recorded yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.skills ?? [])
              .slice()
              .sort((a, b) => Number(b.level) - Number(a.level))
              .map((s) => {
                const lvl = Number(s.level);
                return (
                  <div key={`${s.track}-${s.topic}`} className="panel p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{topicLabel(s.topic)}</p>
                      <span className="font-mono text-xs text-muted-foreground">
                        {skillPercent(lvl)}%
                      </span>
                    </div>
                    <Progress value={skillPercent(lvl)} className="mt-3" />
                    <p className="mt-2 text-xs text-muted-foreground">{skillLabel(lvl)}</p>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-lg font-semibold">Your classes</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.classes ?? []).map((c) => (
              <li key={c!.id} className="flex items-center justify-between">
                <span>{c!.name}</span>
                <span className="font-mono text-xs text-muted-foreground uppercase">
                  {c!.track}
                </span>
              </li>
            ))}
            {(data?.classes ?? []).length === 0 ? (
              <li className="text-muted-foreground">Not in a class.</li>
            ) : null}
          </ul>
        </div>

        <div className="panel p-5">
          <h2 className="text-lg font-semibold">Badges — {earnedBadges} earned</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {Object.entries(BADGES).map(([key, badge]) => {
              const earned = (data?.badges ?? []).some((b) => b.badge_key === key);
              return (
                <div
                  key={key}
                  className={`rounded-lg border border-border p-3 text-sm ${earned ? "" : "opacity-35"}`}
                >
                  <span className="text-lg">{badge.icon}</span>
                  <p className="font-medium">{badge.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Weekly email</h2>
          <p className="text-sm text-muted-foreground">
            {isTeacher
              ? "A summary of your classes every Monday morning: who needs a nudge, homework progress and papers to mark."
              : "A summary of your week every Sunday evening: homework still to do, what you passed and what to do next."}
          </p>
        </div>
        <Switch
          id="weekly-email"
          aria-label="Weekly email"
          checked={weekly ?? true}
          disabled={weekly === undefined}
          onCheckedChange={(on) => void setWeekly(on)}
        />
      </section>

      <section className="panel space-y-3 p-5">
        <h2 className="text-lg font-semibold">Password</h2>
        <p className="text-sm text-muted-foreground">
          Email isn't set up on this server yet, so this doesn't send anything — ask your admin to
          reset your password for you in the meantime.
        </p>
        <Button disabled>Email me a reset link</Button>
      </section>

      <DeleteAccount />
    </div>
  );
}

/**
 * Deletes the signed-in account for good (delete_my_account() in
 * 20261025130000_delete_own_account.sql). A teacher is told first what
 * happens to each class they own: handed to a co-teacher, or deleted.
 */
function DeleteAccount() {
  const { user, isTeacher } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const { data: owned } = useQuery({
    queryKey: ["owned-classes-for-delete", user?.id],
    enabled: !!user && isTeacher && open,
    queryFn: async () => {
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name")
        .eq("teacher_id", user!.id);
      const ids = (classes ?? []).map((c) => c.id);
      const { data: co } = ids.length
        ? await supabase.from("class_co_teachers").select("class_id").in("class_id", ids)
        : { data: [] as { class_id: string }[] };
      const withCo = new Set((co ?? []).map((r) => r.class_id));
      return {
        handedOver: (classes ?? []).filter((c) => withCo.has(c.id)).map((c) => c.name),
        deleted: (classes ?? []).filter((c) => !withCo.has(c.id)).map((c) => c.name),
      };
    },
  });

  const deleteAccount = async () => {
    setDeleting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("delete_my_account");
    if (error) {
      setDeleting(false);
      toast.error(error.message || "Couldn't delete your account. Try again in a moment.");
      return;
    }
    // The account no longer exists on the server, so only the local session needs clearing.
    await supabase.auth.signOut({ scope: "local" });
    toast.success("Your account has been deleted.");
    void navigate({ to: "/" });
  };

  return (
    <section className="panel space-y-3 border-destructive/40 p-5">
      <h2 className="text-lg font-semibold">Delete account</h2>
      <p className="text-sm text-muted-foreground">
        Permanently deletes your account and everything in it: your progress, code, homework,
        answers and badges. This can't be undone.
      </p>
      <Button
        variant="destructive"
        onClick={() => {
          setConfirmText("");
          setOpen(true);
        }}
      >
        Delete my account
      </Button>

      <AlertDialog open={open} onOpenChange={(o) => !deleting && setOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Everything in your account is deleted straight away and can't be brought back.
                </p>
                {isTeacher && owned && owned.deleted.length > 0 ? (
                  <p>
                    <strong className="text-foreground">These classes will be deleted</strong>, with
                    their homework, and your students will be removed from them:{" "}
                    {owned.deleted.join(", ")}.
                  </p>
                ) : null}
                {isTeacher && owned && owned.handedOver.length > 0 ? (
                  <p>
                    These classes will be handed to their co-teacher instead:{" "}
                    {owned.handedOver.join(", ")}.
                  </p>
                ) : null}
                <p>
                  Type <strong className="font-mono text-foreground">DELETE</strong> to confirm.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            aria-label="Type DELETE to confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={confirmText.trim().toUpperCase() !== "DELETE" || deleting}
              onClick={(e) => {
                e.preventDefault();
                void deleteAccount();
              }}
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
