import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

function NavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      activeProps={{ className: "bg-secondary text-foreground" }}
    >
      {children}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { isTeacher, isAdmin, fullName } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <Link to="/dashboard" className="mr-2 font-mono text-lg font-bold text-primary">
            &gt;_ PyForge
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/practice">Practise</NavLink>
            <NavLink to="/duels">Duels</NavLink>
            <NavLink to="/leaderboard">Leaderboard</NavLink>
            {isTeacher ? <NavLink to="/teacher">Teacher</NavLink> : null}
            {isAdmin ? <NavLink to="/admin">Admin</NavLink> : null}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{fullName}</span>
            <Button variant="secondary" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
