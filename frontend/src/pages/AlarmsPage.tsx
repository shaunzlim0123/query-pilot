import { useState } from "react";
import {
  Bell,
  Plus,
  Trash2,
  Loader2,
  ToggleLeft,
  ToggleRight,
  TestTube2,
  History,
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  useAlarms,
  useCreateAlarm,
  useUpdateAlarm,
  useDeleteAlarm,
  useAlarmHistory,
  useTestAlarm,
} from "@/hooks/useAlarms";
import { useMetricTree } from "@/hooks/useMetrics";
import type { Metric, AlarmOperator } from "@/types";

const OPERATOR_LABELS: Record<AlarmOperator, string> = {
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  eq: "=",
};

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

function StatusBadge({ status }: { status: string }) {
  if (status === "triggered") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-coral-dim text-coral text-[11px] font-medium" style={{ fontFamily: "'Azeret Mono', monospace" }}>
        <AlertTriangle className="w-3 h-3" />
        Triggered
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-lavender-dim text-lavender text-[11px] font-medium" style={{ fontFamily: "'Azeret Mono', monospace" }}>
        <XCircle className="w-3 h-3" />
        Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sage-dim text-sage text-[11px] font-medium" style={{ fontFamily: "'Azeret Mono', monospace" }}>
      <CheckCircle className="w-3 h-3" />
      OK
    </span>
  );
}

