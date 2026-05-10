import type {
  BinderEntry,
  BrandEntry,
  FillerEntry,
  LookupEntry,
  LookupTable,
  ManufacturerEntry,
  VitolaEntry,
  WrapperEntry,
} from "@/lib/api/lookups";

/** Per-table secondary text shown muted next to the primary name in
 * combobox results and in selected-entry chips. Returns null when there's
 * nothing useful to show.
 */
export function lookupSecondaryText(
  table: LookupTable,
  entry: LookupEntry
): string | null {
  switch (table) {
    case "manufacturers": {
      const e = entry as ManufacturerEntry;
      return e.country || null;
    }
    case "brands": {
      const e = entry as BrandEntry;
      return e.manufacturer_name || null;
    }
    case "vitolas": {
      const e = entry as VitolaEntry;
      const parts: string[] = [];
      if (e.length_inches != null && e.ring_gauge != null) {
        parts.push(`${e.length_inches} × ${e.ring_gauge}`);
      } else if (e.ring_gauge != null) {
        parts.push(`RG ${e.ring_gauge}`);
      }
      if (e.category) parts.push(e.category);
      return parts.length ? parts.join(", ") : null;
    }
    case "wrappers": {
      const e = entry as WrapperEntry;
      const parts = [e.color_category, e.origin_region].filter(Boolean);
      return parts.length ? (parts as string[]).join(", ") : null;
    }
    case "binders": {
      const e = entry as BinderEntry;
      return e.origin_region || null;
    }
    case "fillers": {
      const e = entry as FillerEntry;
      const parts = [e.country, e.priming].filter(Boolean);
      return parts.length ? (parts as string[]).join(", ") : null;
    }
    default:
      return null;
  }
}
