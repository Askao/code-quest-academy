import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — H-Code" },
      { name: "description", content: "Manage users, roles and site settings." },
      { property: "og:title", content: "Admin — H-Code" },
      { property: "og:description", content: "Manage users, roles and site settings." },
    ],
  }),
  component: Admin,
});

type RoleKey = "student" | "teacher" | "admin";

function Admin() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    maskedName: string;
    maskedEmail: string;
  } | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [onlyNoClass, setOnlyNoClass] = useState(false);
  const [moveTarget, setMoveTarget] = useState<{
    studentId: string;
    studentLabel: string;
    fromLabel: string;
    toClassId: string | null;
    toLabel: string;
  } | null>(null);
  const [moving, setMoving] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin"],
    enabled: isAdmin,
    queryFn: async () => {
      // Masking happens inside admin_list_users() itself (in Postgres),
      // not here - unmasked names/emails never leave the database for an
      // admin's browser, so there's nothing to redact client-side and
      // nothing sensitive sitting in a network response to inspect.
      const [profiles, roles, appSettings, challenges, classes, members] = await Promise.all([
        supabase.rpc("admin_list_users"),
        supabase.from("user_roles").select("*"),
        supabase.from("app_settings").select("*"),
        supabase.from("challenges").select("id, track"),
        supabase.from("classes").select("id, name, track, teacher_id"),
        supabase.from("class_members").select("class_id, student_id"),
      ]);
      return {
        profiles: profiles.data ?? [],
        roles: roles.data ?? [],
        settings: appSettings.data ?? [],
        challenges: challenges.data ?? [],
        classes: classes.data ?? [],
        members: members.data ?? [],
      };
    },
  });

  const setRole = async (userId: string, role: RoleKey) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) {
      toast.error(error.message);
      return;
    }
    // A promoted-to-staff account isn't a student anymore - leaving their
    // old class_members row behind is exactly what let a promoted teacher
    // keep showing up ranked on leaderboards and as a duel opponent.
    let droppedMembership = false;
    if (role !== "student") {
      const { data: dropped } = await supabase
        .from("class_members")
        .delete()
        .eq("student_id", userId)
        .select("id");
      droppedMembership = (dropped ?? []).length > 0;
    }
    toast.success(
      droppedMembership
        ? `Role set to ${role} — also removed their old class membership`
        : `Role set to ${role}`,
    );
    void qc.invalidateQueries({ queryKey: ["admin"] });
  };

  const moveStudent = async () => {
    if (!moveTarget) return;
    setMoving(true);
    const { error } = await supabase.rpc("admin_set_student_class", {
      _student_id: moveTarget.studentId,
      _class_id: moveTarget.toClassId,
    });
    setMoving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      moveTarget.toClassId
        ? `${moveTarget.studentLabel} is now in ${moveTarget.toLabel}`
        : `${moveTarget.studentLabel} removed from their class`,
    );
    setMoveTarget(null);
    void qc.invalidateQueries({ queryKey: ["admin"] });
  };

  const deleteUser = async () => {
    if (!deleteTarget || confirmText.trim() !== "DELETE") return;
    setDeleting(true);
    const { error } = await supabase.rpc("delete_user_account", { _user_id: deleteTarget.id });
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${deleteTarget.maskedName || deleteTarget.maskedEmail} deleted`);
    setDeleteTarget(null);
    setConfirmText("");
    void qc.invalidateQueries({ queryKey: ["admin"] });
  };

  const saveSetting = async (key: string) => {
    const value = settings[key] ?? "";
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  if (!isAdmin) {
    return (
      <div className="panel p-6">
        <p className="font-medium">🔒 Admins only.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          This page manages every user's role and the site's SMTP settings — only an admin account
          can see it.
        </p>
        <Button asChild className="mt-4">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const roleOf = (id: string) =>
    (data?.roles.find((r) => r.user_id === id)?.role ?? "student") as RoleKey;

  const settingValue = (key: string) =>
    settings[key] ?? String(data?.settings.find((s) => s.key === key)?.value ?? "");

  const teacherName = (id: string) => data?.profiles.find((p) => p.id === id)?.masked_name ?? null;
  const classLabel = (c: { name: string; track: string; teacher_id: string }) => {
    const teacher = teacherName(c.teacher_id);
    return `${c.name} (${c.track === "gcse" ? "GCSE" : "A level"}${teacher ? `, ${teacher}` : ""})`;
  };
  const classesSorted = [...(data?.classes ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, "en-GB"),
  );
  const classIdsOf = (studentId: string) =>
    (data?.members ?? []).filter((m) => m.student_id === studentId).map((m) => m.class_id);
  const classById = (id: string) => data?.classes.find((c) => c.id === id);
  const currentClassLabel = (studentId: string) => {
    const ids = classIdsOf(studentId);
    if (ids.length === 0) return "no class";
    return ids
      .map((id) => {
        const c = classById(id);
        return c ? classLabel(c) : "a class";
      })
      .join(" and ");
  };

  const term = search.trim().toLowerCase();
  const visibleUsers = (data?.profiles ?? []).filter((p) => {
    if (onlyNoClass && (roleOf(p.id) !== "student" || classIdsOf(p.id).length > 0)) return false;
    if (!term) return true;
    return `${p.masked_name ?? ""} ${p.masked_email ?? ""}`.toLowerCase().includes(term);
  });
  const studentsWithoutClass = (data?.profiles ?? []).filter(
    (p) => roleOf(p.id) === "student" && classIdsOf(p.id).length === 0,
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="mt-1 text-muted-foreground">
          Users, roles and the settings your self-hosted deployment reads at runtime.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Users", data?.profiles.length ?? 0],
          ["Classes", data?.classes.length ?? 0],
          ["GCSE challenges", data?.challenges.filter((c) => c.track === "gcse").length ?? 0],
          ["A level challenges", data?.challenges.filter((c) => c.track === "alevel").length ?? 0],
        ].map(([label, value]) => (
          <div key={label as string} className="panel p-5">
            <p className="font-mono text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold text-primary">{value}</p>
          </div>
        ))}
      </div>

      <section className="panel space-y-4 p-5">
        <div>
          <h2 className="text-lg font-semibold">Email (SMTP)</h2>
          <p className="text-sm text-muted-foreground">
            Point the app at your own mailbox. These values are stored in the database so you can
            change them without redeploying when self-hosting.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ["smtp_host", "smtp.yourschool.org"],
            ["smtp_port", "587"],
            ["smtp_user", "noreply@yourschool.org"],
            ["smtp_from", "H-Code <noreply@yourschool.org>"],
          ].map(([key, placeholder]) => (
            <div key={key} className="space-y-1">
              <label className="font-mono text-xs text-muted-foreground">{key}</label>
              <div className="flex gap-2">
                <Input
                  placeholder={placeholder}
                  value={settingValue(key!)}
                  onChange={(e) => setSettings((s) => ({ ...s, [key!]: e.target.value }))}
                />
                <Button variant="secondary" onClick={() => saveSetting(key!)}>
                  Save
                </Button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          The SMTP password is kept as a server secret, never in this table.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Users</h2>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Input
            className="max-w-xs"
            placeholder="Search by name or email"
            aria-label="Search users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyNoClass}
              onChange={(e) => setOnlyNoClass(e.target.checked)}
            />
            Students with no class ({studentsWithoutClass})
          </label>
        </div>
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left font-mono text-xs text-muted-foreground">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Class</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((p) => (
                <tr key={p.id} className="border-b border-border/60">
                  <td className="p-3 font-medium">{p.masked_name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{p.masked_email ?? "—"}</td>
                  <td className="p-3">
                    <select
                      className="rounded-md border border-border bg-card px-2 py-1 text-sm"
                      value={roleOf(p.id)}
                      onChange={(e) => setRole(p.id, e.target.value as RoleKey)}
                    >
                      <option value="student">student</option>
                      <option value="teacher">teacher</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="p-3">
                    {roleOf(p.id) === "student" ? (
                      <select
                        aria-label={`Class for ${p.masked_name ?? p.masked_email ?? "this student"}`}
                        className="max-w-[16rem] rounded-md border border-border bg-card px-2 py-1 text-sm"
                        value={
                          classIdsOf(p.id).length === 1
                            ? classIdsOf(p.id)[0]
                            : classIdsOf(p.id).length === 0
                              ? ""
                              : "many"
                        }
                        onChange={(e) => {
                          const toClassId = e.target.value === "" ? null : e.target.value;
                          const to = toClassId ? classById(toClassId) : null;
                          setMoveTarget({
                            studentId: p.id,
                            studentLabel: p.masked_name ?? p.masked_email ?? "This student",
                            fromLabel: currentClassLabel(p.id),
                            toClassId,
                            toLabel: to ? classLabel(to) : "no class",
                          });
                        }}
                      >
                        <option value="">No class</option>
                        {classIdsOf(p.id).length > 1 ? (
                          <option value="many" disabled>
                            In {classIdsOf(p.id).length} classes
                          </option>
                        ) : null}
                        {classesSorted.map((c) => (
                          <option key={c.id} value={c.id}>
                            {classLabel(c)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {p.id !== user?.id ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setDeleteTarget({
                            id: p.id,
                            maskedName: p.masked_name ?? "",
                            maskedEmail: p.masked_email ?? "",
                          });
                          setConfirmText("");
                        }}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {visibleUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    {onlyNoClass && !term ? "Every student is in a class." : "No users match that."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <AlertDialog
        open={!!moveTarget}
        onOpenChange={(open) => {
          if (!open) setMoveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {moveTarget?.toClassId
                ? "Put this student in the class?"
                : "Take this student out of their class?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{moveTarget?.studentLabel}</strong>{" "}
              {moveTarget?.fromLabel === "no class" ? (
                "isn't in a class yet."
              ) : (
                <>
                  is currently in <strong>{moveTarget?.fromLabel}</strong>.
                </>
              )}
              {moveTarget?.toClassId ? (
                <>
                  {" "}
                  They'll be moved to <strong>{moveTarget.toLabel}</strong> and will see that
                  class's homework, assessments and assigned lessons instead. Their own progress
                  and results are kept.
                </>
              ) : (
                " They'll lose access to that class's homework and assigned lessons, but their own progress is kept."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={moving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={moving}
              onClick={(e) => {
                e.preventDefault();
                void moveStudent();
              }}
            >
              {moving ? "Saving…" : moveTarget?.toClassId ? "Move student" : "Remove from class"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setConfirmText("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes{" "}
              <strong>{deleteTarget?.maskedName || deleteTarget?.maskedEmail}</strong> — their
              profile, progress, class membership and login are gone for good. This can't be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-sm">
              Type <strong>DELETE</strong> to confirm
            </label>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting || confirmText.trim() !== "DELETE"}
              onClick={(e) => {
                e.preventDefault();
                void deleteUser();
              }}
            >
              {deleting ? "Deleting…" : "Permanently delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
