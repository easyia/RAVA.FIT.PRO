import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import StudentList from "./pages/StudentList";
import StudentRegistration from "./pages/StudentRegistration";
import Protocols from "./pages/Protocols";
import CalendarPage from "./pages/CalendarPage";
import ComparativeAnalysis from "./pages/ComparativeAnalysis";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AITrainingAssistant from "./pages/AITrainingAssistant";
import AINutritionAssistant from "./pages/AINutritionAssistant";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import LandingPage from "./pages/public/LandingPage";
import NotFound from "./pages/NotFound";
import { UpdatesOnboarding } from "@/components/dashboard/UpdatesOnboarding";
import FinancePage from "./pages/coach/FinancePage";
import PlanManager from "./pages/coach/PlanManager";
import CoachPublicProfile from "./pages/public/CoachPublicProfile";

import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";
import StudentLogin from "./pages/student/StudentLogin";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentLayout from "./components/layout/StudentLayout";
import InvitePage from "./pages/student/InvitePage";
import StudentOnboarding from "./pages/student/StudentOnboarding";
import StudentSignup from "./pages/student/StudentSignup";
import StudentInterfaceTour from "./pages/student/StudentInterfaceTour";
import StudentAnamnesisForm from "./pages/student/StudentAnamnesisForm";
import StudentPreview from "./pages/student/StudentPreview";

import StudentTraining from "./pages/student/StudentTraining";
import StudentDiet from "./pages/student/StudentDiet";

import MessagesPage from "./pages/coach/MessagesPage";
import PendingApproval from "./pages/coach/PendingApproval";
import CoachApprovals from "./pages/admin/CoachApprovals";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UpdatesOnboarding />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/link/:coach_id" element={<CoachPublicProfile />} />
          <Route path="/auth" element={<Auth />} />

          {/* Fluxo Público Aluno */}
          <Route path="/convite/:coach_id" element={<InvitePage />} />
          <Route path="/onboarding-aluno" element={<StudentOnboarding />} />
          <Route path="/aluno/cadastro" element={<StudentSignup />} />
          <Route path="/aluno/login" element={<StudentLogin />} />
          <Route path="/aluno/preview" element={<StudentPreview />} />
          <Route path="/aguardando-aprovacao" element={<PendingApproval />} />

          {/* Área Logada Aluno */}
          <Route element={<RoleProtectedRoute allowedRole="student" redirectTo="/aluno/login" />}>
            <Route path="/aluno/onboarding-interface" element={<StudentInterfaceTour />} />
            <Route path="/aluno/anamnese" element={<StudentAnamnesisForm />} />

            <Route element={<StudentLayout />}>
              <Route path="/aluno/dashboard" element={<StudentDashboard />} />
              <Route path="/aluno/treino" element={<StudentTraining />} />
              <Route path="/aluno/dieta" element={<StudentDiet />} />
              <Route path="/aluno/agenda" element={<div className="p-4">Agenda do Aluno</div>} />
              <Route path="/aluno/perfil" element={<div className="p-4">Perfil do Aluno</div>} />
            </Route>
          </Route>


          {/* Rotas do Coach */}
          <Route element={<RoleProtectedRoute allowedRole="coach" redirectTo="/auth" />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/mensagens" element={<MessagesPage />} />
            <Route path="/alunos" element={<StudentList />} />
            <Route path="/cadastro" element={<StudentRegistration />} />
            <Route path="/cadastro/:id" element={<StudentRegistration />} />
            <Route path="/protocolos" element={<Protocols />} />
            <Route path="/ia-assistant" element={<AITrainingAssistant />} />
            <Route path="/ia-diet-assistant" element={<AINutritionAssistant />} />
            <Route path="/analise-comparativa" element={<ComparativeAnalysis />} />
            <Route path="/financeiro" element={<FinancePage />} />
            <Route path="/financeiro/planos" element={<PlanManager />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/admin/aprovacoes" element={<CoachApprovals />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
