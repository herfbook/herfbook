import { apiClient } from "@/lib/api/client";
import type {
  HumidorCreate,
  HumidorDetail,
  HumidorListItem,
  HumidorReadingCreate,
  HumidorReadingResponse,
  HumidorUpdate,
} from "./types";

export async function fetchHumidors(
  includeArchived: boolean
): Promise<HumidorListItem[]> {
  const { data } = await apiClient.get<HumidorListItem[]>("/humidors", {
    params: { include_archived: includeArchived },
  });
  return data;
}

export async function fetchHumidor(id: string): Promise<HumidorDetail> {
  const { data } = await apiClient.get<HumidorDetail>(`/humidors/${id}`);
  return data;
}

export async function createHumidor(
  payload: HumidorCreate
): Promise<HumidorListItem> {
  const { data } = await apiClient.post<HumidorListItem>("/humidors", payload);
  return data;
}

export async function updateHumidor(
  id: string,
  payload: HumidorUpdate
): Promise<HumidorListItem> {
  const { data } = await apiClient.patch<HumidorListItem>(
    `/humidors/${id}`,
    payload
  );
  return data;
}

export async function archiveHumidor(id: string): Promise<void> {
  await apiClient.delete(`/humidors/${id}`);
}

export async function createReading(
  humidorId: string,
  payload: HumidorReadingCreate
): Promise<HumidorReadingResponse> {
  const { data } = await apiClient.post<HumidorReadingResponse>(
    `/humidors/${humidorId}/readings`,
    payload
  );
  return data;
}
