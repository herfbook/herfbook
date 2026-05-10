import { apiClient } from "@/lib/api/client";
import type {
  InventoryCreate,
  InventoryDetail,
  InventoryListFilters,
  InventoryUpdate,
  PaginatedInventory,
  SmokeRequest,
  SmokeResponse,
  TransferRequest,
  UUID,
} from "./types";

export async function fetchInventoryList(
  filters: InventoryListFilters
): Promise<PaginatedInventory> {
  const params: Record<string, string | number | boolean> = {
    offset: filters.offset ?? 0,
    limit: filters.limit ?? 50,
  };
  if (filters.humidor_id) params.humidor_id = filters.humidor_id;
  if (filters.cigar_id) params.cigar_id = filters.cigar_id;
  if (filters.is_gift != null) params.is_gift = filters.is_gift;
  if (filters.min_quantity != null) params.min_quantity = filters.min_quantity;
  const { data } = await apiClient.get<PaginatedInventory>("/inventory", {
    params,
  });
  return data;
}

export async function fetchInventoryItem(
  id: UUID
): Promise<InventoryDetail> {
  const { data } = await apiClient.get<InventoryDetail>(`/inventory/${id}`);
  return data;
}

export async function createInventory(
  payload: InventoryCreate
): Promise<InventoryDetail> {
  const { data } = await apiClient.post<InventoryDetail>(
    "/inventory",
    payload
  );
  return data;
}

export async function updateInventory(
  id: UUID,
  payload: InventoryUpdate
): Promise<InventoryDetail> {
  const { data } = await apiClient.patch<InventoryDetail>(
    `/inventory/${id}`,
    payload
  );
  return data;
}

export async function deleteInventory(id: UUID): Promise<void> {
  await apiClient.delete(`/inventory/${id}`);
}

export async function transferInventory(
  id: UUID,
  payload: TransferRequest
): Promise<InventoryDetail> {
  const { data } = await apiClient.post<InventoryDetail>(
    `/inventory/${id}/transfer`,
    payload
  );
  return data;
}

export async function smokeInventory(
  id: UUID,
  payload: SmokeRequest = {}
): Promise<SmokeResponse> {
  const { data } = await apiClient.post<SmokeResponse>(
    `/inventory/${id}/smoke`,
    payload
  );
  return data;
}
