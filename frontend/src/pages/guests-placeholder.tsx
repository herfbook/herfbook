import { UserCheck } from "lucide-react";
import { usePageMeta } from "@/components/layout/page-title-context";
import { SectionTabs } from "@/components/layout/section-tabs";
import { Placeholder } from "@/components/placeholder";

const tabs = [
  { label: "Swaps", to: "/swaps" },
  { label: "Guests", to: "/guests" },
];

export default function GuestsPlaceholderPage() {
  usePageMeta({ title: "Social" });
  return (
    <div>
      <SectionTabs items={tabs} />
      <Placeholder
        icon={UserCheck}
        title="Guests"
        description="Manage guest access to your collection."
        scheduledFor="FE-07"
      />
    </div>
  );
}
