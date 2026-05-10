import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHumidors } from "@/features/humidors/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface InventoryFilterState {
  humidor_id?: string;
  is_gift?: boolean;
  min_quantity?: number;
}

interface Props {
  filters: InventoryFilterState;
  onChange: (next: InventoryFilterState) => void;
}

const ANY = "__any__";

export function InventoryFilters({ filters, onChange }: Props) {
  const { data: humidors } = useHumidors(false);

  const hasAny =
    filters.humidor_id != null ||
    filters.is_gift != null ||
    filters.min_quantity != null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filters.humidor_id ?? ANY}
        onValueChange={(v) =>
          onChange({
            ...filters,
            humidor_id: v === ANY ? undefined : v,
          })
        }
      >
        <SelectTrigger className="h-8 w-[180px]">
          <SelectValue placeholder="Humidor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>All humidors</SelectItem>
          {(humidors ?? []).map((h) => (
            <SelectItem key={h.id} value={h.id}>
              {h.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={
          filters.is_gift == null
            ? ANY
            : filters.is_gift
              ? "gifts"
              : "non-gifts"
        }
        onValueChange={(v) =>
          onChange({
            ...filters,
            is_gift:
              v === ANY ? undefined : v === "gifts" ? true : false,
          })
        }
      >
        <SelectTrigger className="h-8 w-[160px]">
          <SelectValue placeholder="Gift" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>All entries</SelectItem>
          <SelectItem value="gifts">Gifts only</SelectItem>
          <SelectItem value="non-gifts">Non-gifts only</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={filters.min_quantity != null ? "secondary" : "outline"}
            className="h-8"
          >
            {filters.min_quantity != null
              ? `Min qty: ${filters.min_quantity}`
              : "Min quantity"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="start">
          <div className="space-y-2">
            <Label htmlFor="min-qty">Minimum quantity</Label>
            <Input
              id="min-qty"
              type="number"
              min="0"
              step="1"
              value={filters.min_quantity ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  min_quantity:
                    e.target.value === ""
                      ? undefined
                      : Math.max(0, Number(e.target.value)),
                })
              }
            />
          </div>
        </PopoverContent>
      </Popover>

      {hasAny && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({})}
          className="h-8 text-muted-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
