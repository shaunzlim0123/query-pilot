import { useState } from "react";
import { Database, Loader2 } from "lucide-react";
import { DatasetUpload } from "@/components/datasets/DatasetUpload";
import { DatasetCard } from "@/components/datasets/DatasetCard";
import { DatasetPreviewModal } from "@/components/datasets/DatasetPreviewModal";
import { useDatasets, useDeleteDataset } from "@/hooks/useDatasets";

export function DatasetsPage() {
  const { data: datasets = [], isLoading } = useDatasets();
  const deleteDataset = useDeleteDataset();
  const [previewId, setPreviewId] = useState<string>();

  const previewDataset = datasets.find((d) => d.id === previewId);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1
          className="text-3xl mb-1"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Datasets
        </h1>
        <p className="text-text-secondary text-sm">
          Upload and manage your data sources. CSV and Parquet files are loaded into DuckDB for fast analytical queries.
        </p>
      </div>

      {/* Upload zone */}
      <div className="mb-8 animate-fade-in stagger-1">
        <DatasetUpload />
      </div>

      {/* Dataset grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gold animate-[atlas-spin_1s_linear_infinite]" />
        </div>
      ) : datasets.length === 0 ? (
        <div className="text-center py-16 animate-fade-in stagger-2">
          <Database className="w-12 h-12 text-text-muted/20 mx-auto mb-3" />
          <p className="text-text-muted">No datasets uploaded yet</p>
          <p className="text-text-muted/60 text-sm mt-1">
            Drop a file above to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {datasets.map((ds, i) => (
            <div key={ds.id} className={`stagger-${Math.min(i + 2, 8)}`}>
              <DatasetCard
                dataset={ds}
                onPreview={() => setPreviewId(ds.id)}
                onDelete={() => deleteDataset.mutate(ds.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {previewId && previewDataset && (
        <DatasetPreviewModal
          datasetId={previewId}
          filename={previewDataset.filename}
          onClose={() => setPreviewId(undefined)}
        />
      )}
    </div>
  );
}
