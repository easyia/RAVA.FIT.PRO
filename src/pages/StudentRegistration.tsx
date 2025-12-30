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
}

const steps = [
  { id: 1, name: "Dados Pessoais" },
  { id: 2, name: "Objetivos" },
  { id: 3, name: "Anamnese" },
];

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
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    birth_date: "",
    sex: "",
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
        avatar_url: studentToEdit.avatar_url || "",
      });
    }
  }, [studentToEdit]);

  const mutation = useMutation({
    mutationFn: (data: any) => id ? updateStudent(id, data) : createStudent(data),
    onSuccess: () => {
      toast.success(id ? "Cadastro atualizado!" : "Cadastro realizado com sucesso!", {
        description: id ? "As alterações foram salvas." : "O aluno e sua ficha de anamnese foram processados.",
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      navigate("/alunos");
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

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      if (formData.primary_goal === "") {
        toast.error("Por favor, selecione um objetivo principal.");
        return;
      }
      mutation.mutate(formData as any);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    } else {
      navigate(-1);
    }
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

          <div className="bg-sidebar rounded-xl border border-border p-4 mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                      currentStep > step.id ? "bg-accent text-accent-foreground" : currentStep === step.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    )}>
                      {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                    </div>
                    <span className={cn("text-sm font-medium hidden sm:inline", currentStep >= step.id ? "text-foreground" : "text-muted-foreground")}>
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn("flex-1 h-0.5 mx-4", currentStep > step.id ? "bg-accent" : "bg-border")} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card-elevated p-8">
            {currentStep === 1 && (
              <div className="space-y-8 animate-fade-in">
                <section>
                  <div className="flex items-center gap-2 mb-6 border-b pb-2">
                    <Info className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Identificação</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl bg-sidebar/30 gap-4">
                      {formData.avatar_url ? (
                        <div className="relative group">
                          <img src={formData.avatar_url} className="w-24 h-24 rounded-full border-2 border-primary object-cover" />
                          <button onClick={() => updateFormData("avatar_url", "")} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
                          {isUploading ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : <Upload className="w-8 h-8 text-muted-foreground" />}
                        </div>
                      )}

                      <div className="text-center">
                        <Label htmlFor="avatar-upload" className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
                          <Upload className="w-4 h-4" /> {id ? "Trocar Foto" : "Adicionar Foto"}
                        </Label>
                        <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                        <p className="text-xs text-muted-foreground mt-2">JPG, PNG ou WebP. Máx 2MB.</p>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="full_name">Nome Completo *</Label>
                      <Input id="full_name" value={formData.full_name} onChange={(e) => updateFormData("full_name", e.target.value)} placeholder="Ex: João Silva" className="bg-sidebar" />
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail *</Label>
                      <Input id="email" type="email" value={formData.email} onChange={(e) => updateFormData("email", e.target.value)} placeholder="joao@email.com" className="bg-sidebar" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input id="phone" value={formData.phone} onChange={(e) => updateFormData("phone", e.target.value)} placeholder="(00) 00000-0000" className="bg-sidebar" />
                    </div>
                    <div>
                      <Label htmlFor="birth_date">Data de Nascimento</Label>
                      <Input id="birth_date" type="date" value={formData.birth_date} onChange={(e) => updateFormData("birth_date", e.target.value)} className="bg-sidebar uppercase" />
                    </div>
                    <div>
                      <Label htmlFor="sex">Sexo</Label>
                      <Select onValueChange={(v) => updateFormData("sex", v)} defaultValue={formData.sex}>
                        <SelectTrigger className="bg-sidebar">
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
                      <Label htmlFor="profession">Profissão</Label>
                      <Input id="profession" value={formData.profession} onChange={(e) => updateFormData("profession", e.target.value)} placeholder="Ex: Engenheiro" className="bg-sidebar" />
                    </div>
                    <div>
                      <Label htmlFor="marital_status">Estado Civil</Label>
                      <Select onValueChange={(v) => updateFormData("marital_status", v)} defaultValue={formData.marital_status}>
                        <SelectTrigger className="bg-sidebar">
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
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-6 border-b pb-2">
                    <Heart className="w-5 h-5 text-status-error" />
                    <h3 className="text-lg font-semibold">Emergência</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="emergency_contact">Contato de Emergência</Label>
                      <Input id="emergency_contact" value={formData.emergency_contact} onChange={(e) => updateFormData("emergency_contact", e.target.value)} placeholder="Nome do familiar" className="bg-sidebar" />
                    </div>
                    <div>
                      <Label htmlFor="emergency_phone">Telefone de Emergência</Label>
                      <Input id="emergency_phone" value={formData.emergency_phone} onChange={(e) => updateFormData("emergency_phone", e.target.value)} placeholder="(00) 00000-0000" className="bg-sidebar" />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8 animate-fade-in">
                <section>
                  <div className="flex items-center gap-2 mb-6 border-b pb-2">
                    <Target className="w-5 h-5 text-status-warning" />
                    <h3 className="text-lg font-semibold">Foco do Treinamento</h3>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm mb-3 block">Objetivo Principal *</Label>
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {goals.map((goal) => (
                          <button key={goal.value} onClick={() => updateFormData("primary_goal", goal.value)} className={cn("px-4 py-3 rounded-lg border text-xs font-medium transition-all", formData.primary_goal === goal.value ? "border-primary bg-sidebar-accent text-primary shadow-sm" : "border-border bg-sidebar text-muted-foreground hover:border-primary/50")}>
                            {goal.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="target_weight">Meta de Peso (kg)</Label>
                        <Input id="target_weight" type="number" value={formData.target_weight} onChange={(e) => updateFormData("target_weight", e.target.value)} placeholder="Ex: 75.5" className="bg-sidebar" />
                      </div>
                      <div>
                        <Label htmlFor="goal_deadline">Prazo Desejado</Label>
                        <Input id="goal_deadline" type="date" value={formData.goal_deadline} onChange={(e) => updateFormData("goal_deadline", e.target.value)} className="bg-sidebar" />
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-6 border-b pb-2">
                    <Activity className="w-5 h-5 text-status-success" />
                    <h3 className="text-lg font-semibold">Disponibilidade</h3>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm mb-3 block">Frequência de Treino</Label>
                      <div className="flex flex-wrap gap-2">
                        {frequencies.map((f) => (
                          <button key={f.value} onClick={() => updateFormData("training_frequency", f.value)} className={cn("px-4 py-2 rounded-lg border text-sm font-medium transition-all", formData.training_frequency === f.value ? "border-primary bg-sidebar-accent text-primary" : "border-border bg-sidebar text-muted-foreground hover:border-primary/50")}>
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm mb-3 block">Dias da Semana</Label>
                      <div className="flex flex-wrap gap-2">
                        {weekDays.map((day) => (
                          <button key={day} onClick={() => toggleDay(day)} className={cn("w-12 h-10 rounded-lg border text-xs font-medium transition-all", formData.available_days.includes(day) ? "border-primary bg-sidebar-accent text-primary" : "border-border bg-sidebar text-muted-foreground hover:border-primary/50")}>
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  <AccordionItem value="health" className="border rounded-xl bg-sidebar/50 px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-status-error" />
                        <span>Histórico de Saúde</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Condições Médicas</Label>
                          <Textarea value={formData.medical_conditions} onChange={(e) => updateFormData("medical_conditions", e.target.value)} placeholder="Hipertensão, Diabetes..." className="bg-sidebar min-h-[80px]" />
                        </div>
                        <div className="space-y-2">
                          <Label>Cirurgias Pregressas</Label>
                          <Textarea value={formData.surgeries} onChange={(e) => updateFormData("surgeries", e.target.value)} placeholder="Qualquer cirurgia relevante..." className="bg-sidebar min-h-[80px]" />
                        </div>
                        <div className="space-y-2">
                          <Label>Medicamentos em Uso</Label>
                          <Textarea value={formData.medications} onChange={(e) => updateFormData("medications", e.target.value)} placeholder="Nome e dosagem se possível..." className="bg-sidebar min-h-[80px]" />
                        </div>
                        <div className="space-y-2">
                          <Label>Lesões Atuais/Passadas</Label>
                          <Textarea value={formData.injuries} onChange={(e) => updateFormData("injuries", e.target.value)} placeholder="Hérnias, ROM, entorses..." className="bg-sidebar min-h-[80px]" />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="habits" className="border rounded-xl bg-sidebar/50 px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-primary" />
                        <span>Hábitos de Vida</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Hábito Alimentar</Label>
                          <Textarea value={formData.diet_habits} onChange={(e) => updateFormData("diet_habits", e.target.value)} placeholder="Frequência, restrições..." className="bg-sidebar min-h-[80px]" />
                        </div>
                        <div className="space-y-2">
                          <Label>Padrão de Sono</Label>
                          <Input value={formData.sleep_pattern} onChange={(e) => updateFormData("sleep_pattern", e.target.value)} placeholder="Horas por noite, qualidade..." className="bg-sidebar" />
                        </div>
                        <div className="space-y-2">
                          <Label>Nível de Estresse</Label>
                          <Select onValueChange={(v) => updateFormData("stress_level", v)}>
                            <SelectTrigger className="bg-sidebar">
                              <SelectValue placeholder="Selecione o nível" />
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
                          <Label>Tabagismo / Etilismo</Label>
                          <Input value={formData.alcohol_use} onChange={(e) => updateFormData("alcohol_use", e.target.value)} placeholder="Frequência..." className="bg-sidebar" />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="physical" className="border rounded-xl bg-sidebar/50 px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-status-success" />
                        <span>Avaliação Física & Risco</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Peso (kg)</Label>
                          <Input type="number" value={formData.weight_kg} onChange={(e) => updateFormData("weight_kg", e.target.value)} className="bg-sidebar" />
                        </div>
                        <div>
                          <Label>Altura (cm)</Label>
                          <Input type="number" value={formData.height_cm} onChange={(e) => updateFormData("height_cm", e.target.value)} className="bg-sidebar" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label>Limitações Físicas / Contraindicações</Label>
                          <Textarea value={formData.contraindications} onChange={(e) => updateFormData("contraindications", e.target.value)} placeholder="Restrições médicas específicas..." className="bg-sidebar min-h-[80px]" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label>PAR-Q (Resultados Importantes)</Label>
                          <Input value={formData.par_q_result} onChange={(e) => updateFormData("par_q_result", e.target.value)} placeholder="Resumo do questionário de prontidão física" className="bg-sidebar" />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
              <Button variant="secondary" onClick={handleBack} className="h-11 px-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>

              <Button onClick={handleNext} disabled={mutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-button h-11 px-8 min-w-[160px]">
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finalizando...
                  </>
                ) : currentStep === 3 ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Concluir Ficha
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-2" />
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

