import { cn } from "@/lib/utils";

interface CapacityBarProps {
  count: number;
  capacity: number | null;
  percentage: number | null; // total_capacity_used from API (0..100+)
}

export function CapacityBar({ count, capacity, percentage }: CapacityBarProps) {
  if (capacity == null) {
    return (
      <p className="text-sm text-muted-foreground">
        {count} {count === 1 ? "cigar" : "cigars"}
      </p>
    );
  }

  const pct = percentage ?? 0;
  const fill = Math.min(pct, 100);
  const barColor =
    pct >= 100
      ? "bg-destructive"
      : pct >= 80
        ? "bg-amber-500"
        : "bg-primary";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {count} / {capacity} cigars
        </span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${fill}%` }}
        />
      </div>
    </div>
  );
}
