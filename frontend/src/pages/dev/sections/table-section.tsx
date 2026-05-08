import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageSection } from "@/components/layout/page-section";

const cigars = [
  { name: "Padrón 1964 Exclusivo Natural", vitola: "Robusto", qty: 12, price: "$18.50", strength: "Full" },
  { name: "Oliva Serie V Melanio", vitola: "Figurado", qty: 6, price: "$22.00", strength: "Full" },
  { name: "Arturo Fuente Hemingway", vitola: "Perfecto", qty: 18, price: "$14.75", strength: "Medium" },
  { name: "My Father Le Bijou 1922", vitola: "Torpedo", qty: 3, price: "$19.00", strength: "Full" },
] as const;

const strengthColor: Record<string, string> = {
  Full: "bg-primary/20 text-primary border-primary/30",
  Medium: "bg-secondary text-secondary-foreground",
  Mild: "bg-muted text-muted-foreground",
};

export function TableSection() {
  return (
    <PageSection>
      <h2 className="font-serif text-2xl font-bold mb-6 text-primary">Table</h2>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cigar</TableHead>
              <TableHead>Vitola</TableHead>
              <TableHead>Strength</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Avg Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cigars.map((c) => (
              <TableRow key={c.name}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.vitola}</TableCell>
                <TableCell>
                  <Badge className={strengthColor[c.strength]} variant="outline">
                    {c.strength}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">{c.qty}</TableCell>
                <TableCell className="text-right font-mono">{c.price}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageSection>
  );
}
