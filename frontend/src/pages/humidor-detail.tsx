import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { usePageMeta } from "@/components/layout/page-title-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHumidor } from "@/features/humidors/queries";
import { HumidorDetailHeader } from "@/features/humidors/components/humidor-detail-header";
import { HumidorContentsTable } from "@/features/humidors/components/humidor-contents-table";

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-2 w-full max-w-md" />
        <div className="grid grid-cols-4 gap-6 pt-4 border-t">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function HumidorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: humidor, isLoading, isError, error, refetch } = useHumidor(id!);

  // Dynamic page meta
  usePageMeta({
    title: humidor?.name ?? "Humidor",
    breadcrumbs: [
      { label: "Collection" },
      { label: "Humidors", to: "/humidors" },
      { label: humidor?.name ?? "Humidor" },
    ],
  });

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError) {
    const is404 =
      axios.isAxiosError(error) && error.response?.status === 404;

    if (is404) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <h2 className="text-xl font-semibold">Humidor not found</h2>
          <p className="text-sm text-muted-foreground">
            This humidor doesn't exist or you don't have access to it.
          </p>
          <Button variant="outline" onClick={() => navigate("/humidors")}>
            Back to humidors
          </Button>
        </div>
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to load humidor";
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!humidor) return null;

  return (
    <div className="space-y-8">
      <HumidorDetailHeader
        humidor={humidor}
        onArchived={() => navigate("/humidors")}
      />
      <HumidorContentsTable contents={humidor.contents} />
    </div>
  );
}
