import { Heart } from "lucide-react";
import { usePageMeta } from "@/components/layout/page-title-context";
import { Placeholder } from "@/components/placeholder";

export default function WishlistPlaceholderPage() {
  usePageMeta({ title: "Wishlist" });
  return (
    <Placeholder
      icon={Heart}
      title="Wishlist"
      description="Keep track of cigars you want to try or add to your collection."
      scheduledFor="FE-07"
    />
  );
}
