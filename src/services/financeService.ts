import { supabase } from "@/lib/supabase";

// --- Tipos ---
export interface Plan {
    id: string;
    coach_id: string;
    name: string;
    description?: string;
    price: number;
    type: 'recurring' | 'installment' | 'one_time';
    duration_months: number;
    active: boolean;
}

export interface Subscription {
    id: string;
    student_id: string;
    plan_id: string;
    status: 'active' | 'overdue' | 'cancelled' | 'pending' | 'finished';
    start_date: string;
    end_date?: string;
    payment_day: number;
    auto_renew: boolean;
    plan?: Plan;
    student?: {
        id: string;
        name: string;
        email: string;
        avatar_url: string;
    };
}

export interface Payment {
    id: string;
    subscription_id: string;
    amount: number;
    payment_method: 'pix' | 'credit_card' | 'boleto' | 'cash' | 'manual';
    payment_date: string;
    status: 'paid' | 'pending' | 'failed' | 'refunded';
    notes?: string;
}

// ...

export const signContract = async (subscriptionId: string, contractText: string) => {
    const timestamp = new Date().toISOString();
    const { error } = await supabase
        .from("subscriptions")
        .update({
            contract_accepted_at: timestamp,
            contract_snapshot: contractText
        })
        .eq("id", subscriptionId);

    if (error) throw error;
};

// --- PLANS ---

export const getPlans = async (coachId: string) => {
    const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('coach_id', coachId)
        .eq('active', true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Plan[];
};

export const createPlan = async (plan: Omit<Plan, 'id' | 'coach_id' | 'active'>) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
        .from('plans')
        .insert([{ ...plan, coach_id: userData.user.id }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updatePlan = async (id: string, updates: Partial<Plan>) => {
    const { data, error } = await supabase
        .from('plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deletePlan = async (id: string) => {
    const { error } = await supabase
        .from('plans')
        .update({ active: false })
        .eq('id', id);

    if (error) throw error;
};

// --- SUBSCRIPTIONS ---

export const createSubscription = async (subscription: Omit<Subscription, 'id' | 'status'>) => {
    const { data, error } = await supabase
        .from('subscriptions')
        .insert([{ ...subscription, status: 'active' }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getMyActiveSubscription = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(*)')
        .eq('student_id', userData.user.id)
        .in('status', ['active', 'pending']) // Incluir pending se o contrato for pré-requisito
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Error fetching subscription", error);
        return null;
    }
    return data;
};

export const getOverdueSubscriptionsCount = async () => {
    const { count, error } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'overdue');

    if (error) {
        console.error('Error fetching overdue count:', error);
        return 0;
    }
    return count || 0;
};

// --- METRICS ---

export const getFinancialMetrics = async (coachId: string) => {
    const { data: plans } = await supabase.from('plans').select('id, price').eq('coach_id', coachId);

    // Buscar subscriptions dos estudantes do coach.
    // Como subscriptions não tem coach_id e o RLS filtra, podemos buscar direto e assumir que o filtro ocorre.
    // POREM, user precisa estar autenticado como coach. O RLS "Coaches can manage subscriptions of their students" cuida disso.

    // MRR: Sum of prices of active subscriptions
    // Precisamos fazer join. 
    const { data: activeSubs, error } = await supabase
        .from('subscriptions')
        .select(`
            id,
            plan:plans (price)
        `)
        .eq('status', 'active');

    if (error) console.error(error);

    let totalActiveValue = 0;
    if (activeSubs) {
        totalActiveValue = activeSubs.reduce((acc: number, sub: any) => acc + (sub.plan?.price || 0), 0);
    }
    const activeCount = activeSubs?.length || 0;

    const { count: pendingCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'overdue');

    return {
        monthlyRecurringRevenue: totalActiveValue,
        activeSubscriptions: activeCount,
        pendingPayments: pendingCount || 0,
        recentTransactions: []
    };
};
