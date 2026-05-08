import { ShieldCheck } from "lucide-react";
import { usePageMeta } from "@/components/layout/page-title-context";
import { SectionTabs } from "@/components/layout/section-tabs";
import { Placeholder } from "@/components/placeholder";

const tabs = [
  { label: "Community Data", to: "/admin/community" },
  { label: "Settings", to: "/admin/settings" },
];

export default function AdminCommunityPlaceholderPage() {
  usePageMeta({ title: "Admin" });
  return (
    <div>
      <SectionTabs items={tabs} />
      <Placeholder
        icon={ShieldCheck}
        title="Community Data"
        description="Manage shared cigar database entries and community contributions."
        scheduledFor="FE-09"
      />
    </div>
  );
}
