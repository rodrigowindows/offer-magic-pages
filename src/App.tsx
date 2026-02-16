import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FeatureToggleProvider } from "@/contexts/FeatureToggleContext";
import { UsageAnalyticsProvider } from "@/contexts/UsageAnalyticsContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Property from "./pages/Property";
import NotFound from "./pages/NotFound";
import ImportProperties from "./pages/ImportProperties";
import SkipTrace from "./pages/SkipTrace";
import { MarketingApp } from "./components/marketing/MarketingApp";
import { ProcessApp } from "./components/process/ProcessApp";
import { FeaturesGuide } from "./components/FeaturesGuide";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UsageAnalyticsProvider>
      <FeatureToggleProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/import" element={<ImportProperties />} />
            <Route path="/skip-trace" element={<SkipTrace />} />
            <Route path="/property/:slug" element={<Property />} />
            <Route path="/features" element={<FeaturesGuide />} />
            {/* Marketing Communication System Routes */}
            <Route path="/marketing/*" element={<MarketingApp />} />
            <Route path="/process/*" element={<ProcessApp />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </FeatureToggleProvider>
    </UsageAnalyticsProvider>
  </QueryClientProvider>
);

export default App;
