import { PageSection } from "@/components/layout/page-section";

const swatches = [
  { label: "background", bg: "bg-background", fg: "text-foreground", text: "Background" },
  { label: "card", bg: "bg-card", fg: "text-card-foreground", text: "Card" },
  { label: "primary", bg: "bg-primary", fg: "text-primary-foreground", text: "Primary" },
  { label: "secondary", bg: "bg-secondary", fg: "text-secondary-foreground", text: "Secondary" },
  { label: "muted", bg: "bg-muted", fg: "text-muted-foreground", text: "Muted" },
  { label: "accent", bg: "bg-accent", fg: "text-accent-foreground", text: "Accent" },
  { label: "destructive", bg: "bg-destructive", fg: "text-destructive-foreground", text: "Destructive" },
] as const;

export function ColorsSection() {
  return (
    <PageSection>
      <h2 className="font-serif text-2xl font-bold mb-6 text-primary">Colors</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {swatches.map((s) => (
          <div key={s.label} className={`${s.bg} ${s.fg} rounded-lg border p-4 flex flex-col gap-1`}>
            <span className="text-sm font-semibold">{s.text}</span>
            <span className="text-xs opacity-70">{s.label}</span>
          </div>
        ))}
      </div>
    </PageSection>
  );
}
