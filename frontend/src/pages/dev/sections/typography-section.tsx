import { PageSection } from "@/components/layout/page-section";

export function TypographySection() {
  return (
    <PageSection>
      <h2 className="font-serif text-2xl font-bold mb-6 text-primary">Typography</h2>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Fraunces (serif)</p>
          <h1 className="font-serif text-4xl font-bold">Heading 1 — Fraunces</h1>
          <h2 className="font-serif text-3xl font-bold">Heading 2 — Fraunces</h2>
          <h3 className="font-serif text-2xl font-semibold">Heading 3 — Fraunces</h3>
          <h4 className="font-serif text-xl font-semibold">Heading 4 — Fraunces</h4>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Inter (sans)</p>
          <h1 className="text-4xl font-bold">Heading 1 — Inter</h1>
          <h2 className="text-3xl font-bold">Heading 2 — Inter</h2>
          <h3 className="text-2xl font-semibold">Heading 3 — Inter</h3>
          <h4 className="text-xl font-semibold">Heading 4 — Inter</h4>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <p className="text-base">Body text — The subtle complexity of a well-aged Cameroon wrapper.</p>
        <p className="text-sm text-muted-foreground">Muted text — Used for descriptions, metadata, and secondary information.</p>
        <p className="font-mono text-sm">Mono — UPC: 0 12345 67890 5 · Ring: 52 · Length: 6⅛</p>
        <p className="text-xs text-muted-foreground">Small text — Last updated May 2026</p>
      </div>
    </PageSection>
  );
}
