import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

type UserRole = "student" | "teacher" | "admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateRole: (newRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => {},
  updateRole: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Resolve role for a user session.
   * Priority: user_roles table → user_metadata.role → "student"
   */
  const resolveRole = async (currentSession: Session): Promise<UserRole> => {
    const userId = currentSession.user.id;

    // 1. Try DB table first
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (data?.role) {
      return data.role as UserRole;
    }

    // 2. Fall back to user_metadata (set during sign-up)
    const metaRole = currentSession.user.user_metadata?.role as UserRole | undefined;
    if (metaRole === "teacher" || metaRole === "admin") {
      // Sync it to the DB so future lookups succeed
      await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: metaRole }, { onConflict: "user_id" });
      return metaRole;
    }

    return "student";
  };

  useEffect(() => {
    let cancelled = false;

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (cancelled) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // defer to avoid Supabase client deadlock
          setTimeout(async () => {
            if (cancelled) return;
            const resolved = await resolveRole(newSession);
            if (!cancelled) setRole(resolved);
            if (!cancelled) setLoading(false);
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    // Initial session check on mount
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (cancelled) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        const resolved = await resolveRole(initialSession);
        if (!cancelled) setRole(resolved);
      }
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const updateRole = async (newRole: UserRole) => {
    if (!user) return;

    // Update Supabase auth metadata
    const { error: metaErr } = await supabase.auth.updateUser({
      data: { role: newRole },
    });
    if (metaErr) throw metaErr;

    // Upsert into user_roles table
    const { error: tableErr } = await supabase
      .from("user_roles")
      .upsert({ user_id: user.id, role: newRole }, { onConflict: "user_id" });
    if (tableErr) throw tableErr;

    setRole(newRole);
    toast.success(`Switched to ${newRole} view`);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut, updateRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
