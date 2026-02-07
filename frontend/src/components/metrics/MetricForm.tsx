import { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";
import type { Metric, Dataset } from "@/types";
import { useCreateMetric, useUpdateMetric } from "@/hooks/useMetrics";

interface MetricFormProps {
  metric?: Metric | null;
  datasets: Dataset[];
  parentMetrics: Array<{ id: string; name: string }>;
  onClose: () => void;
}

export function MetricForm({ metric, datasets, parentMetrics, onClose }: MetricFormProps) {
  const [name, setName] = useState(metric?.name ?? "");
  const [description, setDescription] = useState(metric?.description ?? "");
  const [datasetId, setDatasetId] = useState(metric?.dataset_id ?? "");
  const [sqlQuery, setSqlQuery] = useState(metric?.sql_query ?? "");
  const [unit, setUnit] = useState(metric?.unit ?? "");
  const [parentId, setParentId] = useState<string>("");

  const createMetric = useCreateMetric();
  const updateMetric = useUpdateMetric();
  const isPending = createMetric.isPending || updateMetric.isPending;

  useEffect(() => {
    if (metric) {
      setName(metric.name);
      setDescription(metric.description);
      setDatasetId(metric.dataset_id);
      setSqlQuery(metric.sql_query);
      setUnit(metric.unit);
    }
  }, [metric]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (metric) {
      await updateMetric.mutateAsync({
        id: metric.id,
        data: { name, description, dataset_id: datasetId, sql_query: sqlQuery, unit },
      });
    } else {
      await createMetric.mutateAsync({
        name,
        description,
        dataset_id: datasetId,
        sql_query: sqlQuery,
        unit,
        parent_id: parentId || null,
      });
    }
    onClose();
  };

  const inputClass =
    "w-full rounded-lg bg-surface border border-border-dim focus:border-gold/30 focus:ring-1 focus:ring-gold/20 px-3 py-2 text-sm text-text placeholder:text-text-muted outline-none transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg mx-6 atlas-card overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-dim">
          <h3 className="text-lg text-text" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {metric ? "Edit Metric" : "New Metric"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-elevated text-text-muted hover:text-text transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[12px] uppercase tracking-wider text-text-muted mb-1.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
              Name
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Total Revenue" required className={inputClass} />
          </div>

          <div>
            <label className="block text-[12px] uppercase tracking-wider text-text-muted mb-1.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
              Description
            </label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Sum of all revenue..." className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-text-muted mb-1.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                Dataset
              </label>
              <select value={datasetId} onChange={(e) => setDatasetId(e.target.value)} className={inputClass}>
                <option value="">Select...</option>
                {datasets.map((ds) => (
                  <option key={ds.id} value={ds.id}>{ds.filename}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-text-muted mb-1.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                Unit
              </label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="USD, %, count..." className={inputClass} />
            </div>
          </div>

          {!metric && (
            <div>
              <label className="block text-[12px] uppercase tracking-wider text-text-muted mb-1.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                Parent metric
              </label>
              <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={inputClass}>
                <option value="">None (root metric)</option>
                {parentMetrics.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[12px] uppercase tracking-wider text-text-muted mb-1.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
              SQL Query
            </label>
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="SELECT SUM(amount) FROM sales"
              rows={3}
              className={`${inputClass} resize-none`}
              style={{ fontFamily: "'Azeret Mono', monospace" }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text transition-colors cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name || isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-obsidian text-sm font-medium hover:bg-gold/90 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-[atlas-spin_1s_linear_infinite]" /> : <Save className="w-4 h-4" />}
              {metric ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
