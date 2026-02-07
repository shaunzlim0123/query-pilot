import { Plus, MessageSquare, Trash2 } from "lucide-react";
import type { Conversation } from "@/types";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border-dim">
        <button
          onClick={onCreate}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gold-dim hover:bg-gold-medium border border-gold/15 hover:border-gold/30 text-gold text-sm font-medium transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {conversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
            <p className="text-[13px] text-text-muted">No conversations yet</p>
            <p className="text-[11px] text-text-muted/60 mt-1">Start by creating one above</p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  onClick={() => onSelect(conv.id)}
                  className={`group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all cursor-pointer ${
                    activeId === conv.id
                      ? "bg-elevated border border-border text-text"
                      : "text-text-secondary hover:text-text hover:bg-surface border border-transparent"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-50" />
                  <span className="flex-1 truncate">{conv.title}</span>
                  <span
                    className="text-[10px] text-text-muted/50 flex-shrink-0 hidden group-hover:block"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-text-muted hover:text-coral transition-colors" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
