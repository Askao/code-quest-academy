import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSchool, joinSchool } from "@/lib/school";

type Search = { mode?: "signin" | "signup"; role?: "student" | "teacher" };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode: search["mode"] === "signup" ? "signup" : "signin",
    role: search["role"] === "teacher" ? "teacher" : "student",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — H-Code" },
      { name: "description", content: "Sign in or create a free H-Code account." },
      { property: "og:title", content: "Sign in — H-Code" },
      { property: "og:description", content: "Sign in or create a free H-Code account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode ?? "signin");
  const [role, setRole] = useState<"student" | "teacher">(search.role ?? "student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [schoolMode, setSchoolMode] = useState<"skip" | "create" | "join">("skip");
  const [schoolName, setSchoolName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [busy, setBusy] = useState(false);
  // Set only by a PASSWORD_RECOVERY auth event - Supabase fires this itself
  // once it detects a recovery-type session in the URL after the reset-email
  // link redirects back here, so this can't be reached by just navigating to
  // a mode= search param the way signin/signup/forgot can.
  const [recovering, setRecovering] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  // Defaults to hidden - only shown once we positively confirm no admin
  // exists yet, so there's no flash of the message on a normal deployment
  // (which is every deployment past its very first signup).
  const [showAdminNotice, setShowAdminNotice] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      // A recovery session is still a real session, so the plain "already
      // signed in, bounce to dashboard" check has to skip it - otherwise
      // the set-new-password form the PASSWORD_RECOVERY listener is about
      // to show never gets a chance to render.
      if (data.session && !recovering) void navigate({ to: "/dashboard" });
    });
  }, [navigate, recovering]);

  useEffect(() => {
    void supabase.rpc("admin_exists").then(({ data }) => {
      if (data === false) setShowAdminNotice(true);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("Check your email for a password reset link.");
        setMode("signin");
        return;
      }
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
        // GoTrue deliberately returns success with no error for an email
        // that's already confirmed (an empty identities array is the only
        // tell) rather than an explicit error, so a signup attempt can't be
        // used to probe which emails are registered. Still worth surfacing
        // clearly here, since the person typing is the account owner, not
        // an attacker probing from outside.
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          toast.error("An account with this email already exists — try signing in instead.");
          setMode("signin");
          return;
        }
        if (data.session) {
          // Only possible with an immediate session (no email confirmation
          // step in the way) - otherwise there's no signed-in user yet to
          // attach a school to. The Teacher area offers this same create/join
          // action any time later, so skipping it here isn't a dead end.
          if (role === "teacher" && schoolMode !== "skip" && data.user) {
            const result =
              schoolMode === "create"
                ? await createSchool(data.user.id, schoolName)
                : await joinSchool(data.user.id, schoolCode);
            if (!result.ok) {
              toast.error(`Account created, but couldn't set up your school: ${result.error}`);
            }
          }
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

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated.");
      void navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (recovering) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="panel w-full max-w-md p-8">
          <Link to="/" className="font-mono text-sm text-primary">
            &gt;_ H-Code
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a new password for your account.
          </p>
          <form onSubmit={submitNewPassword} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm new password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                minLength={6}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : "Set password"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="panel w-full max-w-md p-8">
        <Link to="/" className="font-mono text-sm text-primary">
          &gt;_ H-Code
        </Link>
        <h1 className="mt-4 text-2xl font-bold">
          {mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signup"
            ? "Free for students and teachers."
            : mode === "forgot"
              ? "We'll email you a link to set a new password."
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
              {role === "teacher" ? (
                <div className="space-y-2">
                  <Label>
                    School{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional — can do this later)
                    </span>
                  </Label>
                  <div className="flex gap-2">
                    {(
                      [
                        { key: "skip", label: "Skip" },
                        { key: "create", label: "Create" },
                        { key: "join", label: "Join" },
                      ] as const
                    ).map((opt) => (
                      <Button
                        key={opt.key}
                        type="button"
                        variant={schoolMode === opt.key ? "default" : "secondary"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setSchoolMode(opt.key)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                  {schoolMode === "create" ? (
                    <Input
                      placeholder="e.g. Riverside Academy"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                    />
                  ) : null}
                  {schoolMode === "join" ? (
                    <Input
                      placeholder="Join code from a colleague"
                      value={schoolCode}
                      onChange={(e) => setSchoolCode(e.target.value)}
                    />
                  ) : null}
                </div>
              ) : null}
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
          {mode === "forgot" ? null : (
            <>
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
              {mode === "signup" ? (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              ) : null}
            </>
          )}
          {mode === "signin" ? (
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMode("forgot")}
            >
              Forgot password?
            </button>
          ) : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "signup"
                ? "Create account"
                : mode === "forgot"
                  ? "Send reset link"
                  : "Sign in"}
          </Button>
        </form>

        <button
          className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setMode(mode === "signup" ? "signin" : mode === "forgot" ? "signin" : "signup")}
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : mode === "forgot"
              ? "Back to sign in"
              : "New here? Create an account"}
        </button>
        {showAdminNotice ? (
          <p className="mt-4 text-center font-mono text-xs text-muted-foreground">
            The first account created on a fresh install becomes the admin.
          </p>
        ) : null}
      </div>
    </div>
  );
}
