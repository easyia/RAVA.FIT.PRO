import { supabase } from "@/lib/supabase";

export interface MealLog {
    id: string;
    student_id: string;
    meal_plan_id?: string;
    meal_name: string;
    photo_url?: string;
    notes?: string;
    modified_foods?: any;
    created_at: string;
}

export async function saveMealLog(log: Omit<MealLog, 'id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('meal_logs')
        .insert(log)
        .select()
        .single();

    if (error) {
        console.error("Error saving meal log:", error);
        throw error;
    }
    return data;
}

export async function getMealLogs(studentId: string, limit = 50) {
    const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching meal logs:", error);
        throw error;
    }
    return data;
}

export async function getMealLogsByDate(studentId: string, dateStr: string) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);

    const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('student_id', studentId)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching meal logs by date:", error);
        throw error;
    }
    return data;
}

export async function uploadMealPhoto(file: File, studentId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentId}/${Date.now()}.${fileExt}`;
    const filePath = `meal-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('meals')
        .upload(filePath, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage.from('meals').getPublicUrl(filePath);
    return data.publicUrl;
}
