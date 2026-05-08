import { Boxes } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { HumidorListItem } from "../types";
import { HumidorCard } from "./humidor-card";

interface HumidorListProps {
  humidors: HumidorListItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  onCreateClick: () => void;
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function HumidorList({
  humidors,
  isLoading,
  isError,
  error,
  onRetry,
  onCreateClick,
}: HumidorListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError) {
    const message =
      error instanceof Error ? error.message : "Failed to load humidors";
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!humidors || humidors.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Boxes className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-1">
            <h3 className="font-semibold">No humidors yet</h3>
            <p className="text-sm text-muted-foreground">
              Add your first humidor to start tracking your cigars.
            </p>
          </div>
          <Button onClick={onCreateClick}>Create humidor</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {humidors.map((h) => (
        <HumidorCard key={h.id} humidor={h} />
      ))}
    </div>
  );
}
