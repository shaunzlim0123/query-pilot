import { User, Bot } from "lucide-react";
import { SqlBlock } from "./SqlBlock";
import { ResultTable } from "./ResultTable";
import { ChartRenderer } from "./ChartRenderer";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${
          isUser
            ? "bg-gold-dim border border-gold/20"
            : "bg-sage-dim border border-sage/20"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-gold" />
        ) : (
          <Bot className="w-4 h-4 text-sage" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isUser ? "text-right" : ""}`}>
        {/* Role label */}
        <span
          className="text-[11px] uppercase tracking-wider text-text-muted mb-1 block"
          style={{ fontFamily: "'Azeret Mono', monospace" }}
        >
          {isUser ? "You" : "QueryPilot"}
        </span>

        {/* Text */}
        <div
          className={`inline-block rounded-xl px-4 py-3 max-w-full text-[14px] leading-relaxed ${
            isUser
              ? "bg-gold-dim/60 border border-gold/10 text-text"
              : "bg-surface border border-border-dim text-text-secondary"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* SQL Block */}
        {!isUser && message.generated_sql && (
          <div className="mt-1 text-left">
            <SqlBlock sql={message.generated_sql} />
          </div>
        )}

        {/* Error */}
        {!isUser && message.error && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-coral-dim border border-coral/20 text-coral text-[13px] text-left">
            {message.error}
          </div>
        )}

        {/* Result Table */}
        {!isUser && message.result_data && (
          <div className="mt-1 text-left">
            <ResultTable data={message.result_data} />
          </div>
        )}

        {/* Chart */}
        {!isUser && message.chart_config && message.result_data && (
          <div className="mt-1 text-left">
            <ChartRenderer config={message.chart_config} data={message.result_data} />
          </div>
        )}

        {/* Timestamp */}
        <span
          className="text-[10px] text-text-muted/60 mt-1 block"
          style={{ fontFamily: "'Azeret Mono', monospace" }}
        >
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
