import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "teacher" | "student";

type AuthState = {
  user: User | null;
  roles: Role[];
  fullName: string;
  loading: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  roles: [],
  fullName: "",
  loading: true,
  isTeacher: false,
  isAdmin: false,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProfile = async (id: string) => {
    const [{ data: roleRows }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", id),
      supabase.from("profiles").select("full_name").eq("id", id).maybeSingle(),
    ]);
    setRoles(((roleRows ?? []).map((r) => r.role) as Role[]) ?? []);
    setFullName(profile?.full_name ?? "");
  };

  const refresh = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
    if (data.user) await loadProfile(data.user.id);
    else {
      setRoles([]);
      setFullName("");
    }
    setLoading(false);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setRoles([]);
        setFullName("");
        setLoading(false);
        return;
      }
      if (session?.user) {
        setUser(session.user);
        setLoading(false);
        void loadProfile(session.user.id);
      }
    });
    void refresh();
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        fullName,
        loading,
        isTeacher: roles.includes("teacher") || roles.includes("admin"),
        isAdmin: roles.includes("admin"),
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
