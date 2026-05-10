import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useInventoryList } from "@/features/inventory/queries";

interface Props {
  cigarId: string;
}

interface HumidorBucket {
  humidor_id: string | null;
  humidor_name: string | null;
  quantity: number;
}

export function CigarInventorySummary({ cigarId }: Props) {
  const { data, isLoading, isError } = useInventoryList({
    cigar_id: cigarId,
    limit: 200,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-muted-foreground">
        Couldn't load inventory.
      </p>
    );
  }

  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No inventory recorded for this cigar.
      </p>
    );
  }

  // Group by humidor and sum quantity.
  const buckets = new Map<string, HumidorBucket>();
  for (const item of items) {
    const key = item.humidor_id ?? "__unassigned__";
    const existing = buckets.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      buckets.set(key, {
        humidor_id: item.humidor_id,
        humidor_name: item.humidor_name,
        quantity: item.quantity,
      });
    }
  }
  const sorted = [...buckets.values()].sort(
    (a, b) => b.quantity - a.quantity
  );
  const total = sorted.reduce((sum, b) => sum + b.quantity, 0);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {total} total across {sorted.length}{" "}
        {sorted.length === 1 ? "humidor" : "humidors"}
      </p>
      <ul className="space-y-1">
        {sorted.map((b) => (
          <li
            key={b.humidor_id ?? "unassigned"}
            className="flex items-baseline justify-between text-sm"
          >
            {b.humidor_id ? (
              <Link
                to={`/humidors/${b.humidor_id}`}
                className="text-primary hover:underline"
              >
                {b.humidor_name ?? "Unnamed humidor"}
              </Link>
            ) : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
            <span className="text-muted-foreground">{b.quantity}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
