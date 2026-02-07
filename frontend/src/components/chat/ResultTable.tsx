import { useState } from "react";
import { ChevronDown, ChevronUp, Table2 } from "lucide-react";
import type { ResultData } from "@/types";

interface ResultTableProps {
  data: ResultData;
}

export function ResultTable({ data }: ResultTableProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded ? data.rows : data.rows.slice(0, 8);

  if (data.columns.length === 0) return null;

  return (
    <div className="my-2 rounded-lg border border-border-dim overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface border-b border-border-dim">
        <div className="flex items-center gap-2">
          <Table2 className="w-3.5 h-3.5 text-sage" />
          <span
            className="text-[11px] uppercase tracking-wider text-sage/70 font-medium"
            style={{ fontFamily: "'Azeret Mono', monospace" }}
          >
            Results
          </span>
        </div>
        <span
          className="text-[11px] text-text-muted"
          style={{ fontFamily: "'Azeret Mono', monospace" }}
        >
          {data.row_count} row{data.row_count !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]" style={{ fontFamily: "'Azeret Mono', monospace" }}>
          <thead>
            <tr className="bg-surface/50">
              {data.columns.map((col) => (
                <th
                  key={col}
                  className="text-left px-3 py-2 text-text-muted font-medium text-[11px] uppercase tracking-wider border-b border-border-dim whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border-dim/50 hover:bg-elevated/30 transition-colors"
              >
                {data.columns.map((col) => (
                  <td key={col} className="px-3 py-2 text-text-secondary whitespace-nowrap max-w-[300px] truncate">
                    {row[col] == null ? (
                      <span className="text-text-muted/50 italic">null</span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expand/collapse */}
      {data.rows.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-surface/50 hover:bg-surface text-text-muted hover:text-text-secondary text-[12px] transition-colors cursor-pointer"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Show all {data.rows.length} rows
            </>
          )}
        </button>
      )}
    </div>
  );
}
