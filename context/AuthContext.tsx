"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { JwtPayload } from "@supabase/supabase-js";

interface AuthContextType {
  userId: string | null;
  authLoading: boolean;
  isAnonymous: boolean;
  userClaims: JwtPayload | null;
  setUserClaims: React.Dispatch<React.SetStateAction<JwtPayload | null>>,
  ensureAnonymous: () => Promise<void>;
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userClaims, setUserClaims] = useState<JwtPayload | null>(null);

  /* Initial session / claims check */
  /* Minimal auth initialization */
  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getClaims();

      if (error) {
        console.error("Failed to read auth claims", error);
        setAuthLoading(false);
        return;
      }

      const claims = data?.claims ?? null;

      if (claims) {
        setUserClaims(claims);
        setUserId(claims.sub);
        setIsAnonymous(!!claims.is_anonymous);
      } else {
        setUserId(null);
        setIsAnonymous(false);
      }

      setAuthLoading(false);
    };

    init();
    // export type AuthChangeEvent =
    //   | 'INITIAL_SESSION'
    //   | 'PASSWORD_RECOVERY'
    //   | 'SIGNED_IN'
    //   | 'SIGNED_OUT'
    //   | 'TOKEN_REFRESHED'
    //   | 'USER_UPDATED'
    //   | AuthChangeEventMFA

    /* Keep in sync with auth changes */
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user;

        setUserId(u?.id ?? null);
        setIsAnonymous(!!u?.is_anonymous);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /* Create anon ONLY when needed */
  const ensureAnonymous = useCallback(async () => {
    if (userId) return;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;

    setUserId(data?.user?.id ?? null);
    setIsAnonymous(true);
  }, [userId]);

  /* Convert anon → admin safely */
  const signInWithPassword = async (email: string, password: string) => {
    try {
      // IMPORTANT: destroy anon session first
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log(
          "Something went wrong in registering user with signInWithPassword, error is:",
          error,
        );

        return { success: false, error: error.message };
      }

      console.log("User is signedInWithPassword, data is:", data);

      setUserId(data.user.id);
      setIsAnonymous(false);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  };

  const updatePassword = useCallback(
    async (
      newPassword: string,
    ): Promise<{
      success: boolean;
      error?: string;
    }> => {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          console.error("Update password error:", error);
          return {
            success: false,
            error: error.message || "Failed to update password",
          };
        }

        return { success: true };
      } catch (err) {
        console.error("Update password exception:", err);
        return {
          success: false,
          error:
            err instanceof Error ? err.message : "Failed to update password",
        };
      }
    },
    [],
  );

  const logout = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setIsAnonymous(false);
  };
  

  return (
    <AuthContext.Provider
      value={{
        userId,
        authLoading,
        isAnonymous,
        ensureAnonymous,
        signInWithPassword,
        logout,
        updatePassword,
        userClaims,
        setUserClaims
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
