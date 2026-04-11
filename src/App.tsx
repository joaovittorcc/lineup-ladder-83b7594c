import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {!isSupabaseConfigured && (
        <div
          role="alert"
          className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 px-4 py-2 text-center text-sm font-medium text-black"
        >
          Configure <code className="rounded bg-black/10 px-1">VITE_SUPABASE_URL</code> e{" "}
          <code className="rounded bg-black/10 px-1">VITE_SUPABASE_ANON_KEY</code> no ficheiro{" "}
          <code className="rounded bg-black/10 px-1">.env</code> na raiz do projeto (reinicie{" "}
          <code className="rounded bg-black/10 px-1">npm run dev</code> depois).
        </div>
      )}
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
