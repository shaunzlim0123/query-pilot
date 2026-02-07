import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsApi } from "@/api/reports";
import type { ReportScheduleCreate } from "@/types";

export function useReportSchedules() {
  return useQuery({
    queryKey: ["reportSchedules"],
    queryFn: reportsApi.listSchedules,
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReportScheduleCreate) => reportsApi.createSchedule(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reportSchedules"] }),
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ReportScheduleCreate & { is_active: boolean }>;
    }) => reportsApi.updateSchedule(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reportSchedules"] }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reportsApi.deleteSchedule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reportSchedules"] }),
  });
}

export function useRunSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reportsApi.runSchedule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: reportsApi.listReports,
  });
}

export function useReport(id: string | undefined) {
  return useQuery({
    queryKey: ["reports", id],
    queryFn: () => reportsApi.getReport(id!),
    enabled: !!id,
  });
}
