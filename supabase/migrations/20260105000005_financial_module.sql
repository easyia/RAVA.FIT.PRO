-- Migration: Financial Module (Plans, Subscriptions, Payments)
-- Created: 2026-01-05
-- Purpose: Infraestrutura para gestão financeira, planos e assinaturas de alunos.

-- 1. PLANS: Modelos de planos criados pelo Coach
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL,
  type text NOT NULL CHECK (type IN ('recurring', 'installment', 'one_time')), -- Recorrente (mensalidade), Parcelado (plano trimestral etc), Único
  duration_months integer DEFAULT 1, -- Duração do ciclo (1 para mensal, 3 para trimestral, etc)
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for Plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage their own plans"
  ON public.plans FOR ALL
  USING (auth.uid() = coach_id);

CREATE POLICY "Students can view plans (read-only)"
  ON public.plans FOR SELECT
  USING (true); -- Simplificado, ou filtrar por coach vinculado


-- 2. SUBSCRIPTIONS: Vinculo do aluno a um plano
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL, -- Se o plano for deletado, a assinatura mantém o histórico mas sem vinculo
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'overdue', 'cancelled', 'pending', 'finished')),
  start_date date DEFAULT CURRENT_DATE,
  end_date date, -- Calculado com base na duração do plano
  payment_day integer NOT NULL CHECK (payment_day BETWEEN 1 AND 31),
  auto_renew boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage subscriptions of their students"
  ON public.subscriptions FOR ALL
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE coach_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (student_id = auth.uid());


-- 3. PAYMENTS: Histórico de transações
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  payment_method text CHECK (payment_method IN ('pix', 'credit_card', 'boleto', 'cash', 'manual')),
  payment_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
  reference_month date, -- Para saber a qual mês se refere
  notes text,
  created_at timestamptz DEFAULT now()
);

-- RLS for Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage payments"
  ON public.payments FOR ALL
  USING (
    subscription_id IN (
      SELECT s.id FROM public.subscriptions s
      JOIN public.students st ON s.student_id = st.id
      WHERE st.coach_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own payments"
  ON public.payments FOR SELECT
  USING (
    subscription_id IN (
      SELECT id FROM public.subscriptions WHERE student_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_plans_coach ON public.plans(coach_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_student ON public.subscriptions(student_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON public.payments(subscription_id);
