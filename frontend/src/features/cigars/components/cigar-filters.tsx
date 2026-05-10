import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LookupCombobox } from "@/components/lookup/lookup-combobox";
import { useLookupEntry, type LookupTable } from "@/lib/api/lookups";
import { X } from "lucide-react";

export interface CigarFilterState {
  brand_id?: string;
  wrapper_id?: string;
  strength_id?: string;
  country_id?: string;
}

interface FilterChipProps {
  label: string;
  table: LookupTable;
  value: string | undefined;
  onChange: (id: string | null) => void;
}

function FilterChip({ label, table, value, onChange }: FilterChipProps) {
  const [open, setOpen] = useState(false);
  const selected = useLookupEntry(table, value ?? null);

  const buttonLabel = selected.data ? `${label}: ${selected.data.name}` : label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={value ? "secondary" : "outline"}
          size="sm"
          className="h-8"
        >
          {buttonLabel}
          {value && (
            <X
              className="ml-1.5 h-3 w-3"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <LookupCombobox
          table={table}
          value={value ?? null}
          onChange={(id) => {
            onChange(id);
            if (id) setOpen(false);
          }}
          placeholder={`Filter by ${label.toLowerCase()}…`}
        />
      </PopoverContent>
    </Popover>
  );
}

interface CigarFiltersProps {
  filters: CigarFilterState;
  onChange: (next: CigarFilterState) => void;
}

export function CigarFilters({ filters, onChange }: CigarFiltersProps) {
  const hasAny =
    !!filters.brand_id ||
    !!filters.wrapper_id ||
    !!filters.strength_id ||
    !!filters.country_id;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterChip
        label="Brand"
        table="brands"
        value={filters.brand_id}
        onChange={(id) => onChange({ ...filters, brand_id: id ?? undefined })}
      />
      <FilterChip
        label="Wrapper"
        table="wrappers"
        value={filters.wrapper_id}
        onChange={(id) => onChange({ ...filters, wrapper_id: id ?? undefined })}
      />
      <FilterChip
        label="Country"
        table="countries"
        value={filters.country_id}
        onChange={(id) => onChange({ ...filters, country_id: id ?? undefined })}
      />
      <FilterChip
        label="Strength"
        table="strength-levels"
        value={filters.strength_id}
        onChange={(id) =>
          onChange({ ...filters, strength_id: id ?? undefined })
        }
      />
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
