import { get, post, put, del } from "./client";
import type { ReportSchedule, ReportScheduleCreate, Report } from "@/types";

export const reportsApi = {
  listSchedules: () => get<ReportSchedule[]>("/reports/schedules"),

  createSchedule: (data: ReportScheduleCreate) =>
    post<ReportSchedule>("/reports/schedules", data),

  updateSchedule: (id: string, data: Partial<ReportScheduleCreate & { is_active: boolean }>) =>
    put<ReportSchedule>(`/reports/schedules/${id}`, data),

  deleteSchedule: (id: string) => del(`/reports/schedules/${id}`),

  runSchedule: (id: string) => post<Report>(`/reports/schedules/${id}/run`),

  listReports: () => get<Report[]>("/reports"),

  getReport: (id: string) => get<Report>(`/reports/${id}`),
};
