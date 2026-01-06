# AUDITORIA TÉCNICA OBRIGATÓRIA - FLUXO DE ALUNO (MODO PRODUÇÃO)

**Data:** 05/01/2026
**Responsável:** Antigravity AI

Este documento detalha o mapeamento técnico exato do fluxo de acesso do aluno no sistema RAVA FIT PRO na data atual.

---

### **1. Geração do Link de Convite**
*   **Arquivo Responsável:** `src/components/layout/AppSidebar.tsx`
*   **Componente:** Botão "Copiar Link de Convite" (visível apenas para o Coach quando logado).
*   **Formato da URL Gerada:** `[URL_DA_ORIGEM]/link/[COACH_UUID]`
    *   Exemplo Real: `https://app.ravafit.com.br/link/550e8400-e29b-41d4-a716-446655440000`

### **2. Captura e Cadastro (Signup)**
*   **Página de Destino do Link:** `src/pages/public/CoachPublicProfile.tsx` (Rota: `/link/:coach_id`).
*   **Fluxo de Captura:**
    *   O `coach_id` é capturado da URL via `useParams()`.
    *   O botão "Quero ser Aluno" redireciona para `/aluno/cadastro?coach_id=[ID]`.
*   **Formulário de Cadastro:** `src/pages/student/StudentSignup.tsx`.
    *   O ID é lido através de `useSearchParams()`.
*   **Lógica de Vínculo:**
    *   No momento do `supabase.auth.signUp`, o `coach_id` e a `role: 'student'` são passados dentro do objeto `options.data` (metadata do usuário).
    *   A persistência na tabela `public.students` é delegada a um Trigger/Função no Supabase (Database Management System) que escuta a criação de novos usuários no Auth.

### **3. Dashboards e Rotas Mobile**
*   **Paths em `App.tsx`:**
    *   **Dashboard Aluno:** `/aluno/dashboard`
    *   **Treino:** `/aluno/treino` (Atualmente um Placeholder)
    *   **Dieta:** `/aluno/dieta` (Atualmente um Placeholder)
    *   **Agenda:** `/aluno/agenda`
    *   **Perfil/Evolução:** `/aluno/perfil`
*   **Navegação Inferior:** O componente `StudentLayout` (menu inferior mobile) utiliza `<NavLink>` com `path` absoluto, garantindo navegação SPA sem recarregamento.

### **4. Integração com Banco de Dados Reais**
*   **Status de Consumo:**
    *   **Dashboard (`StudentDashboard.tsx`):** **REAL**. Carrega dados via Supabase (Profile, Fotos de Avaliação, Contrato).
    *   **Contrato Financeiro:** **REAL**. Integrado ao `financeService.ts` filtrando pelo `user.id` do aluno.
    *   **Treino e Dieta:** **ESTÁTICO/PLACEHOLDER**. As rotas em `App.tsx` ainda renderizam `<div>` temporárias, embora os serviços `getTrainingPrograms` e `getMealPlans` já existam no `studentService.ts`.

### **5. Estabilidade de Interface**
*   **Overlays:** Não foram detectados banners de "Modo Preview" ou camadas de bloqueio aplicadas globalmente.
*   **Modo Preview:** O botão de "Preview" reside exclusivamente na sidebar do Coach para fins de teste e não afeta o acesso direto do aluno.
*   **Acessibilidade Mobile:** O `StudentLayout` usa `z-index: 50` para o menu fixo e `pb-safe` para evitar sobreposição com a barra de navegação nativa do Android/iOS.
*   **Bloqueios Legais:** O único modal de bloqueio ativo é o `LegalConsentModal` (LGPD e Termos de Uso), exigido para o primeiro acesso.

---
**Conclusão da Auditoria:** O fluxo de aquisição e dashboard principal está em produção. As páginas de Treino e Dieta do aluno são as próximas pendências para substituição de dados reais na interface.
