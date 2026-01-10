import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ChatBot } from "@/components/ChatBot";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Property from "./pages/Property";
import NotFound from "./pages/NotFound";
import ImportProperties from "./pages/ImportProperties";
import SkipTrace from "./pages/SkipTrace";
import { MarketingApp } from "./components/marketing/MarketingApp";

const queryClient = new QueryClient();

// ChatBot wrapper that hides on property pages (which have their own OfferChatBot)
const GlobalChatBot = () => {
  const location = useLocation();
  const isPropertyPage = location.pathname.startsWith('/property/');
  
  if (isPropertyPage) return null;
  return <ChatBot />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <GlobalChatBot />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/import" element={<ImportProperties />} />
          <Route path="/skip-trace" element={<SkipTrace />} />
          <Route path="/property/:slug" element={<Property />} />
          {/* Marketing Communication System Routes */}
          <Route path="/marketing/*" element={<MarketingApp />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
