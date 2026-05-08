import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router-dom";
import { getSetupStatus } from "@/lib/api/auth";
import { Loader } from "@/components/loader";

export function SetupGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { data, isLoading } = useQuery({
    queryKey: ["setup-status"],
    queryFn: getSetupStatus,
    staleTime: Infinity,
    retry: false,
  });

  if (isLoading || !data) return <Loader />;

  if (data.setup_required) {
    if (location.pathname === "/setup") return <>{children}</>;
    return <Navigate to="/setup" replace />;
  }

  if (location.pathname === "/setup") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
