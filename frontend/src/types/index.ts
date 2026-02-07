// ── Dataset ──
export interface Dataset {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  duckdb_table: string;
  column_schema: Record<string, string>;
  row_count: number;
  uploaded_at: string;
}

export interface DatasetPreview {
  columns: string[];
  rows: Record<string, unknown>[];
  total_rows: number;
}

// ── Conversation & Messages ──
export interface Conversation {
  id: string;
  title: string;
  dataset_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  generated_sql: string | null;
  result_data: ResultData | null;
  chart_config: ChartConfig | null;
  error: string | null;
  created_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface ResultData {
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
}

export interface ChartConfig {
  type: "line" | "bar" | "scatter";
  xKey: string;
  yKeys: string[];
}

// ── Metrics ──
export interface Metric {
  id: string;
  name: string;
  description: string;
  dataset_id: string;
  sql_query: string;
  unit: string;
  sort_order: number;
  children: Metric[];
}

export interface MetricCreate {
  name: string;
  description?: string;
  dataset_id?: string;
  sql_query?: string;
  unit?: string;
  parent_id?: string | null;
  sort_order?: number;
}

export interface MetricUpdate {
  name?: string;
  description?: string;
  dataset_id?: string;
  sql_query?: string;
  unit?: string;
  sort_order?: number;
}

export interface MetricComputeResult {
  metric_id: string;
  metric_name: string;
  value: number | null;
  unit: string;
  error: string | null;
}

// ── Reports ──
export interface ReportSchedule {
  id: string;
  name: string;
  root_metric_id: string;
  cron_expression: string;
  is_active: boolean;
  last_run_at: string | null;
  created_at: string;
}

export interface ReportScheduleCreate {
  name: string;
  root_metric_id: string;
  cron_expression?: string;
}

export interface Report {
  id: string;
  schedule_id: string;
  report_data: Record<string, unknown>;
  period_start: string;
  period_end: string;
  generated_at: string;
}

// ── Alarms ──
export type AlarmOperator = "gt" | "gte" | "lt" | "lte" | "eq";
export type AlarmStatus = "ok" | "triggered" | "error";

export interface Alarm {
  id: string;
  name: string;
  metric_id: string;
  operator: AlarmOperator;
  threshold: number;
  check_interval: number;
  slack_webhook: string;
  is_active: boolean;
  last_checked_at: string | null;
  last_value: number | null;
  status: AlarmStatus;
  created_at: string;
}

export interface AlarmCreate {
  name: string;
  metric_id: string;
  operator: AlarmOperator;
  threshold: number;
  check_interval?: number;
  slack_webhook?: string;
}

export interface AlarmUpdate {
  name?: string;
  operator?: AlarmOperator;
  threshold?: number;
  check_interval?: number;
  slack_webhook?: string;
  is_active?: boolean;
}

export interface AlarmEvent {
  id: string;
  alarm_id: string;
  event_type: string;
  metric_value: number | null;
  threshold: number;
  message: string;
  sent_at: string;
}
