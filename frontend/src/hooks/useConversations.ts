import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsApi } from "@/api/conversations";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: conversationsApi.list,
  });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: ["conversations", id],
    queryFn: () => conversationsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ title, datasetIds }: { title?: string; datasetIds?: string[] }) =>
      conversationsApi.create(title, datasetIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: conversationsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      convId,
      content,
      datasetIds,
    }: {
      convId: string;
      content: string;
      datasetIds?: string[];
    }) => conversationsApi.sendMessage(convId, content, datasetIds),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["conversations", variables.convId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useExecuteSql() {
  return useMutation({
    mutationFn: conversationsApi.executeSql,
  });
}
