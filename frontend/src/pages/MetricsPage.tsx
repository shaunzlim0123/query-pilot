import { useState, useMemo } from "react";
import { Plus, Loader2 } from "lucide-react";
import { MetricTree } from "@/components/metrics/MetricTree";
import { MetricForm } from "@/components/metrics/MetricForm";
import { useMetricTree } from "@/hooks/useMetrics";
import { useDatasets } from "@/hooks/useDatasets";
import type { Metric } from "@/types";

function flattenMetrics(metrics: Metric[]): Array<{ id: string; name: string }> {
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

export function MetricsPage() {
  const { data: metrics = [], isLoading } = useMetricTree();
  const { data: datasets = [] } = useDatasets();
  const [formOpen, setFormOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);

  const flatMetrics = useMemo(() => flattenMetrics(metrics), [metrics]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Metrics
          </h1>
          <p className="text-text-secondary text-sm">
            Define hierarchical metrics with SQL queries. Metrics are stored as a tree in Neo4j.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingMetric(null);
            setFormOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold-dim hover:bg-gold-medium border border-gold/15 hover:border-gold/30 text-gold text-sm font-medium transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Metric
        </button>
      </div>

      {/* Tree */}
      <div className="atlas-card p-5 animate-fade-in stagger-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-gold animate-[atlas-spin_1s_linear_infinite]" />
          </div>
        ) : (
          <MetricTree
            metrics={metrics}
            onEdit={(m) => {
              setEditingMetric(m);
              setFormOpen(true);
            }}
          />
        )}
      </div>

      {/* Form modal */}
      {formOpen && (
        <MetricForm
          metric={editingMetric}
          datasets={datasets}
          parentMetrics={flatMetrics}
          onClose={() => {
            setFormOpen(false);
            setEditingMetric(null);
          }}
        />
      )}
    </div>
  );
}
