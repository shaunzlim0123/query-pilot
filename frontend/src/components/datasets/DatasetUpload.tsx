import { useState, useRef, useCallback } from "react";
import { Upload, FileUp, Loader2, Check, X } from "lucide-react";
import { useUploadDataset } from "@/hooks/useDatasets";

export function DatasetUpload() {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadDataset();

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      for (const file of Array.from(files)) {
        upload.mutate(file);
      }
    },
    [upload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 ${
        dragOver
          ? "border-gold bg-gold-dim/40 scale-[1.01]"
          : "border-border hover:border-border-bright hover:bg-surface/50"
      } p-8 text-center group`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.parquet"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex flex-col items-center gap-3">
        {upload.isPending ? (
          <>
            <Loader2 className="w-10 h-10 text-gold animate-[atlas-spin_1s_linear_infinite]" />
            <p className="text-sm text-text-secondary">Uploading...</p>
          </>
        ) : upload.isSuccess ? (
          <>
            <div className="w-10 h-10 rounded-full bg-sage-dim border border-sage/20 flex items-center justify-center animate-scale-in">
              <Check className="w-5 h-5 text-sage" />
            </div>
            <p className="text-sm text-sage">Upload complete!</p>
          </>
        ) : upload.isError ? (
          <>
            <div className="w-10 h-10 rounded-full bg-coral-dim border border-coral/20 flex items-center justify-center animate-scale-in">
              <X className="w-5 h-5 text-coral" />
            </div>
            <p className="text-sm text-coral">Upload failed. Try again.</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-elevated border border-border-dim flex items-center justify-center group-hover:border-gold/20 group-hover:bg-gold-dim/30 transition-all">
              {dragOver ? (
                <FileUp className="w-6 h-6 text-gold" />
              ) : (
                <Upload className="w-6 h-6 text-text-muted group-hover:text-gold transition-colors" />
              )}
            </div>
            <div>
              <p className="text-sm text-text-secondary">
                Drop CSV or Parquet files here, or{" "}
                <span className="text-gold underline underline-offset-2">browse</span>
              </p>
              <p
                className="text-[11px] text-text-muted mt-1"
                style={{ fontFamily: "'Azeret Mono', monospace" }}
              >
                .csv, .parquet supported
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
