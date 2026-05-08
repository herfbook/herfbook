import { Thermometer, Droplets, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageSection } from "@/components/layout/page-section";

function HumidorCard() {
  const capacity = 50;
  const used = 32;
  const pct = Math.round((used / capacity) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Main Humidor</CardTitle>
        <CardDescription>Cedar-lined desktop cabinet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Capacity</span>
          <span className="font-medium">{used} / {capacity} sticks</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Thermometer className="h-3.5 w-3.5" />
            70°F
          </span>
          <span className="flex items-center gap-1">
            <Droplets className="h-3.5 w-3.5" />
            68%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function InventoryCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Padrón 1964 Exclusivo</CardTitle>
            <CardDescription>Natural · Robusto · Full</CardDescription>
          </div>
          <Badge variant="secondary">12 left</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Avg price</span>
          <span className="font-medium font-mono">$18.50 / stick</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-muted-foreground">Added</span>
          <span>84 days ago</span>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Oliva Serie V Melanio</CardTitle>
            <CardDescription>Figurado · Smoked Apr 28, 2026</CardDescription>
          </div>
          <div className="flex items-center gap-1 text-primary font-bold">
            <Star className="h-4 w-4 fill-current" />
            <span>94</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline">Cedar</Badge>
          <Badge variant="outline">Dark Chocolate</Badge>
          <Badge variant="outline">Espresso</Badge>
          <Badge variant="outline">Black Pepper</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Paired with Bourbon · Would repurchase</p>
      </CardContent>
    </Card>
  );
}

export function CardsSection() {
  return (
    <PageSection>
      <h2 className="font-serif text-2xl font-bold mb-6 text-primary">Cards</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <HumidorCard />
        <InventoryCard />
        <SessionCard />
      </div>
    </PageSection>
  );
}
