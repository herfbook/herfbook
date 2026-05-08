import { useState } from "react";
import { Boxes } from "lucide-react";
import { usePageMeta } from "@/components/layout/page-title-context";
import { SectionTabs } from "@/components/layout/section-tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HumidorList } from "@/features/humidors/components/humidor-list";
import { HumidorFormDialog } from "@/features/humidors/components/humidor-form-dialog";
import { useHumidors } from "@/features/humidors/queries";

const STORAGE_KEY = "herfbook-humidors-show-archived";

const tabs = [
  { label: "Humidors", to: "/humidors" },
  { label: "Cigars", to: "/cigars" },
  { label: "Inventory", to: "/inventory" },
];

export default function HumidorsListPage() {
  usePageMeta({
    title: "Humidors",
    breadcrumbs: [{ label: "Collection" }, { label: "Humidors" }],
  });

  const [showArchived, setShowArchived] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } =
    useHumidors(showArchived);

  function handleToggleArchived(checked: boolean) {
    setShowArchived(checked);
    try {
      localStorage.setItem(STORAGE_KEY, String(checked));
    } catch {
      // ignore storage errors
    }
  }

  return (
    <div className="space-y-6">
      <SectionTabs items={tabs} />

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Boxes className="h-5 w-5 shrink-0" />
            Humidors
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Where your cigars rest. Each humidor tracks its own contents and
            conditions.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={handleToggleArchived}
            />
            <Label htmlFor="show-archived" className="text-sm cursor-pointer">
              Show archived
            </Label>
          </div>

          <Button onClick={() => setCreateOpen(true)}>Add humidor</Button>
        </div>
      </div>

      <HumidorList
        humidors={data}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        onCreateClick={() => setCreateOpen(true)}
      />

      <HumidorFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
