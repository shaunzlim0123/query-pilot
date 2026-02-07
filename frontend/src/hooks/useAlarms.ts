import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alarmsApi } from "@/api/alarms";
import type { AlarmCreate, AlarmUpdate } from "@/types";

export function useAlarms() {
  return useQuery({
    queryKey: ["alarms"],
    queryFn: alarmsApi.list,
  });
}

export function useCreateAlarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AlarmCreate) => alarmsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alarms"] }),
  });
}

export function useUpdateAlarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AlarmUpdate }) =>
      alarmsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alarms"] }),
  });
}

export function useDeleteAlarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: alarmsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alarms"] }),
  });
}

export function useAlarmHistory(id: string | undefined) {
  return useQuery({
    queryKey: ["alarms", id, "history"],
    queryFn: () => alarmsApi.history(id!),
    enabled: !!id,
  });
}

export function useTestAlarm() {
  return useMutation({
    mutationFn: alarmsApi.test,
  });
}
