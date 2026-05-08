import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSection } from "@/components/layout/page-section";

export function FeedbackSection() {
  return (
    <PageSection>
      <h2 className="font-serif text-2xl font-bold mb-6 text-primary">Feedback</h2>

      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Badges</p>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge className="bg-primary/20 text-primary border-primary/30">Custom</Badge>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Skeleton</p>
          <div className="space-y-2 max-w-sm">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Toasts</p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => toast("Cigar added to collection.")}
            >
              Default toast
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.success("Humidor updated successfully.")}
            >
              Success
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.error("Failed to save changes.")}
            >
              Error
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast("Session logged.", {
                  description: "Padrón 1964 Exclusivo — Apr 28, 2026",
                  action: { label: "View", onClick: () => {} },
                })
              }
            >
              With action
            </Button>
          </div>
        </div>
      </div>
    </PageSection>
  );
}
