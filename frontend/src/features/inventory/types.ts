export type UUID = string;

export interface InventoryListItem {
  id: UUID;
  cigar_id: UUID;
  cigar_display_name: string;
  humidor_id: UUID | null;
  humidor_name: string | null;
  quantity: number;
  purchase_date: string | null;
  purchase_price: number | null;
  price_per_stick: number | null;
  vendor: string | null;
  purchase_type_name: string | null;
  is_gift: boolean;
  date_added_humidor: string | null;
  days_aging: number | null;
  created_at: string;
}

export interface TransferRecord {
  id: UUID;
  from_humidor_id: UUID | null;
  from_humidor_name: string | null;
  to_humidor_id: UUID | null;
  to_humidor_name: string | null;
  quantity: number;
  transferred_at: string;
  notes: string | null;
}

export interface InventoryDetail extends InventoryListItem {
  vendor_url: string | null;
  purchase_type_id: UUID | null;
  box_code: string | null;
  gift_from: string | null;
  gift_occasion: string | null;
  gift_to: string | null;
  notes: string | null;
  updated_at: string;
  transfers: TransferRecord[];
}

export interface PaginatedInventory {
  items: InventoryListItem[];
  total: number;
  offset: number;
  limit: number;
}

export interface InventoryCreate {
  cigar_id: UUID;
  humidor_id?: UUID | null;
  quantity: number;
  purchase_date?: string | null;
  purchase_price?: number | null;
  price_per_stick?: number | null;
  vendor?: string | null;
  vendor_url?: string | null;
  purchase_type_id?: UUID | null;
  box_code?: string | null;
  date_added_humidor?: string | null;
  is_gift?: boolean;
  gift_from?: string | null;
  gift_occasion?: string | null;
  gift_to?: string | null;
  notes?: string | null;
}

export type InventoryUpdate = Partial<Omit<InventoryCreate, "cigar_id">>;

export interface InventoryListFilters {
  humidor_id?: UUID;
  cigar_id?: UUID;
  is_gift?: boolean;
  min_quantity?: number;
  offset?: number;
  limit?: number;
}

export interface TransferRequest {
  to_humidor_id: UUID | null;
  quantity: number;
  notes?: string | null;
}

export interface SmokeRequest {
  quantity?: number;
  smoked_at?: string | null;
}

export interface SmokeResponse {
  inventory_id: UUID;
  remaining_quantity: number;
  smoking_session_id: UUID;
}
