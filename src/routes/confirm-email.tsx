import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Search = { token_hash?: string; type?: string };

const VALID_TYPES = ["signup", "recovery", "magiclink", "invite", "email_change", "email"];

export const Route = createFileRoute("/confirm-email")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ...(typeof search["token_hash"] === "string" ? { token_hash: search["token_hash"] } : {}),
    ...(typeof search["type"] === "string" ? { type: search["type"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Confirm — H-Code" },
      { name: "description", content: "Confirm your email link." },
    ],
  }),
  component: ConfirmEmail,
});

// Email links point here, on our own domain, instead of straight at the
// auth server: school networks block the auth server's *.railway.app host
// outright, and mail scanners (common on school accounts) pre-fetch every
// link in an email, which uses up a one-time token before the student ever
// clicks. Verifying only on an explicit button press, from the browser,
// avoids both - a scanner's plain GET of this page never consumes anything.
function ConfirmEmail() {
  const { token_hash, type } = Route.useSearch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = !!token_hash && !!type && VALID_TYPES.includes(type);
  const isRecovery = type === "recovery";

  const confirm = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.verifyOtp({
      token_hash: token_hash!,
      type: type as EmailOtpType,
    });
    if (err) {
      setBusy(false);
      setError(
        "This link has expired or already been used. Go back to the sign-in page and request a new one.",
      );
      return;
    }
    if (isRecovery) {
      // /auth decides "show the new-password form" from this hash on first
      // render (see isRecoveryUrl there); a full load keeps that simple.
      window.location.assign("/auth#type=recovery");
    } else {
      void navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm items-center px-4">
      <div className="panel w-full space-y-4 p-6">
        <p className="font-mono text-sm text-primary">&gt;_ H-Code</p>
        {valid ? (
          <>
            <h1 className="text-2xl font-bold">
              {isRecovery ? "Reset your password" : "Confirm your email"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRecovery
                ? "Press the button to carry on and choose a new password."
                : "Press the button to finish confirming your email."}
            </p>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-full" onClick={confirm} disabled={busy}>
              {busy ? "One moment…" : "Continue"}
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Link not valid</h1>
            <p className="text-sm text-muted-foreground">
              This link is incomplete. Go back to the sign-in page and request a new one.
            </p>
          </>
        )}
        <a href="/auth" className="block text-sm text-muted-foreground underline">
          Back to sign in
        </a>
      </div>
    </div>
  );
}
