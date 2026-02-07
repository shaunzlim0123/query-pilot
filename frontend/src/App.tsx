import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ChatPage } from "@/pages/ChatPage";
import { DatasetsPage } from "@/pages/DatasetsPage";
import { MetricsPage } from "@/pages/MetricsPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { AlarmsPage } from "@/pages/AlarmsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<ChatPage />} />
            <Route path="/datasets" element={<DatasetsPage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/alarms" element={<AlarmsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
