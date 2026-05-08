import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Loader } from "@/components/loader";

export function AuthBoot({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status === "idle") {
      useAuthStore.getState().hydrate();
    }
  }, [status]);

  if (status === "idle" || status === "loading") {
    return <Loader />;
  }

  return <>{children}</>;
}
