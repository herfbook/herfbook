import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { usePageMeta } from "@/components/layout/page-title-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInventoryItem } from "@/features/inventory/queries";
import { InventoryDetailHeader } from "@/features/inventory/components/inventory-detail-header";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function StatTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-72" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useInventoryItem(
    id ?? ""
  );

  usePageMeta({
    title: data ? data.cigar_display_name : "Inventory",
    breadcrumbs: [
      { label: "Collection" },
      { label: "Inventory", to: "/inventory" },
      { label: data ? data.cigar_display_name : "Inventory entry" },
    ],
  });

  if (isLoading) return <DetailSkeleton />;

  if (isError) {
    const is404 =
      axios.isAxiosError(error) && error.response?.status === 404;
    if (is404) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <h2 className="text-xl font-semibold">Inventory entry not found</h2>
          <Button variant="outline" onClick={() => navigate("/inventory")}>
            Back to inventory
          </Button>
        </div>
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load inventory";
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const totalSpend =
    data.price_per_stick != null
      ? data.price_per_stick * data.quantity
      : data.purchase_price;

  return (
    <div className="space-y-6">
      <InventoryDetailHeader inventory={data} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Quantity" value={data.quantity} />
        <StatTile
          label="Aging"
          value={data.days_aging != null ? `${data.days_aging} days` : "—"}
        />
        <StatTile
          label="Price / stick"
          value={
            data.price_per_stick != null
              ? currency.format(data.price_per_stick)
              : "—"
          }
        />
        <StatTile
          label="Total spend"
          value={totalSpend != null ? currency.format(totalSpend) : "—"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Purchase</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <Field
              label="Vendor"
              value={
                data.vendor_url ? (
                  <a
                    href={data.vendor_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {data.vendor ?? data.vendor_url}
                  </a>
                ) : (
                  data.vendor
                )
              }
            />
            <Field
              label="Purchase date"
              value={
                data.purchase_date
                  ? format(
                      new Date(data.purchase_date + "T00:00:00"),
                      "MMM d, yyyy"
                    )
                  : null
              }
            />
            <Field label="Purchase type" value={data.purchase_type_name} />
            <Field
              label="Box code"
              value={
                data.box_code ? (
                  <span className="font-mono">{data.box_code}</span>
                ) : null
              }
            />
            <Field
              label="Date added to humidor"
              value={
                data.date_added_humidor
                  ? format(
                      new Date(data.date_added_humidor + "T00:00:00"),
                      "MMM d, yyyy"
                    )
                  : null
              }
            />
            <Field label="Humidor" value={data.humidor_name} />
          </dl>
        </CardContent>
      </Card>

      {data.is_gift && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gift</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Field label="Received from" value={data.gift_from} />
              <Field label="Occasion" value={data.gift_occasion} />
              <Field label="Given to" value={data.gift_to} />
            </dl>
          </CardContent>
        </Card>
      )}

      {data.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {data.notes}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transfer history</CardTitle>
        </CardHeader>
        <CardContent>
          {data.transfers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transfers yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transfers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(t.transferred_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{t.from_humidor_name ?? "—"}</TableCell>
                    <TableCell>{t.to_humidor_name ?? "—"}</TableCell>
                    <TableCell className="text-right">{t.quantity}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {t.notes ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div>
        <Link
          to={`/cigars/${data.cigar_id}`}
          className="text-sm text-primary hover:underline"
        >
          View {data.cigar_display_name} in catalog →
        </Link>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | null;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">{value ?? "—"}</dd>
    </div>
  );
}
