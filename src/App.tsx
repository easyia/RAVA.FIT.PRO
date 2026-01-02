import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load PrivateRoute to keep Auth out of the initial bundle
const PrivateRoute = lazy(() => import("@/components/auth/PrivateRoute").then(m => ({ default: m.PrivateRoute })));

// Lazy load all pages for better performance and bundle isolation
const Dashboard = lazy(() => import("./pages/Dashboard"));
const StudentList = lazy(() => import("./pages/StudentList"));
const StudentRegistration = lazy(() => import("./pages/StudentRegistration"));
const Protocols = lazy(() => import("./pages/Protocols"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const ComparativeAnalysis = lazy(() => import("./pages/ComparativeAnalysis"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const AITrainingAssistant = lazy(() => import("./pages/AITrainingAssistant"));
const AINutritionAssistant = lazy(() => import("./pages/AINutritionAssistant"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Auth = lazy(() => import("./pages/Auth"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const UpdatesOnboarding = lazy(() => import("@/components/dashboard/UpdatesOnboarding").then(m => ({ default: m.UpdatesOnboarding })));

const queryClient = new QueryClient();

// Helper component to manage global authenticated features
const GlobalAuthFeatures = () => {
  const location = useLocation();
  // Only run auth-dependent features on private routes
  const isPublicPath = ["/", "/landing", "/auth", "/login"].includes(location.pathname);

  if (isPublicPath) return null;

  return (
    <Suspense fallback={null}>
      <UpdatesOnboarding />
    </Suspense>
  );
};

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <GlobalAuthFeatures />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Auth />} />

            {/* Protected App Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/alunos" element={<StudentList />} />
              <Route path="/cadastro" element={<StudentRegistration />} />
              <Route path="/cadastro/:id" element={<StudentRegistration />} />
              <Route path="/protocolos" element={<Protocols />} />
              <Route path="/ia-assistant" element={<AITrainingAssistant />} />
              <Route path="/ia-diet-assistant" element={<AINutritionAssistant />} />
              <Route path="/analise-comparativa" element={<ComparativeAnalysis />} />
              <Route path="/relatorios" element={<Reports />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route path="/calendario" element={<CalendarPage />} />
              <Route path="/onboarding" element={<Onboarding />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
