import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { datasetsApi } from "@/api/datasets";

export function useDatasets() {
  return useQuery({
    queryKey: ["datasets"],
    queryFn: datasetsApi.list,
  });
}

export function useDataset(id: string | undefined) {
  return useQuery({
    queryKey: ["datasets", id],
    queryFn: () => datasetsApi.get(id!),
    enabled: !!id,
  });
}

export function useDatasetPreview(id: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ["datasets", id, "preview", limit],
    queryFn: () => datasetsApi.preview(id!, limit),
    enabled: !!id,
  });
}

export function useUploadDataset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: datasetsApi.upload,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["datasets"] }),
  });
}

export function useDeleteDataset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: datasetsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["datasets"] }),
  });
}
