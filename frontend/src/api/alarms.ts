import { get, post, put, del } from "./client";
import type { Alarm, AlarmCreate, AlarmUpdate, AlarmEvent } from "@/types";

export const alarmsApi = {
  list: () => get<Alarm[]>("/alarms"),

  create: (data: AlarmCreate) => post<Alarm>("/alarms", data),

  update: (id: string, data: AlarmUpdate) => put<Alarm>(`/alarms/${id}`, data),

  delete: (id: string) => del(`/alarms/${id}`),

  history: (id: string) => get<AlarmEvent[]>(`/alarms/${id}/history`),

  test: (id: string) => post<AlarmEvent>(`/alarms/${id}/test`),
};
