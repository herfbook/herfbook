import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/errors";
import { humidorKeys } from "@/features/humidors/queries";
import {
  createCigar,
  deleteCigar,
  deleteCigarImage,
  fetchCigar,
  fetchCigars,
  setPrimaryCigarImage,
  updateCigar,
  uploadCigarImage,
} from "./api";
import type {
  CigarCreate,
  CigarListFilters,
  CigarUpdate,
  UUID,
} from "./types";

export const cigarKeys = {
  all: ["cigars"] as const,
  lists: () => [...cigarKeys.all, "list"] as const,
  list: (filters: CigarListFilters) =>
    [...cigarKeys.lists(), filters] as const,
  details: () => [...cigarKeys.all, "detail"] as const,
  detail: (id: string) => [...cigarKeys.details(), id] as const,
};

export function useCigars(filters: CigarListFilters) {
  return useQuery({
    queryKey: cigarKeys.list(filters),
    queryFn: () => fetchCigars(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCigar(id: string) {
  return useQuery({
    queryKey: cigarKeys.detail(id),
    queryFn: () => fetchCigar(id),
    enabled: !!id,
  });
}

export function useCreateCigar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CigarCreate) => createCigar(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cigarKeys.lists() });
      queryClient.setQueryData(cigarKeys.detail(data.id), data);
      toast.success("Cigar created");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateCigar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: UUID; payload: CigarUpdate }) =>
      updateCigar(id, payload),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: cigarKeys.lists() });
      queryClient.setQueryData(cigarKeys.detail(id), data);
      toast.success("Cigar updated");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteCigar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteCigar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: cigarKeys.lists() });
      queryClient.removeQueries({ queryKey: cigarKeys.detail(id) });
      toast.success("Cigar deleted");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

interface UploadVars {
  file: File;
  imageType: "band" | "full" | "ash";
  onProgress?: (pct: number) => void;
}

export function useUploadCigarImage(cigarId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, imageType, onProgress }: UploadVars) =>
      uploadCigarImage(cigarId, file, imageType, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cigarKeys.detail(cigarId) });
      queryClient.invalidateQueries({ queryKey: cigarKeys.lists() });
      toast.success("Image uploaded");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useSetPrimaryCigarImage(cigarId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: UUID) => setPrimaryCigarImage(cigarId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cigarKeys.detail(cigarId) });
      queryClient.invalidateQueries({ queryKey: cigarKeys.lists() });
      toast.success("Primary image updated");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteCigarImage(cigarId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: UUID) => deleteCigarImage(cigarId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cigarKeys.detail(cigarId) });
      queryClient.invalidateQueries({ queryKey: cigarKeys.lists() });
      // Humidor counts can change if image affects rendering — invalidate too.
      queryClient.invalidateQueries({ queryKey: humidorKeys.all });
      toast.success("Image deleted");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
