import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
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
  useLookupSearch,
  type LookupEntry,
  type LookupTable,
  type UserCreatableLookupTable,
} from "@/lib/api/lookups";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { lookupKeys } from "@/lib/api/lookups";
import { apiClient } from "@/lib/api/client";
import { LookupCreateDialog } from "./lookup-create-dialog";

interface LookupMultiComboboxProps {
  table: LookupTable;
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  nested?: boolean;
  className?: string;
}

async function findEntryById(
  table: LookupTable,
  id: string
): Promise<LookupEntry | null> {
  const { data } = await apiClient.get<LookupEntry[]>(`/lookups/${table}`, {
    params: { limit: 200 },
  });
  return data.find((e) => e.id === id) ?? null;
}

export function LookupMultiCombobox({
  table,
  value,
  onChange,
  placeholder,
  disabled,
  nested,
  className,
}: LookupMultiComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  const isUserCreatable = USER_CREATABLE_TABLES.has(
    table as UserCreatableLookupTable
  );

  const search = useLookupSearch(table, debouncedQuery);
  const queryClient = useQueryClient();

  // Resolve display info for each currently-selected id.
  const selectedQueries = useQueries({
    queries: value.map((id) => ({
      queryKey: lookupKeys.detail(table, id),
      queryFn: () => findEntryById(table, id),
      staleTime: Infinity,
    })),
  });
  const selectedEntries = selectedQueries
    .map((q) => q.data)
    .filter((e): e is LookupEntry => !!e);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (open) {
      const handle = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(handle);
    }
  }, [open]);

  const results = search.data ?? [];

  const showCreateRow = useMemo(() => {
    if (!isUserCreatable) return false;
    const q = debouncedQuery.trim();
    if (!q) return false;
    const lc = q.toLowerCase();
    return !results.some((e) => e.name.toLowerCase() === lc);
  }, [debouncedQuery, results, isUserCreatable]);

  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  function handleCreated(entry: LookupEntry | { id: string }) {
    if (!value.includes(entry.id)) onChange([...value, entry.id]);
    if ("name" in entry) {
      queryClient.setQueryData(lookupKeys.detail(table, entry.id), entry);
    }
    setCreateOpen(false);
  }

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {selectedEntries.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedEntries.map((entry) => (
              <Badge
                key={entry.id}
                variant="secondary"
                className="gap-1.5 pr-1"
              >
                <span>{entry.name}</span>
                <button
                  type="button"
                  onClick={() => remove(entry.id)}
                  disabled={disabled}
                  className="rounded-sm hover:bg-background/40"
                  aria-label={`Remove ${entry.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="w-full justify-between font-normal text-muted-foreground"
            >
              <span className="truncate">{placeholder ?? "Add…"}</span>
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
                    const isSelected = value.includes(entry.id);
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => toggle(entry.id)}
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
      </div>

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
