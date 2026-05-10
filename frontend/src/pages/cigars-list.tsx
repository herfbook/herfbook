import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Cigarette } from "lucide-react";
import { usePageMeta } from "@/components/layout/page-title-context";
import { SectionTabs } from "@/components/layout/section-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCigars } from "@/features/cigars/queries";
import { CigarGrid } from "@/features/cigars/components/cigar-grid";
import { CigarFormDialog } from "@/features/cigars/components/cigar-form-dialog";
import {
  CigarFilters,
  type CigarFilterState,
} from "@/features/cigars/components/cigar-filters";
import { useDebouncedValue } from "@/lib/hooks/use-debounce";
import { useInventoryList } from "@/features/inventory/queries";

const tabs = [
  { label: "Humidors", to: "/humidors" },
  { label: "Cigars", to: "/cigars" },
  { label: "Inventory", to: "/inventory" },
];

const PAGE_SIZE = 50;

export default function CigarsListPage() {
  usePageMeta({
    title: "Cigars",
    breadcrumbs: [{ label: "Collection" }, { label: "Cigars" }],
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<CigarFilterState>({});

  // Auto-open create dialog from ?new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setCreateOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync ?q= into URL
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch.trim()) {
      next.set("q", debouncedSearch.trim());
    } else {
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const queryFilters = {
    q: debouncedSearch,
    brand_id: filters.brand_id,
    wrapper_id: filters.wrapper_id,
    strength_id: filters.strength_id,
    country_id: filters.country_id,
    offset: page * PAGE_SIZE,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isError, error, refetch } = useCigars(queryFilters);

  // Per-cigar in-stock counts. We fetch up to 200 inventory rows and
  // aggregate client-side. For users with very large inventories this
  // would need a dedicated backend endpoint.
  const inventory = useInventoryList({ limit: 200 });
  const inStockMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of inventory.data?.items ?? []) {
      map[item.cigar_id] = (map[item.cigar_id] ?? 0) + item.quantity;
    }
    return map;
  }, [inventory.data]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      <SectionTabs items={tabs} />

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Cigarette className="h-5 w-5" />
            Cigars
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Your catalog of every cigar you've encountered, owned or
            otherwise.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Search brand or line…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button onClick={() => setCreateOpen(true)}>Add cigar</Button>
        </div>
      </div>

      <CigarFilters filters={filters} onChange={(next) => {
        setFilters(next);
        setPage(0);
      }} />

      <CigarGrid
        cigars={data?.items}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        onCreateClick={() => setCreateOpen(true)}
        inStockMap={inStockMap}
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

      <CigarFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
