import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowUpDown, Boxes, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { InventoryListItem } from "../types";
import { useInventoryItem } from "../queries";
import { InventoryFormDialog } from "./inventory-form-dialog";
import { TransferDialog } from "./transfer-dialog";
import { SmokeConfirmDialog } from "./smoke-confirm-dialog";
import { DeleteInventoryDialog } from "./delete-inventory-dialog";

type SortField =
  | "cigar"
  | "quantity"
  | "humidor"
  | "price_per_stick"
  | "days_aging"
  | "date_added_humidor";
type SortDir = "asc" | "desc";

interface Props {
  items: InventoryListItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  onCreateClick: () => void;
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function compareValues<T>(a: T, b: T): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b);
  }
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function getSortValue(
  item: InventoryListItem,
  field: SortField
): string | number | null {
  switch (field) {
    case "cigar":
      return item.cigar_display_name;
    case "quantity":
      return item.quantity;
    case "humidor":
      return item.humidor_name ?? null;
    case "price_per_stick":
      return item.price_per_stick;
    case "days_aging":
      return item.days_aging;
    case "date_added_humidor":
      return item.date_added_humidor;
  }
}

function SortHeader({
  field,
  label,
  sort,
  setSort,
  className,
}: {
  field: SortField;
  label: string;
  sort: { field: SortField; dir: SortDir };
  setSort: (s: { field: SortField; dir: SortDir }) => void;
  className?: string;
}) {
  const active = sort.field === field;
  return (
    <button
      type="button"
      onClick={() =>
        setSort({
          field,
          dir: active && sort.dir === "asc" ? "desc" : "asc",
        })
      }
      className={cn(
        "flex items-center gap-1 text-left font-medium hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
        className
      )}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );
}

interface RowActionsProps {
  item: InventoryListItem;
}

function RowActions({ item }: RowActionsProps) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [smokeOpen, setSmokeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const detail = useInventoryItem(editOpen ? item.id : "");

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Row menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => navigate(`/inventory/${item.id}`)}>
            View
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            Edit
          </DropdownMenuItem>
          {item.quantity > 0 && (
            <DropdownMenuItem onSelect={() => setSmokeOpen(true)}>
              Smoke 1
            </DropdownMenuItem>
          )}
          {item.quantity > 0 && (
            <DropdownMenuItem onSelect={() => setTransferOpen(true)}>
              Transfer…
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {detail.data && (
        <InventoryFormDialog
          inventory={detail.data}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
      <TransferDialog
        inventoryId={item.id}
        currentHumidorId={item.humidor_id}
        currentQuantity={item.quantity}
        open={transferOpen}
        onOpenChange={setTransferOpen}
      />
      <SmokeConfirmDialog
        inventoryId={item.id}
        cigarLabel={item.cigar_display_name}
        currentQuantity={item.quantity}
        open={smokeOpen}
        onOpenChange={setSmokeOpen}
      />
      <DeleteInventoryDialog
        inventoryId={item.id}
        cigarLabel={item.cigar_display_name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

export function InventoryTable({
  items,
  isLoading,
  isError,
  error,
  onRetry,
  onCreateClick,
}: Props) {
  const navigate = useNavigate();
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: "date_added_humidor",
    dir: "desc",
  });

  const sorted = useMemo(() => {
    if (!items) return undefined;
    return [...items].sort((a, b) => {
      const av = getSortValue(a, sort.field);
      const bv = getSortValue(b, sort.field);
      const cmp = compareValues(av, bv);
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [items, sort]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    const message =
      error instanceof Error ? error.message : "Failed to load inventory";
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border py-12 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (!sorted || sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border py-16 text-center">
        <Boxes className="h-10 w-10 text-muted-foreground/60" />
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">No cigars in inventory yet</h3>
          <p className="text-sm text-muted-foreground">
            Add some cigars to start tracking your collection.
          </p>
        </div>
        <Button onClick={onCreateClick}>Add to inventory</Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortHeader
                field="cigar"
                label="Cigar"
                sort={sort}
                setSort={setSort}
              />
            </TableHead>
            <TableHead className="text-right w-20">
              <SortHeader
                field="quantity"
                label="Qty"
                sort={sort}
                setSort={setSort}
                className="ml-auto"
              />
            </TableHead>
            <TableHead className="w-40">
              <SortHeader
                field="humidor"
                label="Humidor"
                sort={sort}
                setSort={setSort}
              />
            </TableHead>
            <TableHead className="text-right w-28">
              <SortHeader
                field="price_per_stick"
                label="$/stick"
                sort={sort}
                setSort={setSort}
                className="ml-auto"
              />
            </TableHead>
            <TableHead className="w-28">
              <SortHeader
                field="days_aging"
                label="Aging"
                sort={sort}
                setSort={setSort}
              />
            </TableHead>
            <TableHead className="w-36">
              <SortHeader
                field="date_added_humidor"
                label="Added"
                sort={sort}
                setSort={setSort}
              />
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((item) => (
            <TableRow
              key={item.id}
              onClick={() => navigate(`/inventory/${item.id}`)}
              className="cursor-pointer"
            >
              <TableCell className="font-medium">
                {item.cigar_display_name}
                {item.is_gift && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (gift)
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {item.humidor_name ?? "—"}
              </TableCell>
              <TableCell className="text-right text-sm">
                {item.price_per_stick != null
                  ? currency.format(item.price_per_stick)
                  : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {item.days_aging != null ? `${item.days_aging} days` : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {item.date_added_humidor
                  ? format(
                      new Date(item.date_added_humidor + "T00:00:00"),
                      "MMM d, yyyy"
                    )
                  : "—"}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <RowActions item={item} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
