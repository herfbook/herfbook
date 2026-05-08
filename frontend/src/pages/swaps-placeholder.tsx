import { ArrowLeftRight } from "lucide-react";
import { usePageMeta } from "@/components/layout/page-title-context";
import { SectionTabs } from "@/components/layout/section-tabs";
import { Placeholder } from "@/components/placeholder";

const tabs = [
  { label: "Swaps", to: "/swaps" },
  { label: "Guests", to: "/guests" },
];

export default function SwapsPlaceholderPage() {
  usePageMeta({ title: "Social" });
  return (
    <div>
      <SectionTabs items={tabs} />
      <Placeholder
        icon={ArrowLeftRight}
        title="Swaps"
        description="Arrange cigar swaps with fellow enthusiasts."
        scheduledFor="FE-07"
      />
    </div>
  );
}
