import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PlaceholderProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  scheduledFor?: string;
  className?: string;
}

export function Placeholder({
  icon: Icon,
  title,
  description,
  scheduledFor,
  className,
}: PlaceholderProps) {
  return (
    <div className={cn("flex items-center justify-center py-16", className)}>
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
          {Icon && (
            <div className="rounded-full bg-muted p-4">
              <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold">{title}</h2>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
          {scheduledFor && (
            <Badge variant="secondary">Coming in {scheduledFor}</Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
