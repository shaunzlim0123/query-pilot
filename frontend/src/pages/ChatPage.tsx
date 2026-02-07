import { useState, useCallback } from "react";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatInterface } from "@/components/chat/ChatInterface";
import {
  useConversations,
  useConversation,
  useCreateConversation,
  useDeleteConversation,
  useSendMessage,
} from "@/hooks/useConversations";
import { useDatasets } from "@/hooks/useDatasets";

export function ChatPage() {
  const [activeConvId, setActiveConvId] = useState<string>();
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<string[]>([]);

  const { data: conversations = [] } = useConversations();
  const { data: activeConv } = useConversation(activeConvId);
  const { data: datasets = [] } = useDatasets();

  const createConv = useCreateConversation();
  const deleteConv = useDeleteConversation();
  const sendMsg = useSendMessage();

  const handleCreate = useCallback(async () => {
    const conv = await createConv.mutateAsync({ datasetIds: selectedDatasetIds });
    setActiveConvId(conv.id);
  }, [createConv, selectedDatasetIds]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteConv.mutateAsync(id);
      if (activeConvId === id) setActiveConvId(undefined);
    },
    [deleteConv, activeConvId],
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeConvId) {
        // Auto-create conversation
        const conv = await createConv.mutateAsync({
          title: content.slice(0, 50),
          datasetIds: selectedDatasetIds,
        });
        setActiveConvId(conv.id);
        await sendMsg.mutateAsync({
          convId: conv.id,
          content,
          datasetIds: selectedDatasetIds,
        });
      } else {
        await sendMsg.mutateAsync({
          convId: activeConvId,
          content,
          datasetIds: selectedDatasetIds,
        });
      }
    },
    [activeConvId, createConv, sendMsg, selectedDatasetIds],
  );

  return (
    <div className="flex h-screen">
      {/* Conversation sidebar */}
      <div className="w-[280px] border-r border-border-dim bg-ink/40 flex-shrink-0">
        <ConversationList
          conversations={conversations}
          activeId={activeConvId}
          onSelect={(id) => {
            setActiveConvId(id);
            const conv = conversations.find((c) => c.id === id);
            if (conv) setSelectedDatasetIds(conv.dataset_ids);
          }}
          onCreate={handleCreate}
          onDelete={handleDelete}
        />
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatInterface
          messages={activeConv?.messages ?? []}
          datasets={datasets}
          selectedDatasetIds={selectedDatasetIds}
          onSelectDatasets={setSelectedDatasetIds}
          onSendMessage={handleSendMessage}
          isSending={sendMsg.isPending}
        />
      </div>
    </div>
  );
}
