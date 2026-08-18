import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Search = { mode?: "signin" | "signup"; role?: "student" | "teacher" };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode: search["mode"] === "signup" ? "signup" : "signin",
    role: search["role"] === "teacher" ? "teacher" : "student",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — PyForge" },
      { name: "description", content: "Sign in or create a free PyForge account." },
      { property: "og:title", content: "Sign in — PyForge" },
      { property: "og:description", content: "Sign in or create a free PyForge account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [role, setRole] = useState<"student" | "teacher">(search.role ?? "student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name || email.split("@")[0], role },
          },
        });
        if (error) throw error;
        if (data.session) {
          void navigate({ to: "/dashboard" });
        } else {
          toast.success("Account created — check your email to confirm, then sign in.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        void navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="panel w-full max-w-md p-8">
        <Link to="/" className="font-mono text-sm text-primary">
          &gt;_ PyForge
        </Link>
        <h1 className="mt-4 text-2xl font-bold">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signup"
            ? "Free for students and teachers."
            : "Sign in to keep your streak going."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>I am a…</Label>
                <div className="flex gap-2">
                  {(["student", "teacher"] as const).map((r) => (
                    <Button
                      key={r}
                      type="button"
                      variant={role === r ? "default" : "secondary"}
                      className="flex-1 capitalize"
                      onClick={() => setRole(r)}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>

        <button
          className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        >
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
        <p className="mt-4 text-center font-mono text-xs text-muted-foreground">
          The first account created on a fresh install becomes the admin.
        </p>
      </div>
    </div>
  );
}
