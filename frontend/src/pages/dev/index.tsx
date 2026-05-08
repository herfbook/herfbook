import { Container } from "@/components/layout/container";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { TypographySection } from "./sections/typography-section";
import { ColorsSection } from "./sections/colors-section";
import { ButtonsSection } from "./sections/buttons-section";
import { FormsSection } from "./sections/forms-section";
import { CardsSection } from "./sections/cards-section";
import { FeedbackSection } from "./sections/feedback-section";
import { OverlaysSection } from "./sections/overlays-section";
import { TabsSection } from "./sections/tabs-section";
import { TableSection } from "./sections/table-section";

export default function DevPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-2xl font-bold text-primary">HerfBook</span>
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                /_/dev
              </span>
            </div>
            <ThemeToggle />
          </div>
        </Container>
      </header>

      {/* Page content */}
      <Container>
        <div className="py-8">
          <div className="mb-8">
            <h1 className="font-serif text-4xl font-bold">Design System</h1>
            <p className="mt-2 text-muted-foreground">
              Visual reference for HerfBook's component library and design tokens.
              Toggle the theme above to preview both modes.
            </p>
          </div>

          <Separator />
          <TypographySection />
          <Separator />
          <ColorsSection />
          <Separator />
          <ButtonsSection />
          <Separator />
          <FormsSection />
          <Separator />
          <CardsSection />
          <Separator />
          <FeedbackSection />
          <Separator />
          <OverlaysSection />
          <Separator />
          <TabsSection />
          <Separator />
          <TableSection />
        </div>
      </Container>
    </div>
  );
}
