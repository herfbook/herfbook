import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageSection } from "@/components/layout/page-section";

export function TabsSection() {
  return (
    <PageSection>
      <h2 className="font-serif text-2xl font-bold mb-6 text-primary">Tabs</h2>

      <Tabs defaultValue="collection">
        <TabsList>
          <TabsTrigger value="collection">Collection</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="swaps">Swaps</TabsTrigger>
        </TabsList>
        <TabsContent value="collection" className="mt-4">
          <p className="text-sm text-muted-foreground">
            Your cigar collection inventory would appear here — all humidors,
            sticks, and aging calculations.
          </p>
        </TabsContent>
        <TabsContent value="sessions" className="mt-4">
          <p className="text-sm text-muted-foreground">
            Smoking sessions and tasting journal entries would appear here,
            sorted by most recent.
          </p>
        </TabsContent>
        <TabsContent value="swaps" className="mt-4">
          <p className="text-sm text-muted-foreground">
            Active and completed swap proposals with other collectors would
            appear here.
          </p>
        </TabsContent>
      </Tabs>
    </PageSection>
  );
}
