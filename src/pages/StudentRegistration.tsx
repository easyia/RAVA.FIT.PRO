import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { X, ArrowLeft, ArrowRight, Check, Upload, Loader2, Info, Activity, Heart, Target, ShieldCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStudent, getStudentDetails, updateStudent, uploadAvatar } from "@/services/studentService";
import { useEffect } from "react";
import { StudentGoal } from "@/types/student";

interface FormData {
  // --- Students Table ---
  full_name: string;
  email: string;
  phone: string;
  birth_date: string;
  sex: string;
  cpf: string;
  rg: string;
  profession: string;
  marital_status: string;
  emergency_contact: string;
  emergency_phone: string;
  avatar_url: string;

  // --- Goals (Step 2) ---
  primary_goal: StudentGoal | "";
  target_weight: string;
  training_frequency: string;
  available_days: string[];

  // --- Anamnesis Table ---
  // Health History
  medical_conditions: string;
  surgeries: string;
  medications: string;
  family_history: string;
  injuries: string;
  allergies: string;
  // Habits
  diet_habits: string;
  alcohol_use: string;
  sleep_pattern: string;
  physical_activity_history: string;
  stress_level: string;
  // Body Composition
  weight_kg: string;
  height_cm: string;
  // Postural / Functional
  postural_assessment: string;
  mobility_assessment: string;
  strength_assessment: string;
  // Goals & Motivation
  main_goal_extra: string;
  secondary_goal: string;
  goal_deadline: string;
  motivation_barriers: string;
  // Preferences
  training_preferences: string;
  equipment_availability: string;
  schedule_availability: string;
  // Risk
  par_q_result: string;
  contraindications: string;
  // New fields
  training_level: string;
  uses_ergogenics: string;
  uses_ergogenics_details: string;
  classification: string;
  service_type: string;
}


const goals = [
  { value: "hipertrofia", label: "Hipertrofia" },
  { value: "emagrecimento", label: "Emagrecimento" },
  { value: "condicionamento", label: "Condicionamento" },
  { value: "reabilitacao", label: "Reabilitação" },
  { value: "performance", label: "Performance" },
];