function AlarmHistoryModal({ alarmId, onClose }: { alarmId: string; onClose: () => void }) {
  const { data: events = [], isLoading } = useAlarmHistory(alarmId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[70vh] mx-6 atlas-card overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-dim">
          <h3 className="text-lg text-text" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Alarm History
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-elevated text-text-muted hover:text-text cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-auto max-h-[calc(70vh-80px)] p-5">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-gold animate-[atlas-spin_1s_linear_infinite]" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-8">No events recorded</p>
          ) : (
            <div className="space-y-2">
              {events.map((evt) => (
                <div key={evt.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface border border-border-dim">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    evt.event_type === "triggered" ? "bg-coral" : evt.event_type === "resolved" ? "bg-sage" : "bg-lavender"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text">{evt.message}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-text-muted" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                        {evt.event_type}
                      </span>
                      {evt.metric_value != null && (
                        <span className="text-[11px] text-text-muted" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                          value: {evt.metric_value}
                        </span>
                      )}
                      <span className="text-[11px] text-text-muted" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                        {new Date(evt.sent_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AlarmsPage() {
  const { data: alarms = [], isLoading } = useAlarms();
  const { data: metricTree = [] } = useMetricTree();
  const createAlarm = useCreateAlarm();
  const updateAlarm = useUpdateAlarm();
  const deleteAlarm = useDeleteAlarm();
  const testAlarm = useTestAlarm();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [metricId, setMetricId] = useState("");
  const [operator, setOperator] = useState<AlarmOperator>("gt");
  const [threshold, setThreshold] = useState("");
  const [interval, setInterval] = useState("300");
  const [webhook, setWebhook] = useState("");
  const [historyAlarmId, setHistoryAlarmId] = useState<string>();

  const flatMetrics = flattenForSelect(metricTree);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAlarm.mutateAsync({
      name,
      metric_id: metricId,
      operator,
      threshold: parseFloat(threshold),
      check_interval: parseInt(interval),
      slack_webhook: webhook,
    });
    setShowCreate(false);
    setName("");
    setMetricId("");
    setThreshold("");
  };

  const inputClass =
    "w-full rounded-lg bg-surface border border-border-dim focus:border-gold/30 focus:ring-1 focus:ring-gold/20 px-3 py-2 text-sm text-text placeholder:text-text-muted outline-none transition-all";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Alarms
          </h1>
          <p className="text-text-secondary text-sm">
            Monitor metric thresholds and receive Slack notifications when conditions are met.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold-dim hover:bg-gold-medium border border-gold/15 hover:border-gold/30 text-gold text-sm font-medium transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Alarm
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="atlas-card p-5 mb-6 animate-scale-in">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-text-muted mb-1.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                Name
              </label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="High latency alert" required className={inputClass} />
            </div>
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-text-muted mb-1.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                Metric
              </label>
              <select value={metricId} onChange={(e) => setMetricId(e.target.value)} required className={inputClass}>
                <option value="">Select metric...</option>
                {flatMetrics.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] uppercase tracking-wider text-text-muted mb-1.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                  Operator
                </label>
                <select value={operator} onChange={(e) => setOperator(e.target.value as AlarmOperator)} className={inputClass}>
                  {(Object.entries(OPERATOR_LABELS) as [AlarmOperator, string][]).map(([op, label]) => (
                    <option key={op} value={op}>{label} ({op})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] uppercase tracking-wider text-text-muted mb-1.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                  Threshold
                </label>
                <input type="number" step="any" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="100" required className={inputClass} style={{ fontFamily: "'Azeret Mono', monospace" }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] uppercase tracking-wider text-text-muted mb-1.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                  Check interval (s)
                </label>
                <input type="number" value={interval} onChange={(e) => setInterval(e.target.value)} className={inputClass} style={{ fontFamily: "'Azeret Mono', monospace" }} />
              </div>
              <div>
                <label className="block text-[12px] uppercase tracking-wider text-text-muted mb-1.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                  Slack Webhook
                </label>
                <input value={webhook} onChange={(e) => setWebhook(e.target.value)} placeholder="https://hooks.slack.com/..." className={inputClass} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={createAlarm.isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-obsidian text-sm font-medium hover:bg-gold/90 disabled:opacity-50 cursor-pointer">
              {createAlarm.isPending && <Loader2 className="w-4 h-4 animate-[atlas-spin_1s_linear_infinite]" />}
              Create Alarm
            </button>
          </div>
        </form>
      )}

      {/* Alarm list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-gold animate-[atlas-spin_1s_linear_infinite]" />
        </div>
      ) : alarms.length === 0 ? (
        <div className="text-center py-16 atlas-card animate-fade-in stagger-1">
          <Bell className="w-10 h-10 text-text-muted/20 mx-auto mb-3" />
          <p className="text-text-muted text-sm">No alarms configured</p>
          <p className="text-text-muted/60 text-[13px] mt-1">
            Create an alarm to monitor your metrics
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alarms.map((alarm, i) => (
            <div key={alarm.id} className={`atlas-card p-4 flex items-center gap-4 animate-fade-in stagger-${Math.min(i + 1, 8)}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                alarm.status === "triggered"
                  ? "bg-coral-dim border border-coral/15"
                  : alarm.status === "error"
                  ? "bg-lavender-dim border border-lavender/15"
                  : "bg-sage-dim border border-sage/15"
              }`}>
                <Bell className={`w-5 h-5 ${
                  alarm.status === "triggered" ? "text-coral" : alarm.status === "error" ? "text-lavender" : "text-sage"
                }`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text">{alarm.name}</p>
                  <StatusBadge status={alarm.status} />
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[11px] text-text-muted" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                    {OPERATOR_LABELS[alarm.operator]} {alarm.threshold}
                  </span>
                  {alarm.last_value != null && (
                    <span className="text-[11px] text-text-muted" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                      Current: {alarm.last_value}
                    </span>
                  )}
                  <span className="text-[11px] text-text-muted" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                    Every {alarm.check_interval}s
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateAlarm.mutate({ id: alarm.id, data: { is_active: !alarm.is_active } })}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${alarm.is_active ? "text-sage" : "text-text-muted"}`}
                  title={alarm.is_active ? "Active" : "Inactive"}
                >
                  {alarm.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => testAlarm.mutate(alarm.id)}
                  disabled={testAlarm.isPending}
                  className="p-1.5 rounded-md text-text-muted hover:text-sky hover:bg-sky-dim transition-all cursor-pointer"
                  title="Test alarm"
                >
                  <TestTube2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setHistoryAlarmId(alarm.id)}
                  className="p-1.5 rounded-md text-text-muted hover:text-gold hover:bg-gold-dim transition-all cursor-pointer"
                  title="View history"
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteAlarm.mutate(alarm.id)}
                  className="p-1.5 rounded-md text-text-muted hover:text-coral hover:bg-coral-dim transition-all cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History modal */}
      {historyAlarmId && (
        <AlarmHistoryModal alarmId={historyAlarmId} onClose={() => setHistoryAlarmId(undefined)} />
      )}
    </div>
  );
}
