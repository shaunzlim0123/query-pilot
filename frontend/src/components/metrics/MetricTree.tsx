import { useState } from "react";
import { ChevronRight, ChevronDown, GitBranch, Play, Pencil, Trash2, Loader2 } from "lucide-react";
import type { Metric, MetricComputeResult } from "@/types";
import { useComputeMetric, useDeleteMetric } from "@/hooks/useMetrics";

interface MetricNodeProps {
  metric: Metric;
  depth: number;
  onEdit: (metric: Metric) => void;
}

function MetricNode({ metric, depth, onEdit }: MetricNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [computeResult, setComputeResult] = useState<MetricComputeResult | null>(null);
  const computeMetric = useComputeMetric();
  const deleteMetric = useDeleteMetric();

  const hasChildren = metric.children.length > 0;

  const handleCompute = async () => {
    const result = await computeMetric.mutateAsync(metric.id);
    setComputeResult(result);
  };

  return (
    <div className="animate-fade-in" style={{ animationDelay: `${depth * 0.05}s` }}>
      <div className="group flex items-center gap-1 py-1.5 hover:bg-elevated/30 rounded-md px-2 -mx-2 transition-colors">
        {/* Expand toggle */}
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className={`w-5 h-5 flex items-center justify-center rounded transition-colors cursor-pointer ${
            hasChildren ? "text-text-muted hover:text-text" : "text-transparent"
          }`}
        >
          {hasChildren && (
            expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Icon */}
        <div className={`w-6 h-6 rounded flex items-center justify-center ${
          hasChildren ? "bg-gold-dim" : "bg-sage-dim"
        }`}>
          <GitBranch className={`w-3 h-3 ${hasChildren ? "text-gold" : "text-sage"}`} />
        </div>

        {/* Name & details */}
        <div className="flex-1 min-w-0 ml-1.5">
          <span className="text-sm text-text">{metric.name}</span>
          {metric.unit && (
            <span className="ml-1.5 text-[11px] text-text-muted" style={{ fontFamily: "'Azeret Mono', monospace" }}>
              ({metric.unit})
            </span>
          )}
        </div>

        {/* Computed value */}
        {computeResult && !computeResult.error && computeResult.value != null && (
          <span
            className="px-2 py-0.5 rounded bg-sage-dim text-sage text-[12px] font-medium mr-1"
            style={{ fontFamily: "'Azeret Mono', monospace" }}
          >
            {computeResult.value.toLocaleString()} {computeResult.unit}
          </span>
        )}
        {computeResult?.error && (
          <span className="text-[11px] text-coral mr-1">{computeResult.error}</span>
        )}

        {/* Actions */}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCompute}
            disabled={computeMetric.isPending}
            className="p-1 rounded hover:bg-surface text-text-muted hover:text-sage transition-all cursor-pointer"
            title="Compute"
          >
            {computeMetric.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-[atlas-spin_1s_linear_infinite]" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={() => onEdit(metric)}
            className="p-1 rounded hover:bg-surface text-text-muted hover:text-sky transition-all cursor-pointer"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteMetric.mutate(metric.id)}
            className="p-1 rounded hover:bg-surface text-text-muted hover:text-coral transition-all cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="ml-6 pl-3 border-l border-border-dim/50">
          {metric.children.map((child) => (
            <MetricNode
              key={child.id}
              metric={child}
              depth={depth + 1}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MetricTreeProps {
  metrics: Metric[];
  onEdit: (metric: Metric) => void;
}

export function MetricTree({ metrics, onEdit }: MetricTreeProps) {
  if (metrics.length === 0) {
    return (
      <div className="text-center py-12">
        <GitBranch className="w-10 h-10 text-text-muted/20 mx-auto mb-3" />
        <p className="text-text-muted text-sm">No metrics defined yet</p>
        <p className="text-text-muted/60 text-[13px] mt-1">
          Create your first metric to start building a hierarchy
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {metrics.map((metric) => (
        <MetricNode key={metric.id} metric={metric} depth={0} onEdit={onEdit} />
      ))}
    </div>
  );
}
