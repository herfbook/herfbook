import { SlidersHorizontal } from "lucide-react";
import { usePageMeta } from "@/components/layout/page-title-context";
import { SectionTabs } from "@/components/layout/section-tabs";
import { Placeholder } from "@/components/placeholder";

const tabs = [
  { label: "Community Data", to: "/admin/community" },
  { label: "Settings", to: "/admin/settings" },
];

export default function AdminSettingsPlaceholderPage() {
  usePageMeta({ title: "Settings" });
  return (
    <div>
      <SectionTabs items={tabs} />
      <Placeholder
        icon={SlidersHorizontal}
        title="Settings"
        description="Profile, password, and application preferences — coming soon."
      />
    </div>
  );
}
