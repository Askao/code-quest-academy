import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/join/$code")({
  head: () => ({
    meta: [
      { title: "Join a class — H-Code" },
      { name: "description", content: "Join your teacher's class on H-Code." },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const { data: cls, isLoading } = useQuery({
    queryKey: ["join-code", code],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("class_for_join_code", { _code: code });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  const joinClass = async (userId: string) => {
    if (!cls) return;
    const { error } = await supabase
      .from("class_members")
      .insert({ class_id: cls.id, student_id: userId });
    if (error && error.code !== "23505") {
      toast.error(`Signed in, but couldn't join the class: ${error.message}`);
    }
  };

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
            data: { full_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (data.session && data.user) {
          await joinClass(data.user.id);
          void navigate({ to: "/dashboard" });
        } else {
          toast.success("Account created — check your email to confirm, then sign in.");
          setMode("signin");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) await joinClass(data.user.id);
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
          &gt;_ H-Code
        </Link>

        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Checking your invite…</p>
        ) : !cls ? (
          <>
            <h1 className="mt-4 text-2xl font-bold">Link not valid</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This join link doesn't match a class — ask your teacher for a new one.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/auth">Go to sign in</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="mt-4 font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
              You're invited to join
            </p>
            <h1 className="mt-1 text-2xl font-bold">{cls.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {cls.track === "gcse" ? "GCSE · OCR" : "A LEVEL"}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "signup" ? (
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
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
                {busy
                  ? "Please wait…"
                  : mode === "signup"
                    ? "Create account & join"
                    : "Sign in & join"}
              </Button>
            </form>

            <button
              className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            >
              {mode === "signup"
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
