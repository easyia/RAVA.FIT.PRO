import { supabase } from "@/lib/supabase";

export interface PublicCoachProfile {
    id: string;
    name: string;
    avatar_url: string;
    bio: string;
    specialty: string;
    social_instagram?: string;
    public_bio?: string; // Mapeado do bio para compatibilidade com o componente
}

export const getPublicCoachProfile = async (coachId: string) => {
    try {
        const { data, error } = await supabase.rpc('get_public_coach_profile', {
            p_coach_id: coachId
        });

        if (error) {
            console.error("RPC get_public_coach_profile failed:", error);
            return null;
        }

        if (Array.isArray(data) && data.length > 0) {
            const profile = data[0];
            return {
                ...profile,
                public_bio: profile.bio // Mapeamento para evitar quebra no front
            } as PublicCoachProfile;
        }

        return null;
    } catch (err) {
        console.error("Unexpected error in getPublicCoachProfile:", err);
        return null;
    }
};
