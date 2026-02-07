import { Database, Trash2, Eye, FileSpreadsheet } from "lucide-react";
import type { Dataset } from "@/types";

interface DatasetCardProps {
  dataset: Dataset;
  onPreview: () => void;
  onDelete: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DatasetCard({ dataset, onPreview, onDelete }: DatasetCardProps) {
  const colCount = Object.keys(dataset.column_schema).length;

  return (
    <div className="atlas-card p-5 group animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold-dim border border-gold/15 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-[15px] font-medium text-text truncate max-w-[200px]">
              {dataset.filename}
            </h3>
            <p
              className="text-[11px] text-text-muted mt-0.5"
              style={{ fontFamily: "'Azeret Mono', monospace" }}
            >
              {dataset.file_type.toUpperCase()} · {formatBytes(dataset.file_size)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onPreview}
            className="p-1.5 rounded-md hover:bg-elevated text-text-muted hover:text-sky transition-all cursor-pointer"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md hover:bg-elevated text-text-muted hover:text-coral transition-all cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-border-dim">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
            Table
          </p>
          <p className="text-[13px] text-text-secondary font-medium truncate" style={{ fontFamily: "'Azeret Mono', monospace" }}>
            {dataset.duckdb_table}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
            Rows
          </p>
          <p className="text-[13px] text-text-secondary font-medium" style={{ fontFamily: "'Azeret Mono', monospace" }}>
            {dataset.row_count.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5" style={{ fontFamily: "'Azeret Mono', monospace" }}>
            Columns
          </p>
          <p className="text-[13px] text-text-secondary font-medium" style={{ fontFamily: "'Azeret Mono', monospace" }}>
            {colCount}
          </p>
        </div>
      </div>

      {/* Column schema preview */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {Object.entries(dataset.column_schema).slice(0, 6).map(([name, type]) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-border-dim text-[11px] text-text-muted"
            style={{ fontFamily: "'Azeret Mono', monospace" }}
          >
            <Database className="w-2.5 h-2.5" />
            {name}
            <span className="text-text-muted/50">({type})</span>
          </span>
        ))}
        {colCount > 6 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface border border-border-dim text-[11px] text-text-muted" style={{ fontFamily: "'Azeret Mono', monospace" }}>
            +{colCount - 6} more
          </span>
        )}
      </div>
    </div>
  );
}
