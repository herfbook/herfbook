import { BookOpen } from "lucide-react";
import { usePageMeta } from "@/components/layout/page-title-context";
import { Placeholder } from "@/components/placeholder";

export default function SessionsPlaceholderPage() {
  usePageMeta({ title: "Journal" });
  return (
    <Placeholder
      icon={BookOpen}
      title="Journal"
      description="Log your smoking sessions, notes, and ratings."
      scheduledFor="FE-06"
    />
  );
}
