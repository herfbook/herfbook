import { cn } from "@/lib/utils";

interface PageSectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function PageSection({ children, className, ...props }: PageSectionProps) {
  return (
    <section className={cn("py-6", className)} {...props}>
      {children}
    </section>
  );
}
