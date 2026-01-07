import { supabase } from "@/lib/supabase";

export async function getPendingCoachesCount(): Promise<number> {
    const { count, error } = await supabase
        .from('coaches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_approval');

    if (error) {
        console.error("Error fetching pending coaches count:", error.message);
        return 0;
    }
    return count || 0;
}
