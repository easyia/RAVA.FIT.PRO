import { supabase } from "@/lib/supabase";

export interface WeeklyFeedback {
    id: string;
    student_id: string;
    coach_id: string;
    training_count: number;
    load_perception: string;
    has_pain: boolean;
    pain_intensity: number;
    pain_location: string;
    fatigue_level: number;
    sleep_quality: number;
    notes: string;
    created_at: string;
}

export interface CreateFeedbackDTO {
    student_id: string;
    coach_id: string;
    training_count: number;
    load_perception: string;
    has_pain: boolean;
    pain_intensity: number;
    pain_location: string;
    fatigue_level: number;
    sleep_quality: number;
    notes: string;
}

export const createFeedback = async (feedback: CreateFeedbackDTO) => {
    const { data, error } = await supabase
        .from("weekly_feedbacks")
        .insert(feedback)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getLastFeedback = async (studentId: string) => {
    const { data, error } = await supabase
        .from("weekly_feedbacks")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data;
};

export const getStudentFeedbacks = async (studentId: string) => {
    const { data, error } = await supabase
        .from("weekly_feedbacks")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
};
