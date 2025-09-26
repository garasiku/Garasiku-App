import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ADMIN, SECRETARY, DRIVER, OWNER, WSHEAD } from "./constants";

type AuthContextType = {
  user: any;
  role: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  isOwner: boolean;
  isSecretary: boolean;
  isWSHead: boolean;
  isDriver: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isAuthenticated: false,
  loading: true,
  isOwner: false,
  isSecretary: false,
  isWSHead: false,
  isDriver: false,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.warn("getUser error", error);
      }

      const currentUser = data?.user ?? null;
      setUser(currentUser);
      setRole(currentUser?.user_metadata?.role ?? null);
      setLoading(false);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      setRole(sessionUser?.user_metadata?.role ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const isOwner = role === OWNER;
  const isSecretary = role === SECRETARY;
  const isWSHead = role === WSHEAD;
  const isDriver = role === DRIVER;
  const isAdmin = role === ADMIN;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        loading,
        isOwner,
        isSecretary,
        isWSHead,
        isDriver,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
