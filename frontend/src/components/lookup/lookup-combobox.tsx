import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/hooks/use-debounce";
import {
  USER_CREATABLE_TABLES,
  useLookupEntry,
  useLookupSearch,
  type LookupEntry,
  type LookupTable,
  type UserCreatableLookupTable,
} from "@/lib/api/lookups";
import { LookupCreateDialog } from "./lookup-create-dialog";
import { lookupSecondaryText } from "./secondary-text";

interface LookupComboboxProps {
  table: LookupTable;
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Controls dialog z-index when nested inside another dialog. */
  nested?: boolean;
  /** Optional id assigned to the trigger button — useful for label association. */
  id?: string;
  className?: string;
}

export function LookupCombobox({
  table,
  value,
  onChange,
  placeholder,
  disabled,
  nested,
  id,
  className,
}: LookupComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);

  const isUserCreatable = USER_CREATABLE_TABLES.has(
    table as UserCreatableLookupTable
  );

  const search = useLookupSearch(table, debouncedQuery);
  const selectedEntry = useLookupEntry(table, value);

  const inputRef = useRef<HTMLInputElement>(null);

  // Reset query each time the popover closes so reopening is fresh.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Focus the search input when the popover opens.
  useEffect(() => {
    if (open) {
      // small delay so the popover has rendered
      const handle = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(handle);
    }
  }, [open]);

  const results = search.data ?? [];

  // Show "Create new" only when the user has typed a query that doesn't
  // produce an exact (case-insensitive) name match, on a user-creatable table.
  const showCreateRow = useMemo(() => {
    if (!isUserCreatable) return false;
    const q = debouncedQuery.trim();
    if (!q) return false;
    const lc = q.toLowerCase();
    return !results.some((e) => e.name.toLowerCase() === lc);
  }, [debouncedQuery, results, isUserCreatable]);

  const triggerLabel = (() => {
    if (selectedEntry.data) return selectedEntry.data.name;
    if (selectedEntry.isLoading && value) return "Loading…";
    return placeholder ?? "Select…";
  })();

  function handleSelect(entry: LookupEntry) {
    onChange(entry.id);
    setOpen(false);
  }

  function handleCreated(entry: LookupEntry | { id: string }) {
    onChange(entry.id);
    setCreateOpen(false);
    setOpen(false);
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !selectedEntry.data && "text-muted-foreground",
              className
            )}
          >
            <span className="truncate">{triggerLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "w-[--radix-popover-trigger-width] p-0",
            nested && "z-[60]"
          )}
          align="start"
          sideOffset={4}
        >
          <div className="border-b p-2">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-8"
            />
          </div>
          <div className="max-h-64 overflow-auto p-1">
            {search.isLoading ? (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching…
              </div>
            ) : results.length === 0 && !showCreateRow ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {debouncedQuery.trim()
                  ? `No matches for "${debouncedQuery.trim()}"`
                  : "No entries"}
              </div>
            ) : (
              <>
                {results.map((entry) => {
                  const secondary = lookupSecondaryText(table, entry);
                  const isSelected = entry.id === value;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => handleSelect(entry)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent/50"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="flex-1 truncate">{entry.name}</span>
                      {secondary && (
                        <span className="truncate text-xs text-muted-foreground">
                          {secondary}
                        </span>
                      )}
                      {entry.source === "user" && (
                        <Badge
                          variant="outline"
                          className="h-4 px-1 text-[10px] font-normal"
                        >
                          User
                        </Badge>
                      )}
                    </button>
                  );
                })}
                {showCreateRow && (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="mt-1 flex w-full items-center gap-2 rounded-sm border-t px-2 py-1.5 pt-2.5 text-left text-sm text-primary transition-colors hover:bg-accent"
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      Couldn't find &ldquo;{debouncedQuery.trim()}&rdquo;?{" "}
                      <span className="font-medium">Create new</span>
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {isUserCreatable && (
        <LookupCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          table={table as UserCreatableLookupTable}
          initialName={debouncedQuery.trim()}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
