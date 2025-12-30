import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import Dashboard from "./pages/Dashboard";
import StudentList from "./pages/StudentList";
import StudentRegistration from "./pages/StudentRegistration";
import Protocols from "./pages/Protocols";
import CalendarPage from "./pages/CalendarPage";
import ComparativeAnalysis from "./pages/ComparativeAnalysis";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AITrainingAssistant from "./pages/AITrainingAssistant";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />

          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/alunos" element={<StudentList />} />
            <Route path="/cadastro" element={<StudentRegistration />} />
            <Route path="/cadastro/:id" element={<StudentRegistration />} />
            <Route path="/protocolos" element={<Protocols />} />
            <Route path="/ia-assistant" element={<AITrainingAssistant />} />
            <Route path="/analise-comparativa" element={<ComparativeAnalysis />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
