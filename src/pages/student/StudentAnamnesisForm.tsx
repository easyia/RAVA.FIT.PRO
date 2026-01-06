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
import { Loader2, ArrowRight, ArrowLeft, Check, ClipboardCheck } from "lucide-react";

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
        weight_habitual: "",

        // Section 2: Goals
        main_goal: "",
        secondary_goal: "",
        motivation_barriers: "",

        // Section 3: Logistics
        initial_training_frequency: "3",
        training_environment: "Academia",
        training_preferences: "",

        // Section 4: Health
        medical_conditions: "",
        medications: "",
        allergies: "",

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

    const handleNext = () => {
        if (currentStep < SECTIONS.length - 1) {
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0);
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
        if (!formData.lgpd_accepted) {
            toast.error("Você precisa aceitar os termos da LGPD para continuar.");
            return;
        }

        setLoading(true);
        try {
            // 0. Upload Avatar if exists
            let avatarUrl = formData.avatar_url;
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatarFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                avatarUrl = publicUrl;
            }

            // 1. Atualizar dados na tabela 'students' (campos de identificação + consentimento LGPD)
            const timestamp = new Date().toISOString();
            const { error: studentError } = await supabase
                .from('students')
                .update({
                    full_name: formData.full_name,
                    birth_date: formData.birth_date,
                    sex: formData.sex,
                    cpf: formData.cpf,
                    rg: formData.rg,
                    profession: formData.profession,
                    marital_status: formData.marital_status,
                    emergency_contact: formData.emergency_contact,
                    emergency_phone: formData.emergency_phone,
                    avatar_url: avatarUrl,
                    legal_consent_at: timestamp,
                    terms_accepted_at: timestamp,
                    updated_at: timestamp,
                    status: 'pending_approval' // Garante o status correto
                })
                .eq('id', user?.id);

            if (studentError) throw studentError;

            // 2. Inserir ou atualizar na tabela 'anamnesis'
            const { error: anamnesisError } = await supabase
                .from('anamnesis')
                .upsert({
                    student_id: user?.id,
                    weight_kg: parseFloat(formData.weight_kg) || null,
                    height_cm: parseFloat(formData.height_cm) || null,
                    main_goal: formData.main_goal,
                    secondary_goal: formData.secondary_goal,
                    motivation_barriers: formData.motivation_barriers,
                    initial_training_frequency: formData.initial_training_frequency,
                    equipment_availability: formData.training_environment,
                    training_preferences: formData.training_preferences,
                    medical_conditions: formData.medical_conditions,
                    medications: formData.medications,
                    allergies: formData.allergies,
                    injuries: formData.injuries,
                    physical_limitations: formData.exercises_pain,
                    sleep_pattern: formData.sleep_quality,
                    alcohol_use: formData.alcohol_frequency,
                    physical_activity_history: formData.physical_activity_history,
                    diet_habits: formData.diet_habits,
                    initial_nutrition_notes: `Não consome: ${formData.non_consumed_foods}. Hidratação: ${formData.hydration_daily}L`,
                    stress_level: formData.stress_factors,
                    schedule_availability: `Acorda: ${formData.wake_up_time}, Dorme: ${formData.sleep_time}. Rotina: ${formData.daily_routine}`
                });

            if (anamnesisError) throw anamnesisError;

            toast.success("Anamnese concluída com sucesso!");
            navigate("/aluno/dashboard");
        } catch (error: any) {
            toast.error(error.message || "Erro ao salvar anamnese");
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
                                    <Label>Data de Nascimento</Label>
                                    <Input type="date" value={formData.birth_date} onChange={e => updateField("birth_date", e.target.value)} />
                                </div>
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
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>CPF</Label>
                                    <Input value={formData.cpf} onChange={e => updateField("cpf", e.target.value)} placeholder="000.000.000-00" />
                                </div>
                                <div className="space-y-2">
                                    <Label>RG</Label>
                                    <Input value={formData.rg} onChange={e => updateField("rg", e.target.value)} placeholder="00.000.000-0" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Profissão</Label>
                                    <Input value={formData.profession} onChange={e => updateField("profession", e.target.value)} placeholder="Sua profissão" />
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
                                    <Input type="number" value={formData.weight_kg} onChange={e => updateField("weight_kg", e.target.value)} placeholder="Ex: 80" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Peso Habitual (kg)</Label>
                                <Input type="number" value={formData.weight_habitual} onChange={e => updateField("weight_habitual", e.target.value)} placeholder="Qual seu peso médio?" />
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
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Objetivo Secundário (Opcional)</Label>
                                <Input value={formData.secondary_goal} onChange={e => updateField("secondary_goal", e.target.value)} placeholder="Ex: Aumentar flexibilidade" />
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
                        </div>
                    </div>
                );
            case 6: // Dores
                return (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold border-b pb-2">Dores e Lesões</h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Histórico de Lesões ou Cirurgias</Label>
                                <Textarea
                                    value={formData.injuries}
                                    onChange={e => updateField("injuries", e.target.value)}
                                    placeholder="Ex: Cirurgia no joelho, hérnia..."
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
                                <Label>Meta de Hidratação Diária (Liters)</Label>
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
                                <Label>Principais Fatores de Estresse</Label>
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
        <div className="min-h-screen bg-background pb-20 w-full overflow-x-hidden">
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
    );
}

const SECTION_START_INDEX = 0;
