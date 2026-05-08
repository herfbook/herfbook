export type UUID = string;

export interface HumidorReadingResponse {
  id: UUID;
  humidity: number | null;
  temperature_f: number | null;
  source: string;
  recorded_at: string; // ISO datetime
}

export interface HumidorListItem {
  id: UUID;
  name: string;
  description: string | null;
  capacity: number | null;
  location: string | null;
  target_humidity: number | null;
  target_temp_f: number | null;
  is_active: boolean;
  created_at: string; // ISO datetime
  cigar_count: number;
  total_capacity_used: number | null; // percentage 0..100+, null if no capacity set
  latest_reading: HumidorReadingResponse | null;
}

export interface HumidorInventoryItem {
  inventory_id: UUID;
  cigar_id: UUID;
  brand_name: string;
  line: string | null;
  vitola_name: string | null;
  quantity: number;
  date_added_humidor: string | null; // ISO date (no time)
  days_aging: number | null;
}

export interface HumidorDetail extends HumidorListItem {
  contents: HumidorInventoryItem[];
}

export interface HumidorCreate {
  name: string;
  description?: string | null;
  capacity?: number | null;
  location?: string | null;
  target_humidity?: number | null;
  target_temp_f?: number | null;
}

export interface HumidorUpdate {
  name?: string | null;
  description?: string | null;
  capacity?: number | null;
  location?: string | null;
  target_humidity?: number | null;
  target_temp_f?: number | null;
}

export interface HumidorReadingCreate {
  humidity?: number | null;
  temperature_f?: number | null;
  source: "manual" | "sensor_api";
  recorded_at?: string | null;
}
