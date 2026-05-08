import { ClipboardList } from "lucide-react";
import { usePageMeta } from "@/components/layout/page-title-context";
import { SectionTabs } from "@/components/layout/section-tabs";
import { Placeholder } from "@/components/placeholder";

const tabs = [
  { label: "Humidors", to: "/humidors" },
  { label: "Cigars", to: "/cigars" },
  { label: "Inventory", to: "/inventory" },
];

export default function InventoryPlaceholderPage() {
  usePageMeta({ title: "Inventory" });
  return (
    <div>
      <SectionTabs items={tabs} />
      <Placeholder
        icon={ClipboardList}
        title="Inventory"
        description="Track your full cigar inventory across all humidors."
        scheduledFor="FE-05"
      />
    </div>
  );
}
