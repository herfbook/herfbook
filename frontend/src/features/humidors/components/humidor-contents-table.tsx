import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { HumidorInventoryItem } from "../types";

interface HumidorContentsTableProps {
  contents: HumidorInventoryItem[];
}

function cigarLabel(item: HumidorInventoryItem): string {
  const parts = [item.brand_name, item.line, item.vitola_name].filter(Boolean);
  return parts.join(" · ");
}

function sortContents(items: HumidorInventoryItem[]): HumidorInventoryItem[] {
  return [...items].sort((a, b) => {
    // date_added_humidor desc (null sorts last)
    if (a.date_added_humidor !== b.date_added_humidor) {
      if (!a.date_added_humidor) return 1;
      if (!b.date_added_humidor) return -1;
      return b.date_added_humidor.localeCompare(a.date_added_humidor);
    }
    // brand_name asc
    const brandCmp = a.brand_name.localeCompare(b.brand_name);
    if (brandCmp !== 0) return brandCmp;
    // line asc
    const lineA = a.line ?? "";
    const lineB = b.line ?? "";
    return lineA.localeCompare(lineB);
  });
}

export function HumidorContentsTable({ contents }: HumidorContentsTableProps) {
  const sorted = sortContents(contents);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold">Contents</h2>
        <span className="text-sm text-muted-foreground">
          {contents.length} {contents.length === 1 ? "cigar" : "cigars"}
        </span>
      </div>

      {contents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center border rounded-lg">
          <p className="text-sm text-muted-foreground">
            This humidor is empty.
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled>Add cigars</Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Coming in FE-05</TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cigar</TableHead>
                <TableHead className="text-right w-20">Qty</TableHead>
                <TableHead className="w-36">Date added</TableHead>
                <TableHead className="w-28">Aging</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((item) => (
                <TableRow key={item.inventory_id}>
                  <TableCell className="font-medium">
                    {cigarLabel(item)}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.date_added_humidor
                      ? format(new Date(item.date_added_humidor + "T00:00:00"), "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.days_aging != null ? `${item.days_aging} days` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
