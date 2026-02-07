import { useState } from "react";
import {
  FileBarChart,
  Plus,
  Play,
  Trash2,
  Loader2,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Clock,
  Eye,
  X,
} from "lucide-react";
import {
  useReportSchedules,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
  useRunSchedule,
  useReports,
} from "@/hooks/useReports";
import { useMetricTree } from "@/hooks/useMetrics";
import type { Metric, Report } from "@/types";

function flattenForSelect(metrics: Metric[]): Array<{ id: string; name: string }> {
  const result: Array<{ id: string; name: string }> = [];
  const walk = (nodes: Metric[]) => {
    for (const m of nodes) {
      result.push({ id: m.id, name: m.name });
      walk(m.children);
    }
  };
  walk(metrics);
  return result;
}

export function ReportsPage() {
  const { data: schedules = [], isLoading } = useReportSchedules();
  const { data: reports = [] } = useReports();
  const { data: metricTree = [] } = useMetricTree();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();
  const runSchedule = useRunSchedule();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [rootMetricId, setRootMetricId] = useState("");
  const [cron, setCron] = useState("0 9 1 * *");
  const [viewReport, setViewReport] = useState<Report | null>(null);

  const flatMetrics = flattenForSelect(metricTree);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSchedule.mutateAsync({ name, root_metric_id: rootMetricId, cron_expression: cron });
    setShowCreate(false);
    setName("");
    setRootMetricId("");
    setCron("0 9 1 * *");
  };

  const inputClass =
    "w-full rounded-lg bg-surface border border-border-dim focus:border-gold/30 focus:ring-1 focus:ring-gold/20 px-3 py-2 text-sm text-text placeholder:text-text-muted outline-none transition-all";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Reports
          </h1>
          <p className="text-text-secondary text-sm">
            Schedule automated reports on metric hierarchies. Reports compute values, detect anomalies, and track changes.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold-dim hover:bg-gold-medium border border-gold/15 hover:border-gold/30 text-gold text-sm font-medium transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Schedule
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="atlas-card p-5 mb-6 animate-scale-in">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-text-muted mb-1.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                Name
              </label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Monthly Revenue Report" required className={inputClass} />
            </div>
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-text-muted mb-1.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                Root Metric
              </label>
              <select value={rootMetricId} onChange={(e) => setRootMetricId(e.target.value)} required className={inputClass}>
                <option value="">Select metric...</option>
                {flatMetrics.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-text-muted mb-1.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                Cron Expression
              </label>
              <input value={cron} onChange={(e) => setCron(e.target.value)} placeholder="0 9 1 * *" className={inputClass} style={{ fontFamily: "'Azeret Mono', monospace" }} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={createSchedule.isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-obsidian text-sm font-medium hover:bg-gold/90 disabled:opacity-50 cursor-pointer">
              {createSchedule.isPending && <Loader2 className="w-4 h-4 animate-[atlas-spin_1s_linear_infinite]" />}
              Create Schedule
            </button>
          </div>
        </form>
      )}

      {/* Schedules */}
      <div className="space-y-3 mb-10">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider" style={{ fontFamily: "'Azeret Mono', monospace" }}>
          Schedules
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-gold animate-[atlas-spin_1s_linear_infinite]" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12 atlas-card">
            <Calendar className="w-10 h-10 text-text-muted/20 mx-auto mb-3" />
            <p className="text-text-muted text-sm">No schedules created yet</p>
          </div>
        ) : (
          schedules.map((sched, i) => (
            <div key={sched.id} className={`atlas-card p-4 flex items-center gap-4 animate-fade-in stagger-${Math.min(i + 1, 8)}`}>
              <div className="w-10 h-10 rounded-lg bg-sky-dim border border-sky/15 flex items-center justify-center flex-shrink-0">
                <FileBarChart className="w-5 h-5 text-sky" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text">{sched.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[11px] text-text-muted flex items-center gap-1" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                    <Clock className="w-3 h-3" />
                    {sched.cron_expression}
                  </span>
                  {sched.last_run_at && (
                    <span className="text-[11px] text-text-muted" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                      Last: {new Date(sched.last_run_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateSchedule.mutate({ id: sched.id, data: { is_active: !sched.is_active } })}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${sched.is_active ? "text-sage" : "text-text-muted"}`}
                  title={sched.is_active ? "Active" : "Inactive"}
                >
                  {sched.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => runSchedule.mutate(sched.id)}
                  disabled={runSchedule.isPending}
                  className="p-1.5 rounded-md text-text-muted hover:text-sage hover:bg-sage-dim transition-all cursor-pointer"
                  title="Run now"
                >
                  {runSchedule.isPending ? <Loader2 className="w-4 h-4 animate-[atlas-spin_1s_linear_infinite]" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deleteSchedule.mutate(sched.id)}
                  className="p-1.5 rounded-md text-text-muted hover:text-coral hover:bg-coral-dim transition-all cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Generated reports */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider" style={{ fontFamily: "'Azeret Mono', monospace" }}>
          Generated Reports
        </h2>
        {reports.length === 0 ? (
          <p className="text-text-muted text-sm py-4">No reports generated yet. Run a schedule to generate one.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reports.map((report) => (
              <div key={report.id} className="atlas-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-text" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                    {report.period_start} → {report.period_end}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                    Generated {new Date(report.generated_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setViewReport(report)}
                  className="p-1.5 rounded-md text-text-muted hover:text-sky hover:bg-sky-dim transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report viewer modal */}
      {viewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" onClick={() => setViewReport(null)} />
          <div className="relative w-full max-w-3xl max-h-[80vh] mx-6 atlas-card overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-dim">
              <h3 className="text-lg text-text" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Report: {viewReport.period_start} → {viewReport.period_end}
              </h3>
              <button onClick={() => setViewReport(null)} className="p-1.5 rounded-md hover:bg-elevated text-text-muted hover:text-text cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto max-h-[calc(80vh-80px)] p-5">
              <pre className="text-[13px] text-text-secondary whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                {JSON.stringify(viewReport.report_data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
