import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Menu, X, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { completedTaskSlugs } from "@/lib/content";

function NavLink({ to, children, onClick }: { to: string; children: ReactNode; onClick?: () => void }) {
  return (
    <Link
      to={to as never}
      onClick={onClick}
      className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      activeProps={{ className: "bg-secondary text-foreground" }}
    >
      {children}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isTeacher, isAdmin, fullName } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Recap only has anything eligible once at least one lesson is complete -
  // for a brand new account it would otherwise be an empty, confusing page.
  const { data: hasRecap = false } = useQuery({
    queryKey: ["has-recap-material", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const [passedRes, quizRes] = await Promise.all([
        supabase
          .from("attempts")
          .select("passed, challenges!inner(slug)")
          .eq("user_id", uid)
          .eq("passed", true),
        supabase.from("quiz_attempts").select("lesson_slug").eq("user_id", uid).eq("passed", true),
      ]);
      const passedSlugs = new Set(
        ((passedRes.data ?? []) as unknown as { challenges: { slug: string } }[]).map(
          (r) => r.challenges.slug,
        ),
      );
      const quizPassed = new Set((quizRes.data ?? []).map((r) => r.lesson_slug));
      return completedTaskSlugs("gcse", passedSlugs, quizPassed).size > 0;
    },
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  };

  const closeMenu = () => setMenuOpen(false);

  const navLinks = (
    <>
      <NavLink to="/dashboard" onClick={closeMenu}>
        Dashboard
      </NavLink>
      <NavLink to="/learn" onClick={closeMenu}>
        Lessons
      </NavLink>
      <NavLink to="/practice" onClick={closeMenu}>
        Practise
      </NavLink>
      {hasRecap ? (
        <NavLink to="/recap" onClick={closeMenu}>
          Recap
        </NavLink>
      ) : null}
      <NavLink to="/ide" onClick={closeMenu}>
        IDE
      </NavLink>
      <NavLink to="/duels" onClick={closeMenu}>
        Duels
      </NavLink>
      <NavLink to="/leaderboard" onClick={closeMenu}>
        Leaderboard
      </NavLink>
      {isTeacher ? (
        <NavLink to="/teacher" onClick={closeMenu}>
          Teacher
        </NavLink>
      ) : null}
      {isAdmin ? (
        <NavLink to="/admin" onClick={closeMenu}>
          Admin
        </NavLink>
      ) : null}
    </>
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <Link to={user ? "/dashboard" : "/"} className="mr-2 font-mono text-lg font-bold text-primary">
            &gt;_ H-Code
          </Link>

          {user ? (
            <>
              <nav className="hidden flex-wrap items-center gap-1 sm:flex">{navLinks}</nav>
              <button
                className="ml-1 rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground sm:hidden"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <NavLink to="/ide">IDE</NavLink>
          )}

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {isAdmin ? "Admin" : isTeacher ? "Teacher" : fullName}
                </span>
                <Link
                  to="/account"
                  className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Account"
                >
                  <UserRound className="h-4 w-4" />
                </Link>
                <Button variant="secondary" size="sm" onClick={signOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <Button asChild variant="secondary" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
        {user && menuOpen ? (
          <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 sm:hidden">
            {navLinks}
          </nav>
        ) : null}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
