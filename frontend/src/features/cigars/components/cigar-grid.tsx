import { Cigarette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CigarListItem } from "../types";
import { CigarCard } from "./cigar-card";

interface CigarGridProps {
  cigars: CigarListItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  onCreateClick: () => void;
  inStockMap?: Record<string, number>;
}

export function CigarGrid({
  cigars,
  isLoading,
  isError,
  error,
  onRetry,
  onCreateClick,
  inStockMap,
}: CigarGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4]" />
        ))}
      </div>
    );
  }

  if (isError) {
    const message =
      error instanceof Error ? error.message : "Failed to load cigars";
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (!cigars || cigars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border py-16 text-center">
        <Cigarette className="h-10 w-10 text-muted-foreground/60" />
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">No cigars in your catalog yet</h3>
          <p className="text-sm text-muted-foreground">
            Add a cigar to start your collection.
          </p>
        </div>
        <Button onClick={onCreateClick}>Add cigar</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {cigars.map((cigar) => (
        <CigarCard
          key={cigar.id}
          cigar={cigar}
          inStock={inStockMap?.[cigar.id]}
        />
      ))}
    </div>
  );
}
