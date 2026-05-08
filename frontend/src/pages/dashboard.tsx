import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageMeta } from "@/components/layout/page-title-context";
import { useAuthStore } from "@/stores/auth-store";
import { rawClient } from "@/lib/api/client";
import { getMe } from "@/lib/api/auth";
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
      <Badge variant={ok ? "default" : "destructive"}>{ok ? "OK" : "ERR"}</Badge>
      <span className="font-medium">{label}</span>
      {detail && <span className="text-muted-foreground">{detail}</span>}
    </div>
  );
}

export default function DashboardPage() {
  usePageMeta({ title: "Dashboard" });

  const { user } = useAuthStore();
  const displayName = user?.display_name || user?.username || "there";

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl font-semibold">
          Welcome back, {displayName}
        </h2>
        <p className="text-muted-foreground mt-1">Your HerfBook is ready.</p>
      </div>

      {/* System status */}
      <Card className="max-w-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatusPill
            label="Backend"
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
        </CardContent>
      </Card>

      {/* Charts placeholder */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="rounded-full bg-muted p-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-medium">Dashboard charts coming in FE-08</p>
            <p className="text-sm text-muted-foreground">
              Humidor summary, recent sessions, and collection stats will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
