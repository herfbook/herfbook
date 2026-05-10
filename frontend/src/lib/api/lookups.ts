import axios from "axios";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { apiClient } from "./client";

export type UUID = string;

// Backend route segments — note hyphenation for the multi-word ones.
export type LookupTable =
  | "manufacturers"
  | "brands"
  | "vitolas"
  | "wrappers"
  | "binders"
  | "fillers"
  | "countries"
  | "strength-levels"
  | "flavor-tags"
  | "purchase-types"
  | "environments";

export type UserCreatableLookupTable =
  | "manufacturers"
  | "brands"
  | "vitolas"
  | "wrappers"
  | "binders"
  | "fillers";

export const USER_CREATABLE_TABLES: ReadonlySet<UserCreatableLookupTable> =
  new Set([
    "manufacturers",
    "brands",
    "vitolas",
    "wrappers",
    "binders",
    "fillers",
  ]);

// Common fields surfaced on every lookup response.
export interface LookupBase {
  id: UUID;
  name: string;
  source: string;
  is_imported: boolean;
  is_active: boolean;
}

export interface ManufacturerEntry extends LookupBase {
  website?: string | null;
  country?: string | null;
}

export interface BrandEntry extends LookupBase {
  manufacturer_id?: UUID | null;
  manufacturer_name?: string | null;
  country?: string | null;
  website?: string | null;
}

export interface VitolaEntry extends LookupBase {
  length_inches?: number | null;
  ring_gauge?: number | null;
  category?: string | null;
}

export interface WrapperEntry extends LookupBase {
  color_category?: string | null;
  origin_region?: string | null;
}

export interface BinderEntry extends LookupBase {
  origin_region?: string | null;
}

export interface FillerEntry extends LookupBase {
  country?: string | null;
  priming?: string | null;
}

export interface CountryEntry extends LookupBase {
  iso_code?: string | null;
}

export interface StrengthLevelEntry extends LookupBase {
  sort_order: number;
}

export interface FlavorTagEntry extends LookupBase {
  category?: string | null;
}

export interface PurchaseTypeEntry extends LookupBase {}
export interface EnvironmentEntry extends LookupBase {}

export type LookupEntry =
  | ManufacturerEntry
  | BrandEntry
  | VitolaEntry
  | WrapperEntry
  | BinderEntry
  | FillerEntry
  | CountryEntry
  | StrengthLevelEntry
  | FlavorTagEntry
  | PurchaseTypeEntry
  | EnvironmentEntry;

export interface LookupCreateBase {
  name: string;
}

export interface ManufacturerCreate extends LookupCreateBase {
  website?: string | null;
  country?: string | null;
}

export interface BrandCreate extends LookupCreateBase {
  manufacturer_id?: UUID | null;
  country?: string | null;
  website?: string | null;
}

export interface VitolaCreate extends LookupCreateBase {
  length_inches?: number | null;
  ring_gauge?: number | null;
  category?: "parejo" | "figurado" | null;
}

export interface WrapperCreate extends LookupCreateBase {
  color_category?: string | null;
  origin_region?: string | null;
}

export interface BinderCreate extends LookupCreateBase {
  origin_region?: string | null;
}

export interface FillerCreate extends LookupCreateBase {
  country?: string | null;
  priming?: string | null;
}

export type LookupCreate =
  | ManufacturerCreate
  | BrandCreate
  | VitolaCreate
  | WrapperCreate
  | BinderCreate
  | FillerCreate;

// Backend returns this body on 409 dedup.
export interface DuplicateLookupResponse {
  detail: string;
  existing_id: UUID;
}

export const lookupKeys = {
  all: (table: LookupTable) => ["lookups", table] as const,
  search: (table: LookupTable, query: string) =>
    [...lookupKeys.all(table), "search", query] as const,
  detail: (table: LookupTable, id: string) =>
    [...lookupKeys.all(table), "detail", id] as const,
};

async function fetchLookups(
  table: LookupTable,
  q: string
): Promise<LookupEntry[]> {
  const params: Record<string, string | number> = { limit: 50 };
  if (q.trim()) params.q = q.trim();
  const { data } = await apiClient.get<LookupEntry[]>(`/lookups/${table}`, {
    params,
  });
  return data;
}

export function useLookupSearch(table: LookupTable, query: string) {
  return useQuery({
    queryKey: lookupKeys.search(table, query.trim()),
    queryFn: () => fetchLookups(table, query),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

// Resolve the display label for a single id by hitting the search endpoint
// with no query — the backend caps at 50 entries but most users won't have
// previously selected an entry that isn't in the top 50, and in any case
// we fall back to caching the entry once it has been seen via search.
async function findEntryById(
  table: LookupTable,
  id: string
): Promise<LookupEntry | null> {
  const { data } = await apiClient.get<LookupEntry[]>(`/lookups/${table}`, {
    params: { limit: 200 },
  });
  return data.find((e) => e.id === id) ?? null;
}

export function useLookupEntry(
  table: LookupTable,
  id: string | null | undefined
) {
  return useQuery({
    queryKey: lookupKeys.detail(table, id ?? ""),
    queryFn: () => findEntryById(table, id as string),
    enabled: !!id,
    staleTime: Infinity,
  });
}

export function useCreateLookup<T extends LookupEntry = LookupEntry>(
  table: UserCreatableLookupTable
) {
  const queryClient = useQueryClient();
  return useMutation<
    T | { duplicate: true; existing_id: UUID },
    unknown,
    LookupCreate
  >({
    mutationFn: async (payload: LookupCreate) => {
      try {
        const { data } = await apiClient.post<T>(`/lookups/${table}`, payload);
        return data;
      } catch (err) {
        if (
          axios.isAxiosError(err) &&
          err.response?.status === 409 &&
          err.response.data?.existing_id
        ) {
          return {
            duplicate: true,
            existing_id: err.response.data.existing_id as UUID,
          };
        }
        throw err;
      }
    },
    onSuccess: (data) => {
      // Invalidate search cache so the new entry surfaces.
      queryClient.invalidateQueries({ queryKey: lookupKeys.all(table) });
      // Cache the entry detail if we got a real one back.
      if (data && !("duplicate" in data)) {
        queryClient.setQueryData(lookupKeys.detail(table, data.id), data);
      }
    },
  });
}
