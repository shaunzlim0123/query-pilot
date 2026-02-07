import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { metricsApi } from "@/api/metrics";
import type { MetricCreate, MetricUpdate } from "@/types";

export function useMetricTree() {
  return useQuery({
    queryKey: ["metrics", "tree"],
    queryFn: metricsApi.tree,
  });
}

export function useMetric(id: string | undefined) {
  return useQuery({
    queryKey: ["metrics", id],
    queryFn: () => metricsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MetricCreate) => metricsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metrics"] }),
  });
}

export function useUpdateMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MetricUpdate }) =>
      metricsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metrics"] }),
  });
}

export function useDeleteMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: metricsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metrics"] }),
  });
}

export function useComputeMetric() {
  return useMutation({
    mutationFn: metricsApi.compute,
  });
}
