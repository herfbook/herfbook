export type UUID = string;

export interface CigarFiller {
  id: UUID;
  name: string;
  country: string | null;
  priming: string | null;
}

export interface CigarImage {
  id: UUID;
  image_url: string;
  image_type: "band" | "full" | "ash";
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface CigarListItem {
  id: UUID;
  brand_id: UUID;
  brand_name: string;
  line: string | null;
  vitola_id: UUID | null;
  vitola_name: string | null;
  vitola_size: string | null;
  wrapper_id: UUID | null;
  wrapper_name: string | null;
  strength_id: UUID | null;
  strength_name: string | null;
  country_id: UUID | null;
  country_name: string | null;
  primary_image_url: string | null;
  created_at: string;
}

export interface CigarDetail extends CigarListItem {
  custom_vitola_name: string | null;
  custom_length: number | null;
  custom_ring_gauge: number | null;
  binder_id: UUID | null;
  binder_name: string | null;
  manufacturer_id: UUID | null;
  manufacturer_name: string | null;
  fillers: CigarFiller[];
  upc: string | null;
  description: string | null;
  is_user_created: boolean;
  submission_status: string | null;
  images: CigarImage[];
  updated_at: string;
}

export interface PaginatedCigars {
  items: CigarListItem[];
  total: number;
  offset: number;
  limit: number;
}

export interface CigarCreate {
  brand_id: UUID;
  line?: string | null;
  vitola_id?: UUID | null;
  custom_vitola_name?: string | null;
  custom_length?: number | null;
  custom_ring_gauge?: number | null;
  wrapper_id?: UUID | null;
  binder_id?: UUID | null;
  country_id?: UUID | null;
  manufacturer_id?: UUID | null;
  strength_id?: UUID | null;
  filler_ids?: UUID[];
  upc?: string | null;
  description?: string | null;
}

export type CigarUpdate = Partial<CigarCreate>;

export interface CigarListFilters {
  q?: string;
  brand_id?: UUID;
  wrapper_id?: UUID;
  strength_id?: UUID;
  country_id?: UUID;
  offset?: number;
  limit?: number;
}
