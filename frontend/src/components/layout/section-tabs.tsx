import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SectionTab {
  label: string;
  to: string;
}

interface SectionTabsProps {
  items: SectionTab[];
}

export function SectionTabs({ items }: SectionTabsProps) {
  const { pathname } = useLocation();

  return (
    <div className="flex gap-1 border-b mb-6">
      {items.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
