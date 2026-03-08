import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FeatureToggleProvider } from "@/contexts/FeatureToggleContext";
import { UsageAnalyticsProvider } from "@/contexts/UsageAnalyticsContext";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";

// Lazy load non-critical routes
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const Property = lazy(() => import("./pages/Property"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ImportProperties = lazy(() => import("./pages/ImportProperties"));
const SkipTrace = lazy(() => import("./pages/SkipTrace"));
const MarketingApp = lazy(() => import("./components/marketing/MarketingApp").then(m => ({ default: m.MarketingApp })));
const ProcessApp = lazy(() => import("./components/process/ProcessApp").then(m => ({ default: m.ProcessApp })));
const FeaturesGuide = lazy(() => import("./components/shared/FeaturesGuide").then(m => ({ default: m.FeaturesGuide })));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <UsageAnalyticsProvider>
      <FeatureToggleProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<div className="min-h-screen" />}>
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
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </FeatureToggleProvider>
    </UsageAnalyticsProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
