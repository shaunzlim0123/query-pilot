import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Database, Compass } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import type { Message, Dataset } from "@/types";

interface ChatInterfaceProps {
  messages: Message[];
  datasets: Dataset[];
  selectedDatasetIds: string[];
  onSelectDatasets: (ids: string[]) => void;
  onSendMessage: (content: string) => void;
  isSending: boolean;
}

export function ChatInterface({
  messages,
  datasets,
  selectedDatasetIds,
  onSelectDatasets,
  onSendMessage,
  isSending,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [showDatasetPicker, setShowDatasetPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isSending) return;
    onSendMessage(text);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleDataset = (id: string) => {
    onSelectDatasets(
      selectedDatasetIds.includes(id)
        ? selectedDatasetIds.filter((d) => d !== id)
        : [...selectedDatasetIds, id],
    );
  };

  const selectedNames = datasets
    .filter((d) => selectedDatasetIds.includes(d.id))
    .map((d) => d.filename);

  return (
    <div className="flex flex-col h-full">
      {/* Dataset selector bar */}
      <div className="relative px-6 py-3 border-b border-border-dim bg-ink/50">
        <button
          onClick={() => setShowDatasetPicker(!showDatasetPicker)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors cursor-pointer"
        >
          <Database className="w-4 h-4 text-gold/60" />
          {selectedNames.length > 0 ? (
            <span className="truncate max-w-sm">
              {selectedNames.join(", ")}
            </span>
          ) : (
            <span className="text-text-muted">Select datasets to query...</span>
          )}
        </button>

        {showDatasetPicker && (
          <div className="absolute top-full left-6 mt-1 z-50 w-72 atlas-glass rounded-lg shadow-2xl p-2 animate-scale-in">
            {datasets.length === 0 ? (
              <p className="text-[13px] text-text-muted p-3">No datasets uploaded yet</p>
            ) : (
              datasets.map((ds) => (
                <label
                  key={ds.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-elevated cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedDatasetIds.includes(ds.id)}
                    onChange={() => toggleDataset(ds.id)}
                    className="accent-[#d4a548] rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text truncate">{ds.filename}</p>
                    <p
                      className="text-[11px] text-text-muted"
                      style={{ fontFamily: "'Azeret Mono', monospace" }}
                    >
                      {ds.row_count.toLocaleString()} rows · {ds.duckdb_table}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gold-dim/50 border border-gold/10 flex items-center justify-center mb-5">
              <Compass className="w-8 h-8 text-gold/60" />
            </div>
            <h2
              className="text-2xl text-text mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Chart Your Course
            </h2>
            <p className="text-text-muted text-sm max-w-md leading-relaxed">
              Select a dataset above and ask a question in natural language.
              QueryPilot will generate SQL, execute it, and visualize the results.
            </p>
            <div className="flex gap-3 mt-6">
              {[
                "What are the top 10 records?",
                "Show monthly trends",
                "Average by category",
              ].map((hint) => (
                <button
                  key={hint}
                  onClick={() => setInput(hint)}
                  className="px-3 py-1.5 rounded-lg border border-border-dim bg-surface text-[12px] text-text-secondary hover:text-text hover:border-border transition-all cursor-pointer"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isSending && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-lg bg-sage-dim border border-sage/20 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-sage animate-[atlas-spin_1s_linear_infinite]" />
                </div>
                <div className="flex items-center">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-text-muted/40 animate-[atlas-pulse_1.2s_ease-in-out_infinite]" />
                    <div className="w-2 h-2 rounded-full bg-text-muted/40 animate-[atlas-pulse_1.2s_ease-in-out_0.2s_infinite]" />
                    <div className="w-2 h-2 rounded-full bg-text-muted/40 animate-[atlas-pulse_1.2s_ease-in-out_0.4s_infinite]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border-dim p-4 bg-ink/30">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedDatasetIds.length === 0
                ? "Select a dataset first..."
                : "Ask about your data..."
            }
            disabled={selectedDatasetIds.length === 0}
            rows={1}
            className="w-full resize-none rounded-xl bg-surface border border-border-dim focus:border-gold/30 focus:ring-1 focus:ring-gold/20 px-4 py-3 pr-12 text-[14px] text-text placeholder:text-text-muted outline-none transition-all disabled:opacity-40"
            style={{
              minHeight: "48px",
              maxHeight: "160px",
              height: "auto",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 160) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending || selectedDatasetIds.length === 0}
            className="absolute right-2 bottom-2 p-2 rounded-lg bg-gold text-obsidian hover:bg-gold/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-[atlas-spin_1s_linear_infinite]" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
