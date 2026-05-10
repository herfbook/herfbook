import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { usePageMeta } from "@/components/layout/page-title-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCigar } from "@/features/cigars/queries";
import { CigarDetailHeader } from "@/features/cigars/components/cigar-detail-header";
import { CigarMetadataGrid } from "@/features/cigars/components/cigar-metadata-grid";
import { CigarImageGallery } from "@/features/cigars/components/cigar-image-gallery";
import { CigarInventorySummary } from "@/features/cigars/components/cigar-inventory-summary";
import { useInventoryList } from "@/features/inventory/queries";

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton className="aspect-square" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CigarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cigar, isLoading, isError, error, refetch } = useCigar(id ?? "");

  // Inventory total for the smart-delete heuristic in the header.
  const inventory = useInventoryList({ cigar_id: id, limit: 200 });
  const inventoryTotal = (inventory.data?.items ?? []).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  usePageMeta({
    title: cigar
      ? `${cigar.brand_name}${cigar.line ? " " + cigar.line : ""}`
      : "Cigar",
    breadcrumbs: [
      { label: "Collection" },
      { label: "Cigars", to: "/cigars" },
      {
        label: cigar
          ? `${cigar.brand_name}${cigar.line ? " " + cigar.line : ""}`
          : "Cigar",
      },
    ],
  });

  if (isLoading) return <DetailSkeleton />;

  if (isError) {
    const is404 =
      axios.isAxiosError(error) && error.response?.status === 404;
    if (is404) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <h2 className="text-xl font-semibold">Cigar not found</h2>
          <p className="text-sm text-muted-foreground">
            This cigar doesn't exist or you don't have access to it.
          </p>
          <Button variant="outline" onClick={() => navigate("/cigars")}>
            Back to cigars
          </Button>
        </div>
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load cigar";
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!cigar) return null;

  return (
    <div className="space-y-8">
      <CigarDetailHeader cigar={cigar} inventoryTotal={inventoryTotal} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CigarImageGallery cigarId={cigar.id} images={cigar.images} />
        <div className="space-y-6">
          <CigarMetadataGrid cigar={cigar} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <CigarInventorySummary cigarId={cigar.id} />
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/inventory?new=1&cigar=${cigar.id}`}>
                    Add to inventory
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/inventory?cigar=${cigar.id}`}>
                    View inventory entries
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
