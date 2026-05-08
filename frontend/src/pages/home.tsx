import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { logout, getMe } from "@/lib/api/auth";
import { rawClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/lib/api/types";

interface HealthResponse {
  status: string;
  version: string;
  setup_required: boolean;
}

function StatusPill({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <Badge variant={ok ? "default" : "destructive"}>
        {ok ? "OK" : "ERR"}
      </Badge>
      <span className="font-medium">{label}</span>
      {detail && <span className="text-muted-foreground">{detail}</span>}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user, refreshToken, clear } = useAuthStore();

  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const { data } = await rawClient.get<HealthResponse>("/health");
      return data;
    },
    retry: false,
  });

  const meQuery = useQuery<User>({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  async function handleLogout() {
    if (refreshToken) {
      try {
        await logout(refreshToken);
      } catch {
        // best-effort — revoke server-side, but clear locally regardless
      }
    }
    clear();
    toast.success("Logged out");
    navigate("/login", { replace: true });
  }

  const displayName = user?.display_name || user?.username || "there";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="font-serif text-2xl font-bold text-primary">HerfBook</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">
            Welcome back, {displayName}
          </h2>
          <p className="text-muted-foreground">
            Your HerfBook is ready.
          </p>
        </div>

        <div className="w-full max-w-sm space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            System Status
          </p>

          <StatusPill
            label="Backend health"
            ok={healthQuery.isSuccess && healthQuery.data?.status === "ok"}
            detail={
              healthQuery.isSuccess
                ? `v${healthQuery.data?.version}`
                : healthQuery.isError
                  ? "unreachable"
                  : "checking…"
            }
          />

          <StatusPill
            label="/users/me"
            ok={meQuery.isSuccess}
            detail={
              meQuery.isSuccess
                ? meQuery.data.username
                : meQuery.isError
                  ? "failed"
                  : "checking…"
            }
          />
        </div>
      </main>
    </div>
  );
}
