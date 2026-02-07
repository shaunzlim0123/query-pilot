import { get, post, del } from "./client";
import type { Conversation, ConversationDetail, Message } from "@/types";

export const conversationsApi = {
  list: () => get<Conversation[]>("/queries/conversations"),

  get: (id: string) => get<ConversationDetail>(`/queries/conversations/${id}`),

  create: (title?: string, datasetIds?: string[]) =>
    post<Conversation>("/queries/conversations", {
      title: title || "New Conversation",
      dataset_ids: datasetIds || [],
    }),

  delete: (id: string) => del(`/queries/conversations/${id}`),

  sendMessage: (convId: string, content: string, datasetIds?: string[]) =>
    post<Message>(`/queries/conversations/${convId}/messages`, {
      content,
      dataset_ids: datasetIds || [],
    }),

  executeSql: (sql: string) =>
    post<{ columns: string[]; rows: Record<string, unknown>[]; row_count: number }>(
      "/queries/execute-sql",
      { sql },
    ),
};
