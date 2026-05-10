import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Boxes } from "lucide-react";
import { usePageMeta } from "@/components/layout/page-title-context";
import { SectionTabs } from "@/components/layout/section-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInventoryList } from "@/features/inventory/queries";
import { InventoryTable } from "@/features/inventory/components/inventory-table";
import { InventoryFormDialog } from "@/features/inventory/components/inventory-form-dialog";
import {
  InventoryFilters,
  type InventoryFilterState,
} from "@/features/inventory/components/inventory-filters";
import { useDebouncedValue } from "@/lib/hooks/use-debounce";

const tabs = [
  { label: "Humidors", to: "/humidors" },
  { label: "Cigars", to: "/cigars" },
  { label: "Inventory", to: "/inventory" },
];

const PAGE_SIZE = 50;

export default function InventoryListPage() {
  usePageMeta({
    title: "Inventory",
    breadcrumbs: [{ label: "Collection" }, { label: "Inventory" }],
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<InventoryFilterState>({});

  // Pre-select humidor and/or auto-open dialog from URL params, then strip
  // them so a refresh after closing doesn't reopen the dialog.
  const [initialHumidor, setInitialHumidor] = useState<string | null>(null);
  const [initialCigar, setInitialCigar] = useState<string | null>(null);
  useEffect(() => {
    const newFlag = searchParams.get("new") === "1";
    const humidor = searchParams.get("humidor");
    const cigar = searchParams.get("cigar");
    if (humidor) setInitialHumidor(humidor);
    if (cigar) setInitialCigar(cigar);
    if (newFlag) setCreateOpen(true);
    if (newFlag || humidor || cigar) {
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      next.delete("humidor");
      next.delete("cigar");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queryFilters = {
    humidor_id: filters.humidor_id,
    is_gift: filters.is_gift,
    min_quantity: filters.min_quantity,
    offset: page * PAGE_SIZE,
    limit: PAGE_SIZE,
  };
  const { data, isLoading, isError, error, refetch } =
    useInventoryList(queryFilters);

  // Backend doesn't support free-text search on inventory yet, so we filter
  // client-side over `cigar_display_name`.
  const filteredItems = useMemo(() => {
    if (!data) return undefined;
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return data.items;
    return data.items.filter((item) =>
      item.cigar_display_name.toLowerCase().includes(q)
    );
  }, [data, debouncedSearch]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      <SectionTabs items={tabs} />

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Boxes className="h-5 w-5" />
            Inventory
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Track quantities, purchase details, and aging across your humidors.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Search cigar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button onClick={() => setCreateOpen(true)}>Add to inventory</Button>
        </div>
      </div>

      <InventoryFilters
        filters={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(0);
        }}
      />

      <InventoryTable
        items={filteredItems}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        onCreateClick={() => setCreateOpen(true)}
      />

      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, data.total)} of {data.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <InventoryFormDialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) {
            // Drop one-shot defaults so reopening the dialog manually starts fresh.
            setInitialHumidor(null);
            setInitialCigar(null);
          }
        }}
        initialValues={{
          humidor_id: initialHumidor,
          cigar_id: initialCigar ?? "",
        }}
      />
    </div>
  );
}
