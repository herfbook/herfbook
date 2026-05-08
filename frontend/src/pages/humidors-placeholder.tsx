import { Boxes } from "lucide-react";
import { usePageMeta } from "@/components/layout/page-title-context";
import { SectionTabs } from "@/components/layout/section-tabs";
import { Placeholder } from "@/components/placeholder";

const tabs = [
  { label: "Humidors", to: "/humidors" },
  { label: "Cigars", to: "/cigars" },
  { label: "Inventory", to: "/inventory" },
];

export default function HumidorsPlaceholderPage() {
  usePageMeta({ title: "Humidors" });
  return (
    <div>
      <SectionTabs items={tabs} />
      <Placeholder
        icon={Boxes}
        title="Humidors"
        description="Manage your humidors and track their contents."
        scheduledFor="FE-04"
      />
    </div>
  );
}
