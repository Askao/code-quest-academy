import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fillMissingHomework } from "@/lib/homework-late-join";
import { parseJoinCode } from "@/lib/join-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Found = { code: string; name: string; track: "gcse" | "alevel"; board: string };

/**
 * For a student who isn't in a class yet: type the code (or paste the invite
 * link) from your teacher. It shows which class the code belongs to and asks
 * before joining, so a mistyped code that happens to be real doesn't quietly
 * put someone in the wrong class.
 */
export function JoinClassBox({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lookUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = parseJoinCode(text);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setBusy(true);
    const { data, error: rpcError } = await supabase.rpc("class_for_join_code", {
      _code: parsed.code,
    });
    setBusy(false);
    const cls = data?.[0];
    if (rpcError || !cls) {
      setError("No class has that code. Check it with your teacher and try again.");
      return;
    }
    setFound({ code: parsed.code, name: cls.name, track: cls.track, board: cls.board });
  };

  const join = async () => {
    if (!found) return;
    setBusy(true);
    const { error: joinError } = await supabase.rpc("join_class_by_code", { _code: found.code });
    if (joinError) {
      setBusy(false);
      setError(joinError.message);
      setFound(null);
      return;
    }
    // Homework already set for the class needs a task list for the newcomer.
    await fillMissingHomework(userId).catch((err) => console.error("fillMissingHomework", err));
    await qc.invalidateQueries();
    setBusy(false);
    toast.success(`You've joined ${found.name}`);
  };

  if (found) {
    return (
      <div className="mt-3 rounded-lg border border-border p-4 text-sm">
        <p className="font-mono text-xs tracking-[0.15em] text-muted-foreground uppercase">
          Join this class?
        </p>
        <p className="mt-1 text-lg font-semibold">{found.name}</p>
        <p className="text-muted-foreground">
          {found.track === "gcse" ? `GCSE · ${found.board.toUpperCase()}` : "A level"}
        </p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={join} disabled={busy}>
            {busy ? "Joining…" : "Yes, join"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setFound(null)} disabled={busy}>
            Not my class
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={lookUp} className="mt-3" aria-label="Join a class">
      <label htmlFor="join-code" className="text-sm font-medium">
        Got a join code from your teacher?
      </label>
      <div className="mt-2 flex gap-2">
        <Input
          id="join-code"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          placeholder="e.g. K7M2XQ"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="font-mono uppercase"
        />
        <Button type="submit" disabled={busy}>
          {busy ? "Checking…" : "Find class"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          You can also paste the link your teacher sent.
        </p>
      )}
    </form>
  );
}