const frequencies = [
  { value: "2", label: "2x por semana" },
  { value: "3", label: "3x por semana" },
  { value: "4", label: "4x por semana" },
  { value: "5", label: "5x por semana" },
  { value: "6", label: "6x por semana" },
];

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const StudentRegistration = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    birth_date: "",
    sex: "",
    cpf: "",
    rg: "",
    profession: "",
    marital_status: "",
    emergency_contact: "",
    emergency_phone: "",
    avatar_url: "",
    primary_goal: "",
    target_weight: "",
    training_frequency: "",
    available_days: [],
    medical_conditions: "",
    surgeries: "",
    medications: "",
    family_history: "",
    injuries: "",
    allergies: "",
    diet_habits: "",
    alcohol_use: "",
    sleep_pattern: "",
    physical_activity_history: "",
    stress_level: "",
    weight_kg: "",
    height_cm: "",
    postural_assessment: "",
    mobility_assessment: "",
    strength_assessment: "",
    main_goal_extra: "",
    secondary_goal: "",
    goal_deadline: "",
    motivation_barriers: "",
    training_preferences: "",
    equipment_availability: "",
    schedule_availability: "",
    par_q_result: "",
    contraindications: "",
    training_level: "",
    uses_ergogenics: "false",
    uses_ergogenics_details: "",
    classification: "bronze",
    service_type: "online",
  });
  const [isUploading, setIsUploading] = useState(false);

  const { data: studentToEdit } = useQuery({
    queryKey: ['student', id],
    queryFn: () => getStudentDetails(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        full_name: studentToEdit.full_name || "",
        email: studentToEdit.email || "",
        phone: studentToEdit.phone || "",
        birth_date: studentToEdit.birth_date || "",
        sex: studentToEdit.sex || "",
        cpf: studentToEdit.cpf || "",
        rg: studentToEdit.rg || "",
        profession: studentToEdit.profession || "",
        marital_status: studentToEdit.marital_status || "",
        emergency_contact: studentToEdit.emergency_contact || "",
        emergency_phone: studentToEdit.emergency_phone || "",
        primary_goal: studentToEdit.anamnesis?.[0]?.main_goal || "",
        target_weight: studentToEdit.anamnesis?.[0]?.weight_kg?.toString() || "",
        training_frequency: studentToEdit.anamnesis?.[0]?.initial_training_frequency?.toString() || "",
        available_days: studentToEdit.anamnesis?.[0]?.schedule_availability
          ? studentToEdit.anamnesis[0].schedule_availability.split(',').map((d: string) => d.trim()).filter(Boolean)
          : [],
        medical_conditions: studentToEdit.anamnesis?.[0]?.medical_conditions || "",
        surgeries: studentToEdit.anamnesis?.[0]?.surgeries || "",
        medications: studentToEdit.anamnesis?.[0]?.medications || "",
        family_history: studentToEdit.anamnesis?.[0]?.family_history || "",
        injuries: studentToEdit.anamnesis?.[0]?.injuries || "",
        allergies: studentToEdit.anamnesis?.[0]?.allergies || "",
        diet_habits: studentToEdit.anamnesis?.[0]?.diet_habits || "",
        alcohol_use: studentToEdit.anamnesis?.[0]?.alcohol_use || "",
        sleep_pattern: studentToEdit.anamnesis?.[0]?.sleep_pattern || "",
        physical_activity_history: studentToEdit.anamnesis?.[0]?.physical_activity_history || "",
        stress_level: studentToEdit.anamnesis?.[0]?.stress_level || "",
        weight_kg: studentToEdit.anamnesis?.[0]?.weight_kg?.toString() || "",
        height_cm: studentToEdit.anamnesis?.[0]?.height_cm?.toString() || "",
        postural_assessment: studentToEdit.anamnesis?.[0]?.postural_assessment || "",
        mobility_assessment: studentToEdit.anamnesis?.[0]?.mobility_assessment || "",
        strength_assessment: studentToEdit.anamnesis?.[0]?.strength_assessment || "",
        main_goal_extra: studentToEdit.anamnesis?.[0]?.main_goal || "",
        secondary_goal: studentToEdit.anamnesis?.[0]?.secondary_goal || "",
        goal_deadline: studentToEdit.anamnesis?.[0]?.goal_deadline || "",
        motivation_barriers: studentToEdit.anamnesis?.[0]?.motivation_barriers || "",
        training_preferences: studentToEdit.anamnesis?.[0]?.training_preferences || "",
        equipment_availability: studentToEdit.anamnesis?.[0]?.equipment_availability || "",
        schedule_availability: studentToEdit.anamnesis?.[0]?.schedule_availability || "",
        par_q_result: studentToEdit.anamnesis?.[0]?.par_q_result || "",
        contraindications: studentToEdit.anamnesis?.[0]?.contraindications || "",
        training_level: studentToEdit.anamnesis?.[0]?.training_level || "",
        uses_ergogenics: studentToEdit.anamnesis?.[0]?.uses_ergogenics?.toString() || "false",
        uses_ergogenics_details: studentToEdit.anamnesis?.[0]?.uses_ergogenics_details || "",
        avatar_url: studentToEdit.avatar_url || "",
        classification: studentToEdit.classification || "bronze",
        service_type: studentToEdit.service_type || "online",
      });
    }
  }, [studentToEdit]);

  const mutation = useMutation({
    mutationFn: (data: any) => id ? updateStudent(id, data) : createStudent(data),
    onSuccess: (data) => {
      toast.success(id ? "Cadastro atualizado!" : "Cadastro realizado com sucesso!", {
        description: id ? "As alterações foram salvas." : "O aluno foi cadastrado. Agora, realize a primeira avaliação física.",
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student", id] });

      if (id) {
        navigate("/alunos");
      } else {
        // Redireciona para a avaliação física inicial
        navigate(`/analise-comparativa?studentId=${data.id}&new=true`);
      }
    },
    onError: (error) => {
      console.error("Erro completo ao salvar cadastro:", error);
      toast.error("Erro ao salvar cadastro. Verifique o console.");
    }
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadAvatar(file);
      updateFormData("avatar_url", url);
      toast.success("Foto carregada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar foto.");
    } finally {
      setIsUploading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: string) => {
    const current = formData.available_days;
    if (current.includes(day)) {
      updateFormData("available_days", current.filter((d) => d !== day));
    } else {
      updateFormData("available_days", [...current, day]);
    }
  };


  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={cn(
        "transition-all duration-300 ease-out min-h-screen pb-20",
        sidebarCollapsed ? "ml-16" : "ml-60"
      )}>
        <main className="p-8 max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-h1 text-foreground mb-2">{id ? "Editar Aluno" : "Novo Aluno"}</h1>
            <p className="text-muted-foreground">{id ? "Atualize os dados e a anamnese do seu aluno." : "Cadastre o perfil completo e a ficha de anamnese do seu cliente."}</p>
          </div>

          <div className="card-elevated p-8">
            <Accordion type="multiple" defaultValue={["identification"]} className="w-full space-y-4">
              {/* --- IDENTIFICAÇÃO --- */}
              <AccordionItem value="identification" className="border rounded-xl bg-sidebar/30 px-4">
                <AccordionTrigger className="hover:no-underline py-6">
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-primary" />
                    <span className="text-lg font-semibold">Dados Pessoais & Identificação</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Photo Upload Container (3x4 aspect ratio) */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative group w-32 h-44 rounded-xl overflow-hidden border-2 border-dashed border-border flex items-center justify-center bg-background/50 hover:border-primary/50 transition-colors">
                        {formData.avatar_url ? (
                          <>
                            <img src={formData.avatar_url} className="w-full h-full object-cover" />
                            <button onClick={() => updateFormData("avatar_url", "")} className="absolute top-2 right-2 bg-destructive/90 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            {isUploading ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
                            <span className="text-[10px] text-muted-foreground text-center px-2">Clique para adicionar foto 3x4</span>
                          </div>
                        )}
                        <Label htmlFor="avatar-upload" className="absolute inset-0 cursor-pointer" />
                        <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </div>
                      <div className="text-[10px] text-muted-foreground text-center">
                        <p>JPG ou PNG. Máx 2MB.</p>
                      </div>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Label htmlFor="full_name">Nome Completo *</Label>
                        <Input id="full_name" value={formData.full_name} onChange={(e) => updateFormData("full_name", e.target.value)} placeholder="Ex: João Silva" className="bg-background/50" />
                      </div>
                      <div>
                        <Label htmlFor="email">E-mail *</Label>
                        <Input id="email" type="email" value={formData.email} onChange={(e) => updateFormData("email", e.target.value)} placeholder="joao@email.com" className="bg-background/50" />
                      </div>
                      <div>
                        <Label htmlFor="phone">Telefone *</Label>
                        <Input id="phone" value={formData.phone} onChange={(e) => updateFormData("phone", e.target.value)} placeholder="(00) 00000-0000" className="bg-background/50" />
                      </div>
                      <div>
                        <Label htmlFor="birth_date">Data de Nascimento</Label>
                        <Input id="birth_date" type="date" value={formData.birth_date} onChange={(e) => updateFormData("birth_date", e.target.value)} className="bg-background/50 uppercase" />
                      </div>
                      <div>
                        <Label htmlFor="sex">Sexo</Label>
                        <Select onValueChange={(v) => updateFormData("sex", v)} value={formData.sex}>
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="cpf">CPF</Label>
                        <Input id="cpf" value={formData.cpf} onChange={(e) => updateFormData("cpf", e.target.value)} placeholder="000.000.000-00" className="bg-background/50" />
                      </div>
                      <div>
                        <Label htmlFor="rg">RG</Label>
                        <Input id="rg" value={formData.rg} onChange={(e) => updateFormData("rg", e.target.value)} placeholder="00.000.000-0" className="bg-background/50" />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="profession">Profissão</Label>
                        <Input id="profession" value={formData.profession} onChange={(e) => updateFormData("profession", e.target.value)} placeholder="Ex: Engenheiro (passo muito tempo sentado)" className="bg-background/50" />
                      </div>
                      <div>
                        <Label htmlFor="marital_status">Estado Civil</Label>
                        <Select onValueChange={(v) => updateFormData("marital_status", v)} value={formData.marital_status}>
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                            <SelectItem value="casado">Casado(a)</SelectItem>
                            <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                            <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="classification">Classificação (Plano)</Label>
                        <Select onValueChange={(v) => updateFormData("classification", v)} value={formData.classification}>
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bronze">Bronze</SelectItem>
                            <SelectItem value="silver">Prata</SelectItem>
                            <SelectItem value="gold">Ouro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="service_type">Atendimento</Label>
                        <Select onValueChange={(v) => updateFormData("service_type", v)} value={formData.service_type}>
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="online">On-line</SelectItem>
                            <SelectItem value="presencial">Presencial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* --- EMERGÊNCIA --- */}
              <AccordionItem value="emergency" className="border rounded-xl bg-sidebar/30 px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-status-error" />
                    <span className="text-lg font-semibold">Contato de Emergência</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergency_contact">Nome do Contato</Label>
                      <Input id="emergency_contact" value={formData.emergency_contact} onChange={(e) => updateFormData("emergency_contact", e.target.value)} placeholder="Nome do familiar ou amigo" className="bg-background/50" />
                    </div>
                    <div>
                      <Label htmlFor="emergency_phone">Telefone de Emergência</Label>
                      <Input id="emergency_phone" value={formData.emergency_phone} onChange={(e) => updateFormData("emergency_phone", e.target.value)} placeholder="(00) 00000-0000" className="bg-background/50" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* --- OBJETIVOS & FOCO --- */}
              <AccordionItem value="goals_training" className="border rounded-xl bg-sidebar/30 px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-status-warning" />
                    <span className="text-lg font-semibold">Objetivos & Frequência</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-8 space-y-6">
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm mb-3 block">Objetivo Principal *</Label>
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {goals.map((goal) => (
                          <button key={goal.value} onClick={() => updateFormData("primary_goal", goal.value)} className={cn("px-2 py-3 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all", formData.primary_goal === goal.value ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border bg-background/40 text-muted-foreground hover:border-primary/50")}>
                            {goal.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="target_weight">Meta de Peso (kg)</Label>
                        <Input id="target_weight" type="number" value={formData.target_weight} onChange={(e) => updateFormData("target_weight", e.target.value)} placeholder="Ex: 75.5" className="bg-background/50" />
                      </div>
                      <div>
                        <Label htmlFor="goal_deadline">Prazo Desejado</Label>
                        <Input id="goal_deadline" type="date" value={formData.goal_deadline} onChange={(e) => updateFormData("goal_deadline", e.target.value)} className="bg-background/50" />
                      </div>
                      <div>
                        <Label htmlFor="training_frequency">Frequência Semanal</Label>
                        <Select onValueChange={(v) => updateFormData("training_frequency", v)} value={formData.training_frequency}>
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {frequencies.map((f) => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label className="text-sm block">Dias Disponíveis</Label>
                        <div className="flex flex-wrap gap-2">
                          {weekDays.map((day) => (
                            <button key={day} onClick={() => toggleDay(day)} className={cn("w-10 h-10 rounded-lg border text-xs font-medium transition-all", formData.available_days.includes(day) ? "border-primary bg-primary/10 text-primary" : "border-border bg-background/40 text-muted-foreground hover:border-primary/50")}>
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="secondary_goal">Objetivo Secundário</Label>
                        <Input id="secondary_goal" value={formData.secondary_goal} onChange={(e) => updateFormData("secondary_goal", e.target.value)} placeholder="Ex: Melhorar cardio" className="bg-background/50" />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* --- ANAMNESE SECÇÃO EXISTENTE --- */}
              <AccordionItem value="health" className="border rounded-xl bg-sidebar/30 px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-status-error" />
                    <span className="text-lg font-semibold">Ficha de Saúde</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Condições Médicas</Label>
                      <Textarea value={formData.medical_conditions} onChange={(e) => updateFormData("medical_conditions", e.target.value)} placeholder="Hipertensão, Diabetes..." className="bg-background/50 min-h-[80px]" />
                    </div>
                    <div className="space-y-2">
                      <Label>Cirurgias Pregressas</Label>
                      <Textarea value={formData.surgeries} onChange={(e) => updateFormData("surgeries", e.target.value)} placeholder="Cirurgias relevantes..." className="bg-background/50 min-h-[80px]" />
                    </div>
                    <div className="space-y-2">
                      <Label>Medicamentos em Uso</Label>
                      <Textarea value={formData.medications} onChange={(e) => updateFormData("medications", e.target.value)} placeholder="Nome e dosagem..." className="bg-background/50 min-h-[80px]" />
                    </div>
                    <div className="space-y-2">
                      <Label>Lesões Atuais/Passadas</Label>
                      <Textarea value={formData.injuries} onChange={(e) => updateFormData("injuries", e.target.value)} placeholder="Hérnias, entorses..." className="bg-background/50 min-h-[80px]" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="habits" className="border rounded-xl bg-sidebar/30 px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-primary" />
                    <span className="text-lg font-semibold">Hábitos & Estilo de Vida</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hábito Alimentar</Label>
                      <Textarea value={formData.diet_habits} onChange={(e) => updateFormData("diet_habits", e.target.value)} placeholder="Rotina alimentar..." className="bg-background/50 min-h-[80px]" />
                    </div>
                    <div className="space-y-2">
                      <Label>Nível de Estresse</Label>
                      <Select onValueChange={(v) => updateFormData("stress_level", v)} value={formData.stress_level}>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixo">Baixo</SelectItem>
                          <SelectItem value="moderado">Moderado</SelectItem>
                          <SelectItem value="alto">Alto</SelectItem>
                          <SelectItem value="extremo">Extremo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nível de Treinamento</Label>
                      <Select onValueChange={(v) => updateFormData("training_level", v)} value={formData.training_level}>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="iniciante">Iniciante (0-6 meses)</SelectItem>
                          <SelectItem value="intermediario">Intermediário (6m-2 anos)</SelectItem>
                          <SelectItem value="avancado">Avançado (+2 anos)</SelectItem>
                          <SelectItem value="atleta">Atleta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Uso de Ergogênicos?</Label>
                      <Select onValueChange={(v) => updateFormData("uses_ergogenics", v)} value={formData.uses_ergogenics}>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">Não</SelectItem>
                          <SelectItem value="true">Sim</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.uses_ergogenics === "true" && (
                      <div className="space-y-2 md:col-span-2">
                        <Label>Quais?</Label>
                        <Textarea
                          value={formData.uses_ergogenics_details}
                          onChange={(e) => updateFormData("uses_ergogenics_details", e.target.value)}
                          placeholder="Descreva o uso..."
                          className="bg-background/50 min-h-[80px]"
                        />
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="physical" className="border rounded-xl bg-sidebar/30 px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-status-success" />
                    <span className="text-lg font-semibold">Avaliação & Risco</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Peso Atual (kg)</Label>
                        <Input type="number" value={formData.weight_kg} onChange={(e) => updateFormData("weight_kg", e.target.value)} className="bg-background/50" />
                      </div>
                      <div className="space-y-2">
                        <Label>Altura (cm)</Label>
                        <Input type="number" value={formData.height_cm} onChange={(e) => updateFormData("height_cm", e.target.value)} className="bg-background/50" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>PAR-Q (Resultados)</Label>
                      <Input value={formData.par_q_result} onChange={(e) => updateFormData("par_q_result", e.target.value)} placeholder="Resumo do prontuário" className="bg-background/50" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>Contraindicações</Label>
                      <Textarea value={formData.contraindications} onChange={(e) => updateFormData("contraindications", e.target.value)} placeholder="Restrições médicas..." className="bg-background/50 min-h-[80px]" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
              <Button variant="ghost" onClick={handleBack} className="h-11 px-6 hover:bg-sidebar">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>

              <Button onClick={() => mutation.mutate(formData as any)} disabled={mutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg h-12 px-10 min-w-[200px] font-bold">
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    {id ? "Salvar Alterações" : "Concluir Cadastro"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentRegistration;

// Force refresh
