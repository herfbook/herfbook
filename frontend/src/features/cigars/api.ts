import { apiClient } from "@/lib/api/client";
import type {
  CigarCreate,
  CigarDetail,
  CigarImage,
  CigarListFilters,
  CigarUpdate,
  PaginatedCigars,
  UUID,
} from "./types";

export async function fetchCigars(
  filters: CigarListFilters
): Promise<PaginatedCigars> {
  const params: Record<string, string | number> = {
    offset: filters.offset ?? 0,
    limit: filters.limit ?? 50,
  };
  if (filters.q?.trim()) params.q = filters.q.trim();
  if (filters.brand_id) params.brand_id = filters.brand_id;
  if (filters.wrapper_id) params.wrapper_id = filters.wrapper_id;
  if (filters.strength_id) params.strength_id = filters.strength_id;
  if (filters.country_id) params.country_id = filters.country_id;
  const { data } = await apiClient.get<PaginatedCigars>("/cigars", { params });
  return data;
}

export async function fetchCigar(id: UUID): Promise<CigarDetail> {
  const { data } = await apiClient.get<CigarDetail>(`/cigars/${id}`);
  return data;
}

export async function createCigar(payload: CigarCreate): Promise<CigarDetail> {
  const { data } = await apiClient.post<CigarDetail>("/cigars", payload);
  return data;
}

export async function updateCigar(
  id: UUID,
  payload: CigarUpdate
): Promise<CigarDetail> {
  const { data } = await apiClient.patch<CigarDetail>(`/cigars/${id}`, payload);
  return data;
}

export async function deleteCigar(id: UUID): Promise<void> {
  await apiClient.delete(`/cigars/${id}`);
}

export async function uploadCigarImage(
  cigarId: UUID,
  file: File,
  imageType: "band" | "full" | "ash",
  onProgress?: (pct: number) => void
): Promise<CigarImage> {
  const form = new FormData();
  form.append("file", file);
  form.append("image_type", imageType);
  const { data } = await apiClient.post<CigarImage>(
    `/cigars/${cigarId}/images`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    }
  );
  return data;
}

export async function setPrimaryCigarImage(
  cigarId: UUID,
  imageId: UUID
): Promise<CigarImage> {
  const { data } = await apiClient.patch<CigarImage>(
    `/cigars/${cigarId}/images/${imageId}`,
    { is_primary: true }
  );
  return data;
}

export async function deleteCigarImage(
  cigarId: UUID,
  imageId: UUID
): Promise<void> {
  await apiClient.delete(`/cigars/${cigarId}/images/${imageId}`);
}
