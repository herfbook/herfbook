import { Package } from "lucide-react";
import { usePageMeta } from "@/components/layout/page-title-context";
import { SectionTabs } from "@/components/layout/section-tabs";
import { Placeholder } from "@/components/placeholder";

const tabs = [
  { label: "Humidors", to: "/humidors" },
  { label: "Cigars", to: "/cigars" },
  { label: "Inventory", to: "/inventory" },
];

export default function CigarsPlaceholderPage() {
  usePageMeta({ title: "Cigars" });
  return (
    <div>
      <SectionTabs items={tabs} />
      <Placeholder
        icon={Package}
        title="Cigars"
        description="Browse and search your cigar collection."
        scheduledFor="FE-05"
      />
    </div>
  );
}
