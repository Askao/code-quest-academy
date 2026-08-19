import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [settings, setSettings] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["admin"],
    enabled: isAdmin,
    queryFn: async () => {
      const [profiles, roles, appSettings, challenges, classes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("user_roles").select("*"),
        supabase.from("app_settings").select("*"),
        supabase.from("challenges").select("id, track"),
        supabase.from("classes").select("id"),
      ]);
      return {
        profiles: profiles.data ?? [],
        roles: roles.data ?? [],
        settings: appSettings.data ?? [],
        challenges: challenges.data ?? [],
        classes: classes.data ?? [],
      };
    },
  });

  const setRole = async (userId: string, role: RoleKey) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) toast.error(error.message);
    else {
      toast.success(`Role set to ${role}`);
      void qc.invalidateQueries({ queryKey: ["admin"] });
    }
  };

  const saveSetting = async (key: string) => {
    const value = settings[key] ?? "";
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  if (!isAdmin) return <p className="text-muted-foreground">Admins only.</p>;

  const roleOf = (id: string) =>
    (data?.roles.find((r) => r.user_id === id)?.role ?? "student") as RoleKey;

  const settingValue = (key: string) =>
    settings[key] ?? String(data?.settings.find((s) => s.key === key)?.value ?? "");

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
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left font-mono text-xs text-muted-foreground">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {(data?.profiles ?? []).map((p) => (
                <tr key={p.id} className="border-b border-border/60">
                  <td className="p-3 font-medium">{p.full_name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{p.email}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
