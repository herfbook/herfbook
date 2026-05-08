import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, TokenPair } from "@/lib/api/types";
import { getMe } from "@/lib/api/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  setTokens: (tokens: TokenPair) => void;
  setUser: (user: User | null) => void;
  clear: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: "idle",

      setTokens: (tokens: TokenPair) =>
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        }),

      setUser: (user: User | null) =>
        set({
          user,
          status: user ? "authenticated" : "unauthenticated",
        }),

      clear: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          status: "unauthenticated",
        }),

      hydrate: async () => {
        const { accessToken, status } = get();
        if (status !== "idle") return;
        if (!accessToken) {
          set({ status: "unauthenticated" });
          return;
        }
        set({ status: "loading" });
        try {
          const user = await getMe();
          set({ user, status: "authenticated" });
        } catch {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            status: "unauthenticated",
          });
        }
      },
    }),
    {
      name: "herfbook-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
