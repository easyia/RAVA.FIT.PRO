import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft, Check, ClipboardCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

const SECTIONS = [
    "Identificação",
    "Emergência & Foto",
    "Biometria",
    "Objetivos",
    "Logística",
    "Saúde",
    "Dores",
    "Hábitos",
    "Nutrição",
    "Rotina",
    "Final"
];

export default function StudentAnamnesisForm() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const [formData, setFormData] = useState<any>({
        // Section 1: Identification
        full_name: "",
        email: "",
        phone: "",
        birth_date: "",
        sex: "",
        cpf: "",
        rg: "",
        profession: "",
        marital_status: "",

        // Section 2: Emergency & Avatar
        emergency_contact: "",
        emergency_phone: "",
        avatar_url: "",

        // Section 3: Biometric
        height_cm: "",
        weight_kg: "",

        // Section 2: Goals
        main_goal: "",
        secondary_goal: "",
        goal_deadline: "",
        motivation_barriers: "",

        // Section 3: Logistics
        training_level: "iniciante",
        available_days: [],
        initial_training_frequency: "3",
        training_environment: "Academia",
        training_preferences: "",

        // Section 4: Health history
        medical_conditions: "",
        surgeries: "",
        medications: "",
        allergies: "",
        uses_ergogenics: "false",
        uses_ergogenics_details: "",

        // Section 5: Pain/Posture
        injuries: "",
        exercises_pain: "",
        daily_pain_scale: "0",

        // Section 6: Habits
        sleep_quality: "",
        alcohol_frequency: "nunca",
        physical_activity_history: "",

        // Section 7: Nutrition
        diet_habits: "",
        non_consumed_foods: "",
        hydration_daily: "2",

        // Section 8: Routine
        daily_routine: "",
        stress_factors: "",
        stress_level: "baixo",
        wake_up_time: "07:00",
        sleep_time: "23:00",

        // LGPD
        lgpd_accepted: false
    });

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({ ...prev, full_name: user.user_metadata?.full_name || "", email: user.email }));
        }
    }, [user]);

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleDay = (day: string) => {
        const current = formData.available_days || [];
        if (current.includes(day)) {
            updateField("available_days", current.filter((d: string) => d !== day));
        } else {
            updateField("available_days", [...current, day]);
        }
    };

    const validateStep = (step: number) => {
        switch (step) {
            case 0: // Identification
                if (!formData.full_name?.trim()) return "Nome completo é obrigatório";
                if (!formData.phone?.trim()) return "Telefone de contato é obrigatório";
                if (!formData.birth_date) return "Data de nascimento é obrigatória";
                if (!formData.sex) return "Sexo biológico é obrigatório";
                if (!formData.cpf?.trim()) return "CPF é obrigatório";
                if (!formData.profession?.trim()) return "Profissão é obrigatória";
                if (!formData.marital_status) return "Estado civil é obrigatório";
                return null;
            case 1: // Emergência & Foto
                if (!formData.emergency_contact?.trim()) return "Nome do contato de emergência é obrigatório";
                if (!formData.emergency_phone?.trim()) return "Telefone de emergência é obrigatório";
                return null;
            case 2: // Biometria
                if (!formData.height_cm) return "Altura é obrigatória";
                if (!formData.weight_kg) return "Peso atual é obrigatório";
                return null;
            case 3: // Objetivos
                if (!formData.main_goal) return "Objetivo principal é obrigatório";
                if (!formData.goal_deadline) return "Prazo para o objetivo é obrigatório";
                if (!formData.motivation_barriers?.trim()) return "Por favor, descreva suas barreiras/motivação";
                return null;
            case 4: // Logística
                if (!formData.training_level) return "Nível de treinamento é obrigatório";
                if (!formData.available_days || formData.available_days.length === 0) return "Selecione pelo menos um dia disponível";
                if (!formData.initial_training_frequency) return "Frequência semanal é obrigatória";
                if (!formData.training_environment) return "Ambiente de treino é obrigatório";
                return null;
            case 5: // Saúde
                if (!formData.medical_conditions?.trim()) return "Informe suas condições médicas (ou escreva 'Nenhuma')";
                if (!formData.medications?.trim()) return "Informe seus medicamentos (ou escreva 'Nenhum')";
                if (!formData.allergies?.trim()) return "Informe suas alergias (ou escreva 'Nenhuma')";
                if (formData.uses_ergogenics === "true" && !formData.uses_ergogenics_details?.trim()) return "Descreva os detalhes do uso de ergogênicos";
                return null;
            case 6: // Dores
                if (!formData.surgeries?.trim()) return "Informe suas cirurgias (ou escreva 'Nenhuma')";
                if (!formData.injuries?.trim()) return "Informe suas lesões (ou escreva 'Nenhuma')";
                if (!formData.exercises_pain?.trim()) return "Informe se sente dor em exercícios (ou escreva 'Nenhuma')";
                return null;
            case 7: // Hábitos
                if (!formData.sleep_quality) return "Qualidade do sono é obrigatória";
                if (!formData.alcohol_frequency) return "Frequência de álcool é obrigatória";
                if (!formData.physical_activity_history?.trim()) return "Histórico de atividade física é obrigatório";
                return null;
            case 8: // Nutrição
                if (!formData.diet_habits?.trim()) return "Hábito alimentar é obrigatório";
                if (!formData.non_consumed_foods?.trim()) return "Alimentos não consumidos são obrigatórios (ou escreva 'Nenhum')";
                if (!formData.hydration_daily) return "Meta de hidratação é obrigatória";
                return null;
            case 9: // Rotina
                if (!formData.daily_routine?.trim()) return "Descrição da rotina é obrigatória";
                if (!formData.stress_level) return "Nível de estresse é obrigatório";
                if (!formData.stress_factors?.trim()) return "Fatores de estresse são obrigatórios (ou escreva 'Nenhum')";
                if (!formData.wake_up_time) return "Hora que acorda é obrigatória";
                if (!formData.sleep_time) return "Hora que dorme é obrigatória";
                return null;
            case 10: // LGPD
                if (!formData.lgpd_accepted) return "Você precisa aceitar os termos da LGPD";
                return null;
            default:
                return null;
        }
    };

    const handleNext = () => {
        const error = validateStep(currentStep);
        if (error) {
            toast.error(error);
            // Haptic feedback feel (if supported)
            if (window.navigator.vibrate) window.navigator.vibrate(50);
            return;
        }

        if (currentStep < SECTIONS.length - 1) {
            setCurrentStep(currentStep + 1);
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async () => {
        // Final validation
        const finalError = validateStep(currentStep);
        if (finalError) {
            toast.error(finalError);
            return;
        }

        if (!user) {
            toast.error("Usuário não autenticado.");
            return;
        }

        setLoading(true);
        try {
            console.log("Starting anamnesis submission...");

            // 0. Upload Avatar if exists
            let avatarUrl = formData.avatar_url;
            if (avatarFile) {
                try {
                    const fileExt = avatarFile.name.split('.').pop();
                    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(fileName, avatarFile);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName);

                    avatarUrl = publicUrl;
                } catch (err) {
                    console.error("Avatar upload failed:", err);
                    // Continue without avatar or notify user? For now continue.
                }
            }

            // 1. Update Student record
            const timestamp = new Date().toISOString();
            const { error: studentError } = await supabase
                .from('students')
                .update({
                    full_name: formData.full_name?.trim(),
                    email: formData.email?.trim(),
                    phone: formData.phone?.trim(),
                    birth_date: formData.birth_date,
                    sex: formData.sex,
                    cpf: formData.cpf?.trim(),
                    rg: formData.rg?.trim() || null,
                    profession: formData.profession?.trim() || null,
                    marital_status: formData.marital_status || null,
                    emergency_contact: formData.emergency_contact?.trim() || null,
                    emergency_phone: formData.emergency_phone?.trim() || null,
                    avatar_url: avatarUrl,
                    legal_consent_at: timestamp,
                    terms_accepted_at: timestamp,
                    updated_at: timestamp,
                    status: 'pending_approval'
                })
                .eq('id', user.id);

            if (studentError) {
                console.error("Student update error:", studentError);
                throw new Error("Falha ao atualizar dados de identificação.");
            }

            // 2. Upsert Anamnesis
            const { error: anamnesisError } = await supabase
                .from('anamnesis')
                .upsert({
                    student_id: user.id,
                    weight_kg: parseFloat(formData.weight_kg) || null,
                    height_cm: parseFloat(formData.height_cm) || null,
                    main_goal: formData.main_goal,
                    secondary_goal: formData.secondary_goal?.trim() || null,
                    goal_deadline: formData.goal_deadline,
                    motivation_barriers: formData.motivation_barriers?.trim() || null,
                    initial_training_frequency: formData.initial_training_frequency,
                    training_level: formData.training_level,
                    equipment_availability: formData.training_environment,
                    training_preferences: formData.training_preferences?.trim() || null,
                    medical_conditions: formData.medical_conditions?.trim() || null,
                    surgeries: formData.surgeries?.trim() || null,
                    medications: formData.medications?.trim() || null,
                    allergies: formData.allergies?.trim() || null,
                    injuries: formData.injuries?.trim() || null,
                    physical_limitations: formData.exercises_pain?.trim() || null,
                    sleep_pattern: formData.sleep_quality,
                    alcohol_use: formData.alcohol_frequency,
                    physical_activity_history: formData.physical_activity_history?.trim() || null,
                    diet_habits: formData.diet_habits?.trim() || null,
                    initial_nutrition_notes: `Não consome: ${formData.non_consumed_foods || 'N/A'}. Hidratação: ${formData.hydration_daily || 'N/S'}L`,
                    stress_level: formData.stress_level,
                    uses_ergogenics: formData.uses_ergogenics === 'true',
                    uses_ergogenics_details: formData.uses_ergogenics === 'true' ? formData.uses_ergogenics_details : null,
                    schedule_availability: (formData.available_days || []).join(', '),
                    daily_routine: formData.daily_routine,
                    wake_up_time: formData.wake_up_time,
                    sleep_time: formData.sleep_time
                });

            if (anamnesisError) {
                console.error("Anamnesis upsert error:", anamnesisError);
                throw new Error("Falha ao salvar questionário de saúde.");
            }

            toast.success("Anamnese concluída com sucesso!");
            navigate("/aluno/dashboard");
        } catch (error: any) {
            console.error("Submit Error:", error);
            toast.error(error.message || "Ocorreu um erro inesperado. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0: // Identificação
                return (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold border-b pb-2">Identificação</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome Completo</Label>
                                <Input value={formData.full_name} onChange={e => updateField("full_name", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>WhatsApp / Telefone</Label>
                                    <Input value={formData.phone} onChange={e => updateField("phone", e.target.value)} placeholder="(00) 00000-0000" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Data de Nascimento</Label>
                                    <Input type="date" value={formData.birth_date} onChange={e => updateField("birth_date", e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Sexo Biológico</Label>
                                    <Select value={formData.sex} onValueChange={v => updateField("sex", v)}>
                                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="masculino">Masculino</SelectItem>
                                            <SelectItem value="feminino">Feminino</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>CPF</Label>
                                    <Input value={formData.cpf} onChange={e => updateField("cpf", e.target.value)} placeholder="000.000.000-00" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>RG</Label>
                                    <Input value={formData.rg} onChange={e => updateField("rg", e.target.value)} placeholder="00.000.000-0" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Profissão</Label>
                                    <Input value={formData.profession} onChange={e => updateField("profession", e.target.value)} placeholder="Sua profissão" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Estado Civil</Label>
                                <Select value={formData.marital_status} onValueChange={v => updateField("marital_status", v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                                        <SelectItem value="casado">Casado(a)</SelectItem>
                                        <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                                        <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                );
            case 1: // Emergência & Foto
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold border-b pb-2">Foto de Perfil</h2>
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full border-4 border-muted overflow-hidden bg-muted flex items-center justify-center">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Check className="w-12 h-12 text-muted-foreground opacity-20" />
                                        )}
                                    </div>
                                    <Label
                                        htmlFor="avatar-upload"
                                        className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity"
                                    >
                                        Trocar Foto
                                    </Label>
                                    <Input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setAvatarFile(file);
                                                setAvatarPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Clique na imagem para enviar sua foto de perfil</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-lg font-bold border-b pb-2">Contato de Emergência</h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nome do Contato</Label>
                                    <Input value={formData.emergency_contact} onChange={e => updateField("emergency_contact", e.target.value)} placeholder="Ex: Nome do Pai/Mãe/Cônjuge" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Telefone de Emergência</Label>
                                    <Input value={formData.emergency_phone} onChange={e => updateField("emergency_phone", e.target.value)} placeholder="(00) 00000-0000" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2: // Biometria
                return (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold border-b pb-2">Perfil Biométrico</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Altura (cm)</Label>
                                    <Input type="number" value={formData.height_cm} onChange={e => updateField("height_cm", e.target.value)} placeholder="Ex: 175" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Peso Atual (kg)</Label>
                                    <Input type="number" value={formData.weight_kg} onChange={e => updateField("weight_kg", e.target.value)} placeholder="Ex: 75" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 3: // Objetivos
                return (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold border-b pb-2">Seus Objetivos</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Qual seu objetivo principal?</Label>
                                <Select value={formData.main_goal} onValueChange={v => updateField("main_goal", v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                                        <SelectItem value="hipertrofia">Ganho de Massa (Hipertrofia)</SelectItem>
                                        <SelectItem value="performance">Performance Esportiva</SelectItem>
                                        <SelectItem value="saude">Saúde e Bem-estar</SelectItem>
                                        <SelectItem value="condicionamento">Condicionamento Físico</SelectItem>
                                        <SelectItem value="reabilitacao">Reabilitação</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Objetivo Secundário (Opcional)</Label>
                                    <Input value={formData.secondary_goal} onChange={e => updateField("secondary_goal", e.target.value)} placeholder="Ex: Aumentar flexibilidade" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Prazo Desejado</Label>
                                    <Input type="date" value={formData.goal_deadline} onChange={e => updateField("goal_deadline", e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Quais suas maiores barreiras hoje? (Motivação)</Label>
                                <Textarea
                                    value={formData.motivation_barriers}
                                    onChange={e => updateField("motivation_barriers", e.target.value)}
                                    placeholder="Ex: Falta de tempo, cansaço..."
                                />
                            </div>
                        </div>
                    </div>
                );
            case 4: // Logística
                return (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold border-b pb-2">Logística e Treino</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nível de Treinamento</Label>
                                <Select value={formData.training_level} onValueChange={v => updateField("training_level", v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="iniciante">Iniciante (0-6 meses)</SelectItem>
                                        <SelectItem value="intermediario">Intermediário (6m-2 anos)</SelectItem>
                                        <SelectItem value="avancado">Avançado (+2 anos)</SelectItem>
                                        <SelectItem value="atleta">Atleta</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm block mb-3">Dias Disponíveis na Semana</Label>
                                <div className="flex flex-wrap gap-2">
                                    {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={cn(
                                                "w-10 h-10 rounded-lg border text-xs font-bold transition-all",
                                                formData.available_days?.includes(day)
                                                    ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]"
                                                    : "border-border bg-background/40 text-muted-foreground hover:border-primary/50"
                                            )}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Frequência Semanal Desejada</Label>
                                <Select value={formData.initial_training_frequency} onValueChange={v => updateField("initial_training_frequency", v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 vez por semana</SelectItem>
                                        <SelectItem value="2">2 vezes por semana</SelectItem>
                                        <SelectItem value="3">3 vezes por semana</SelectItem>
                                        <SelectItem value="4">4 vezes por semana</SelectItem>
                                        <SelectItem value="5">5 vezes ou mais</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Onde você pretende treinar?</Label>
                                <Select value={formData.training_environment} onValueChange={v => updateField("training_environment", v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Academia">Academia Comercial</SelectItem>
                                        <SelectItem value="Home">Em Casa</SelectItem>
                                        <SelectItem value="Outdoor">Ar Livre / Parque</SelectItem>
                                        <SelectItem value="Crossfit">Box de Crossfit / Funcional</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Preferências de Treino</Label>
                                <Textarea
                                    value={formData.training_preferences}
                                    onChange={e => updateField("training_preferences", e.target.value)}
                                    placeholder="Ex: Gosto de treinos intensos, prefiro máquinas..."
                                />
                            </div>
                        </div>
                    </div>
                );
            case 5: // Saúde
                return (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold border-b pb-2">Histórico de Saúde</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Condições Médicas Conhecidas</Label>
                                <Textarea
                                    value={formData.medical_conditions}
                                    onChange={e => updateField("medical_conditions", e.target.value)}
                                    placeholder="Ex: Hipertensão, Diabetes, nada..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Medicamentos em Uso</Label>
                                <Textarea
                                    value={formData.medications}
                                    onChange={e => updateField("medications", e.target.value)}
                                    placeholder="Ex: Nome do remédio e dose..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Possui alguma alergia?</Label>
                                <Input value={formData.allergies} onChange={e => updateField("allergies", e.target.value)} placeholder="Ex: Glúten, Lactose, Poeira..." />
                            </div>
                            <div className="space-y-4 pt-4 border-t">
                                <Label>Faz uso de recursos ergogênicos?</Label>
                                <Select value={formData.uses_ergogenics} onValueChange={v => updateField("uses_ergogenics", v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="false">Não</SelectItem>
                                        <SelectItem value="true">Sim, faço uso</SelectItem>
                                    </SelectContent>
                                </Select>
                                {formData.uses_ergogenics === "true" && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Label>Detalhes (Quais, doses, tempo...)</Label>
                                        <Textarea
                                            value={formData.uses_ergogenics_details}
                                            onChange={e => updateField("uses_ergogenics_details", e.target.value)}
                                            placeholder="Detalhe o seu uso atual ou passado..."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 6: // Dores
                return (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold border-b pb-2">Dores e Histórico Cirúrgico</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Já realizou cirurgias? Quais?</Label>
                                <Textarea
                                    value={formData.surgeries}
                                    onChange={e => updateField("surgeries", e.target.value)}
                                    placeholder="Descreva cirurgias prévias..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Histórico de Lesões</Label>
                                <Textarea
                                    value={formData.injuries}
                                    onChange={e => updateField("injuries", e.target.value)}
                                    placeholder="Ex: Lesão no joelho, hérnia..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Sente dor ao realizar algum exercício?</Label>
                                <Textarea
                                    value={formData.exercises_pain}
                                    onChange={e => updateField("exercises_pain", e.target.value)}
                                    placeholder="Ex: Dor no ombro ao fazer supino..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Escala de Dor Diária (0 a 10)</Label>
                                <Select value={formData.daily_pain_scale} onValueChange={v => updateField("daily_pain_scale", v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {[...Array(11)].map((_, i) => (
                                            <SelectItem key={i} value={i.toString()}>{i} - {i === 0 ? "Sem dor" : i === 10 ? "Dor insuportável" : ""}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                );
            case 7: // Hábitos
                return (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold border-b pb-2">Hábitos Diários</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Como é a sua qualidade de sono?</Label>
                                <Select value={formData.sleep_quality} onValueChange={v => updateField("sleep_quality", v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="excelente">Excelente (Acordo descansado)</SelectItem>
                                        <SelectItem value="boa">Boa</SelectItem>
                                        <SelectItem value="regular">Regular</SelectItem>
                                        <SelectItem value="ruim">Ruim (Insônia ou cansaço)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Consumo de Álcool</Label>
                                <Select value={formData.alcohol_frequency} onValueChange={v => updateField("alcohol_frequency", v)}>
                                    <SelectTrigger><SelectValue placeholder="Frequência..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="nunca">Nunca</SelectItem>
                                        <SelectItem value="social">Socialmente (Fim de semana)</SelectItem>
                                        <SelectItem value="frequente">Frequente (3+ vezes por semana)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Histórico de Atividade Física</Label>
                                <Textarea
                                    value={formData.physical_activity_history}
                                    onChange={e => updateField("physical_activity_history", e.target.value)}
                                    placeholder="Ex: Treinei por 2 anos, parei e estou voltando agora..."
                                />
                            </div>
                        </div>
                    </div>
                );
            case 8: // Nutrição
                return (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold border-b pb-2">Nutrição e Alimentação</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Descreva seu hábito alimentar atual</Label>
                                <Textarea
                                    value={formData.diet_habits}
                                    onChange={e => updateField("diet_habits", e.target.value)}
                                    placeholder="Ex: Faço 3 refeições, como muito doce..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Alimentos que você NÃO consome</Label>
                                <Textarea
                                    value={formData.non_consumed_foods}
                                    onChange={e => updateField("non_consumed_foods", e.target.value)}
                                    placeholder="Ex: Coentro, Fígado, Peixe..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Meta de Hidratação Diária (Litros)</Label>
                                <Input type="number" step="0.5" value={formData.hydration_daily} onChange={e => updateField("hydration_daily", e.target.value)} placeholder="Ex: 2.5" />
                            </div>
                        </div>
                    </div>
                );
            case 9: // Rotina
                return (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold border-b pb-2">Sua Rotina</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Descrição da Rotina (Trabalho/Estudo)</Label>
                                <Textarea
                                    value={formData.daily_routine}
                                    onChange={e => updateField("daily_routine", e.target.value)}
                                    placeholder="Ex: Trabalho sentado 8h por dia, pego transporte..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nível de Estresse Diário</Label>
                                <Select value={formData.stress_level} onValueChange={v => updateField("stress_level", v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="baixo">Baixo</SelectItem>
                                        <SelectItem value="moderado">Moderado</SelectItem>
                                        <SelectItem value="alto">Alto</SelectItem>
                                        <SelectItem value="extremo">Extremo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Fatores de Estresse (Detalhes)</Label>
                                <Textarea
                                    value={formData.stress_factors}
                                    onChange={e => updateField("stress_factors", e.target.value)}
                                    placeholder="Ex: Pressão no trabalho, falta de tempo..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Hora que Acorda</Label>
                                    <Input type="time" value={formData.wake_up_time} onChange={e => updateField("wake_up_time", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Hora que Dorme</Label>
                                    <Input type="time" value={formData.sleep_time} onChange={e => updateField("sleep_time", e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 10: // Final (LGPD)
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold border-b pb-2">Finalização</h2>
                        <div className="p-4 bg-muted/50 rounded-xl space-y-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <ClipboardCheck className="w-6 h-6 text-primary" />
                            </div>
                            <p className="text-sm text-center font-medium">
                                Tudo pronto! Seus dados serão enviados com segurança para o seu treinador.
                            </p>
                            <div className="flex items-start space-x-3 bg-background p-3 rounded-lg border border-border">
                                <Checkbox
                                    id="lgpd"
                                    checked={formData.lgpd_accepted}
                                    onCheckedChange={v => updateField("lgpd_accepted", !!v)}
                                    className="mt-1"
                                />
                                <Label htmlFor="lgpd" className="text-xs leading-relaxed cursor-pointer">
                                    Eu aceito os termos de uso e autorizo o tratamento dos meus dados para fins de prescrição de treinamento e dieta, conforme a LGPD.
                                </Label>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-background pb-20 w-full overflow-x-hidden relative">
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
                        >
                            <div className="bg-card border border-border p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 max-w-xs w-full">
                                <div className="relative">
                                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-black italic uppercase tracking-tighter text-lg">Processando</h3>
                                    <p className="text-xs text-muted-foreground font-medium">Salvando sua anamnese com segurança...</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-md z-50 w-full">
                    <div className="w-full max-w-lg mx-auto flex items-center justify-between px-0">
                        <h1 className="text-base font-black italic tracking-tighter text-primary uppercase">ANAMNESE</h1>
                        <div className="text-xs font-bold bg-muted px-2 py-1 rounded">
                            PASSO {currentStep + 1} DE {SECTIONS.length}
                        </div>
                    </div>
                    <div className="w-full max-w-lg mx-auto mt-3 h-1 bg-muted rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStep + 1) / SECTIONS.length) * 100}%` }}
                        />
                    </div>
                </header>

                <main className="px-4 py-6 w-full max-w-lg mx-auto">
                    <div className="mb-6">
                        <h3 className="text-primary font-bold uppercase tracking-widest text-[10px] mb-1">{SECTIONS[currentStep]}</h3>
                        <p className="text-muted-foreground text-sm">Responda com o máximo de precisão possível.</p>
                    </div>

                    <section className="bg-card border border-border/50 rounded-2xl p-4 shadow-xl overflow-x-hidden">
                        {renderStep()}
                    </section>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className="w-full sm:w-auto rounded-xl h-12 order-2 sm:order-1"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
                        </Button>

                        <Button
                            onClick={handleNext}
                            disabled={loading}
                            className="w-full sm:w-auto rounded-xl h-12 px-8 font-bold order-1 sm:order-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (
                                currentStep === SECTIONS.length - 1 ? (
                                    <> <Check className="w-5 h-5 mr-2" /> Concluir </>
                                ) : (
                                    <> Próximo <ArrowRight className="w-4 h-4 ml-2" /> </>
                                )
                            )}
                        </Button>
                    </div>
                </main>
            </div>
        </ErrorBoundary>
    );
}

const SECTION_START_INDEX = 0;
