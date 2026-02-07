import { X, Loader2 } from "lucide-react";
import { useDatasetPreview } from "@/hooks/useDatasets";

interface DatasetPreviewModalProps {
  datasetId: string;
  filename: string;
  onClose: () => void;
}

export function DatasetPreviewModal({ datasetId, filename, onClose }: DatasetPreviewModalProps) {
  const { data: preview, isLoading } = useDatasetPreview(datasetId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[80vh] mx-6 atlas-card overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-dim">
          <div>
            <h3 className="text-lg text-text" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {filename}
            </h3>
            {preview && (
              <p
                className="text-[11px] text-text-muted mt-0.5"
                style={{ fontFamily: "'Azeret Mono', monospace" }}
              >
                Showing {preview.rows.length} of {preview.total_rows.toLocaleString()} rows
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-elevated text-text-muted hover:text-text transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[calc(80vh-80px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-gold animate-[atlas-spin_1s_linear_infinite]" />
            </div>
          ) : preview ? (
            <table className="w-full text-[13px]" style={{ fontFamily: "'Azeret Mono', monospace" }}>
              <thead className="sticky top-0 z-10">
                <tr className="bg-surface">
                  {preview.columns.map((col) => (
                    <th
                      key={col}
                      className="text-left px-3 py-2.5 text-text-muted font-medium text-[11px] uppercase tracking-wider border-b border-border-dim whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-border-dim/30 hover:bg-elevated/20 transition-colors"
                  >
                    {preview.columns.map((col) => (
                      <td
                        key={col}
                        className="px-3 py-2 text-text-secondary whitespace-nowrap max-w-[250px] truncate"
                      >
                        {row[col] == null ? (
                          <span className="text-text-muted/40 italic">null</span>
                        ) : (
                          String(row[col])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </div>
  );
}
