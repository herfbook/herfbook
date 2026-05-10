import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/errors";
import { humidorKeys } from "@/features/humidors/queries";
import { cigarKeys } from "@/features/cigars/queries";
import {
  createInventory,
  deleteInventory,
  fetchInventoryItem,
  fetchInventoryList,
  smokeInventory,
  transferInventory,
  updateInventory,
} from "./api";
import type {
  InventoryCreate,
  InventoryListFilters,
  InventoryUpdate,
  SmokeRequest,
  TransferRequest,
  UUID,
} from "./types";

export const inventoryKeys = {
  all: ["inventory"] as const,
  lists: () => [...inventoryKeys.all, "list"] as const,
  list: (filters: InventoryListFilters) =>
    [...inventoryKeys.lists(), filters] as const,
  details: () => [...inventoryKeys.all, "detail"] as const,
  detail: (id: string) => [...inventoryKeys.details(), id] as const,
};

export function useInventoryList(filters: InventoryListFilters) {
  return useQuery({
    queryKey: inventoryKeys.list(filters),
    queryFn: () => fetchInventoryList(filters),
    placeholderData: keepPreviousData,
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => fetchInventoryItem(id),
    enabled: !!id,
  });
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
  queryClient.invalidateQueries({ queryKey: humidorKeys.all });
  queryClient.invalidateQueries({ queryKey: cigarKeys.all });
}

export function useCreateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InventoryCreate) => createInventory(payload),
    onSuccess: (data) => {
      invalidateAll(queryClient);
      queryClient.setQueryData(inventoryKeys.detail(data.id), data);
      toast.success("Added to inventory");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: UUID;
      payload: InventoryUpdate;
    }) => updateInventory(id, payload),
    onSuccess: (data, { id }) => {
      invalidateAll(queryClient);
      queryClient.setQueryData(inventoryKeys.detail(id), data);
      toast.success("Inventory updated");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteInventory(id),
    onSuccess: (_, id) => {
      invalidateAll(queryClient);
      queryClient.removeQueries({ queryKey: inventoryKeys.detail(id) });
      toast.success("Inventory deleted");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useTransferInventory(inventoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransferRequest) =>
      transferInventory(inventoryId, payload),
    onSuccess: (data) => {
      invalidateAll(queryClient);
      queryClient.setQueryData(inventoryKeys.detail(inventoryId), data);
      toast.success("Cigars transferred");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useSmokeInventory(inventoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SmokeRequest = {}) =>
      smokeInventory(inventoryId, payload),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Logged. Quantity decreased.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
