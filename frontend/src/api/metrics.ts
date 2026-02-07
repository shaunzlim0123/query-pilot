import { get, post, put, del } from "./client";
import type { Metric, MetricCreate, MetricUpdate, MetricComputeResult } from "@/types";

export const metricsApi = {
  tree: () => get<Metric[]>("/metrics/tree"),

  get: (id: string) => get<Metric>(`/metrics/${id}`),

  create: (data: MetricCreate) => post<Metric>("/metrics", data),

  update: (id: string, data: MetricUpdate) => put<Metric>(`/metrics/${id}`, data),

  delete: (id: string) => del(`/metrics/${id}`),

  subtree: (id: string) => get<Metric>(`/metrics/${id}/subtree`),

  compute: (id: string) => post<MetricComputeResult>(`/metrics/${id}/compute`),
};
