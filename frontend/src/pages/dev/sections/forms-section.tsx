import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageSection } from "@/components/layout/page-section";

export function FormsSection() {
  return (
    <PageSection>
      <h2 className="font-serif text-2xl font-bold mb-6 text-primary">Forms</h2>

      <div className="max-w-lg rounded-lg border bg-card p-6 space-y-5">
        <p className="font-semibold text-card-foreground">Add Cigar — demo form (no submit)</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" placeholder="e.g. Padrón" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="line">Line</Label>
            <Input id="line" placeholder="e.g. 1964 Anniversary" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vitola">Vitola</Label>
          <Select>
            <SelectTrigger id="vitola">
              <SelectValue placeholder="Select a vitola" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="robusto">Robusto (5 × 50)</SelectItem>
              <SelectItem value="toro">Toro (6 × 52)</SelectItem>
              <SelectItem value="churchill">Churchill (7 × 48)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wrapper">Wrapper</Label>
            <Select>
              <SelectTrigger id="wrapper">
                <SelectValue placeholder="Wrapper leaf" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="colorado">Colorado</SelectItem>
                <SelectItem value="claro">Claro</SelectItem>
                <SelectItem value="maduro">Maduro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="strength">Strength</Label>
            <Select>
              <SelectTrigger id="strength">
                <SelectValue placeholder="Body" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mild">Mild</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="full">Full</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" placeholder="Tasting impressions, aging notes…" />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox id="gift" />
            <Label htmlFor="gift">Gift</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="in-stock" />
            <Label htmlFor="in-stock">In stock</Label>
          </div>
        </div>

        <Button className="w-full" type="button">Add to Collection</Button>
      </div>
    </PageSection>
  );
}
