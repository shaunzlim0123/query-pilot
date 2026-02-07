import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartConfig, ResultData } from "@/types";

const CHART_COLORS = ["#d4a548", "#4eaa80", "#5b8ec9", "#d0644f", "#9b7ec8"];

interface ChartRendererProps {
  config: ChartConfig;
  data: ResultData;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: unknown }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="atlas-glass rounded-lg px-3 py-2 shadow-lg" style={{ fontFamily: "'Azeret Mono', monospace" }}>
      <p className="text-[11px] text-text-muted mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-[12px]" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : String(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function ChartRenderer({ config, data }: ChartRendererProps) {
  const chartData = data.rows;

  const axisStyle = {
    fontSize: 11,
    fontFamily: "'Azeret Mono', monospace",
    fill: "#6d6354",
  };

  const common = {
    data: chartData,
    margin: { top: 8, right: 8, left: 0, bottom: 0 },
  };

  return (
    <div className="my-2 rounded-lg border border-border-dim overflow-hidden animate-scale-in">
      <div className="px-3 py-2 bg-surface border-b border-border-dim">
        <span
          className="text-[11px] uppercase tracking-wider text-sky/70 font-medium"
          style={{ fontFamily: "'Azeret Mono', monospace" }}
        >
          {config.type} chart
        </span>
      </div>
      <div className="p-4 bg-[#13110e]">
        <ResponsiveContainer width="100%" height={280}>
          {config.type === "line" ? (
            <LineChart {...common}>
              <CartesianGrid stroke="#2a2620" strokeDasharray="3 3" />
              <XAxis dataKey={config.xKey} tick={axisStyle} axisLine={{ stroke: "#342e26" }} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={{ stroke: "#342e26" }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'Azeret Mono', monospace" }} />
              {config.yKeys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART_COLORS[i % CHART_COLORS.length] }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          ) : config.type === "bar" ? (
            <BarChart {...common}>
              <CartesianGrid stroke="#2a2620" strokeDasharray="3 3" />
              <XAxis dataKey={config.xKey} tick={axisStyle} axisLine={{ stroke: "#342e26" }} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={{ stroke: "#342e26" }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'Azeret Mono', monospace" }} />
              {config.yKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  radius={[3, 3, 0, 0]}
                  opacity={0.85}
                />
              ))}
            </BarChart>
          ) : (
            <ScatterChart {...common}>
              <CartesianGrid stroke="#2a2620" strokeDasharray="3 3" />
              <XAxis dataKey={config.xKey} name={config.xKey} tick={axisStyle} axisLine={{ stroke: "#342e26" }} tickLine={false} />
              <YAxis dataKey={config.yKeys[0]} name={config.yKeys[0]} tick={axisStyle} axisLine={{ stroke: "#342e26" }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter data={chartData} fill={CHART_COLORS[0]} opacity={0.8} />
            </ScatterChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
