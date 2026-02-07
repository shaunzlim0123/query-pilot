import { get, postForm, del } from "./client";
import type { Dataset, DatasetPreview } from "@/types";

export const datasetsApi = {
  list: () => get<Dataset[]>("/datasets"),

  get: (id: string) => get<Dataset>(`/datasets/${id}`),

  preview: (id: string, limit = 50) =>
    get<DatasetPreview>(`/datasets/${id}/preview?limit=${limit}`),

  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return postForm<Dataset>("/datasets/upload", fd);
  },

  delete: (id: string) => del(`/datasets/${id}`),
};
