import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/errors";
import {
  archiveHumidor,
  createHumidor,
  createReading,
  fetchHumidor,
  fetchHumidors,
  updateHumidor,
} from "./api";
import type {
  HumidorCreate,
  HumidorListItem,
  HumidorReadingCreate,
  HumidorUpdate,
} from "./types";

export const humidorKeys = {
  all: ["humidors"] as const,
  lists: () => [...humidorKeys.all, "list"] as const,
  list: (filters: { includeArchived: boolean }) =>
    [...humidorKeys.lists(), filters] as const,
  details: () => [...humidorKeys.all, "detail"] as const,
  detail: (id: string) => [...humidorKeys.details(), id] as const,
};

export function useHumidors(includeArchived: boolean) {
  return useQuery({
    queryKey: humidorKeys.list({ includeArchived }),
    queryFn: () => fetchHumidors(includeArchived),
  });
}

export function useHumidor(id: string) {
  return useQuery({
    queryKey: humidorKeys.detail(id),
    queryFn: () => fetchHumidor(id),
  });
}

export function useCreateHumidor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: HumidorCreate) => createHumidor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: humidorKeys.lists() });
      toast.success("Humidor created");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateHumidor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: HumidorUpdate }) =>
      updateHumidor(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: humidorKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: humidorKeys.lists() });

      const prevDetail = queryClient.getQueryData(humidorKeys.detail(id));
      const prevLists = queryClient.getQueriesData<HumidorListItem[]>({
        queryKey: humidorKeys.lists(),
      });

      queryClient.setQueryData(
        humidorKeys.detail(id),
        (old: HumidorListItem | undefined) => {
          if (!old) return old;
          // Preserve server-side aggregates: cigar_count, total_capacity_used, latest_reading
          return { ...old, ...payload };
        }
      );

      queryClient.setQueriesData<HumidorListItem[]>(
        { queryKey: humidorKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((h) =>
            h.id === id ? ({ ...h, ...payload } as HumidorListItem) : h
          );
        }
      );

      return { prevDetail, prevLists };
    },
    onError: (err, { id }, ctx) => {
      if (ctx) {
        queryClient.setQueryData(humidorKeys.detail(id), ctx.prevDetail);
        ctx.prevLists.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.error(getErrorMessage(err));
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: humidorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: humidorKeys.detail(id) });
      toast.success("Humidor updated");
    },
  });
}

export function useArchiveHumidor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveHumidor(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: humidorKeys.lists() });
      queryClient.removeQueries({ queryKey: humidorKeys.detail(id) });
      toast.success("Humidor archived");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useCreateReading(humidorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: HumidorReadingCreate) =>
      createReading(humidorId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: humidorKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: humidorKeys.detail(humidorId),
      });
      toast.success("Reading logged");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
