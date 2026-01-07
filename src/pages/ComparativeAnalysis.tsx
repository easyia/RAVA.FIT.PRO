import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { generateEvolutionReport } from "@/services/pdfService";
import { getStudentFeedbacks } from "@/services/feedbackService";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Users,
    Plus,
    Calendar,
    Scale,
    Activity,
    TrendingUp,
    ChevronRight,
    Camera,
    Video,
    ArrowLeftRight,
    Loader2,
    Save,
    FileText,
    Upload,
    Trash2,
    Sparkles
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
    getStudents,
    getPhysicalAssessments,
    createPhysicalAssessment,
    updatePhysicalAssessment,
    deletePhysicalAssessment,
    uploadFile
} from "@/services/studentService";
import { scheduleNextAssessment } from "@/services/activityService";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Symmetrograph } from "@/components/assessment/Symmetrograph";
import { BiomechanicalVideoPlayer } from "@/components/assessment/BiomechanicalVideoPlayer";

const ComparativeAnalysis = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [comparisonView, setComparisonView] = useState<"front" | "left" | "right" | "back">("front");
    const [comparisonIndexA, setComparisonIndexA] = useState<number>(0); // Default to current
    const [comparisonIndexB, setComparisonIndexB] = useState<number>(1); // Default to baseline
    const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [nextAssessmentDate, setNextAssessmentDate] = useState("");
    const [isSymmetrographOpen, setIsSymmetrographOpen] = useState(false);
    const [selectedPhotoForAnalysis, setSelectedPhotoForAnalysis] = useState<{ url: string, assessmentId: string, view: string } | null>(null);
    const queryClient = useQueryClient();

    // Handle deep linking for new assessment
    useEffect(() => {
        const studentId = searchParams.get("studentId");
        const openNew = searchParams.get("new");

        if (studentId) {
            setSelectedStudentId(studentId);
            if (openNew === "true") {
                setIsModalOpen(true);
                // Clear the params to avoid reopening on refresh
                navigate("/analise-comparativa", { replace: true });
            }
        }
    }, [searchParams, navigate]);

    const initialAssessmentState = {
        assessment_date: format(new Date(), "yyyy-MM-dd"),
        weight: "",
        height: "",
        bmi: "",
        body_fat: "",
        muscle_mass: "",
        postural_notes: "",
        functional_notes: "",
        general_notes: "",
        front_photo_url: "",
        left_side_photo_url: "",
        right_side_photo_url: "",
        back_photo_url: "",
        video_url: "",
        videos: [] as { url: string, label: string }[],
        // Perimetry
        neck: "",
        shoulder: "",
        chest: "",
        waist: "",
        abdomen: "",
        hip: "",
        arm_right_relaxed: "",
        arm_left_relaxed: "",
        arm_right_contracted: "",
        arm_left_contracted: "",
        thigh_right_proximal: "",
        thigh_left_proximal: "",
        thigh_right_medial: "",
        thigh_left_medial: "",
        thigh_right_distal: "",
        thigh_left_distal: "",
        calf_right: "",
        calf_left: "",
        // Skinfolds
        chest_fold: "",
        midaxillary_fold: "",
        triceps_fold: "",
        subscapular_fold: "",
        abdominal_fold: "",
        suprailiac_fold: "",
        thigh_fold: "",
        // Functional
        mobility_notes: "",
        rm_notes: ""
    };

    const [newAssessment, setNewAssessment] = useState(initialAssessmentState);

    const { data: students, isLoading: loadingStudents } = useQuery({
        queryKey: ["students"],
        queryFn: getStudents,
    });

    const { data: assessments, isLoading: loadingAssessments } = useQuery({
        queryKey: ["assessments", selectedStudentId],
        queryFn: () => getPhysicalAssessments(selectedStudentId!),
        enabled: !!selectedStudentId,
    });

    // Auto-calculate BMI
    const calculateBMI = (w: string, h: string) => {
        const weightNum = parseFloat(w);
        const heightNum = parseFloat(h) / 100; // cm to m
        if (weightNum > 0 && heightNum > 0) {
            return (weightNum / (heightNum * heightNum)).toFixed(1);
        }
        return "";
    };

    const handleInputChange = (field: string, value: string) => {
        setNewAssessment(prev => {
            const updated = { ...prev, [field]: value };
            if (field === "weight" || field === "height") {
                updated.bmi = calculateBMI(updated.weight, updated.height);
            }
            return updated;
        });
    };

    const handleNumericInputChange = (field: string, value: string) => {
        // Permitir apenas números e ponto
        const cleanValue = value.replace(/[^0-9.]/g, '');
        handleInputChange(field, cleanValue);
    };

    const handleFileUpload = async (file: File, field: string) => {
        // Validação de tamanho (ex: 5MB para fotos, 50MB para vídeos se permitido, mas vamos limitar a 5MB por segurança inicial)
        const maxSize = field === 'video_url' ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB vídeo, 5MB foto
        if (file.size > maxSize) {
            toast.error(`O arquivo é muito grande. Limite: ${maxSize / (1024 * 1024)}MB`);
            return;
        }

        try {
            toast.info(`Fazendo upload de ${field === 'video_url' ? 'vídeo' : 'foto'}...`);
            const url = await uploadFile(file, 'avatars');
            setNewAssessment(prev => ({ ...prev, [field]: url }));
            toast.success("Upload concluído!");
        } catch (error) {
            console.error("Erro no upload:", error);
            toast.error("Erro no upload. O arquivo pode ser muito grande para o servidor.");
        }
    };

    const handleSaveAssessment = async () => {
        if (!selectedStudentId) return;
        setIsSaving(true);
        try {
            const safeParse = (val: any) => {
                if (val === "" || val === null || val === undefined) return null;
                const parsed = parseFloat(val);
                return isNaN(parsed) ? null : parsed;
            };

            const assessmentData = {
                ...newAssessment,
                student_id: selectedStudentId,
                weight: safeParse(newAssessment.weight) || 0,
                height: safeParse(newAssessment.height) || 0,
                bmi: safeParse(newAssessment.bmi) || 0,
                body_fat: safeParse(newAssessment.body_fat) || 0,
                muscle_mass: safeParse(newAssessment.muscle_mass) || 0,
                // Parse numeric fields for perimetry and skinfolds
                neck: safeParse(newAssessment.neck),
                shoulder: safeParse(newAssessment.shoulder),
                chest: safeParse(newAssessment.chest),
                waist: safeParse(newAssessment.waist),
                abdomen: safeParse(newAssessment.abdomen),
                hip: safeParse(newAssessment.hip),
                arm_right_relaxed: safeParse(newAssessment.arm_right_relaxed),
                arm_left_relaxed: safeParse(newAssessment.arm_left_relaxed),
                arm_right_contracted: safeParse(newAssessment.arm_right_contracted),
                arm_left_contracted: safeParse(newAssessment.arm_left_contracted),
                thigh_right_proximal: safeParse(newAssessment.thigh_right_proximal),
                thigh_left_proximal: safeParse(newAssessment.thigh_left_proximal),
                thigh_right_medial: safeParse(newAssessment.thigh_right_medial),
                thigh_left_medial: safeParse(newAssessment.thigh_left_medial),
                thigh_right_distal: safeParse(newAssessment.thigh_right_distal),
                thigh_left_distal: safeParse(newAssessment.thigh_left_distal),
                calf_right: safeParse(newAssessment.calf_right),
                calf_left: safeParse(newAssessment.calf_left),
                chest_fold: safeParse(newAssessment.chest_fold),
                midaxillary_fold: safeParse(newAssessment.midaxillary_fold),
                triceps_fold: safeParse(newAssessment.triceps_fold),
                subscapular_fold: safeParse(newAssessment.subscapular_fold),
                abdominal_fold: safeParse(newAssessment.abdominal_fold),
                suprailiac_fold: safeParse(newAssessment.suprailiac_fold),
                thigh_fold: safeParse(newAssessment.thigh_fold),
            };

            if (editingAssessmentId) {
                await updatePhysicalAssessment(editingAssessmentId, assessmentData);
                toast.success("Avaliação atualizada com sucesso!");
                setIsModalOpen(false);
            } else {
                await createPhysicalAssessment(assessmentData);
                toast.success("Avaliação salva com sucesso!");
                setIsModalOpen(false);
                setIsScheduleModalOpen(true);
            }

            setEditingAssessmentId(null);
            queryClient.invalidateQueries({ queryKey: ["assessments", selectedStudentId] });
            queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });

            // Reset form
            setNewAssessment(initialAssessmentState);
        } catch (error) {
            toast.error(editingAssessmentId ? "Erro ao atualizar avaliação." : "Erro ao salvar avaliação.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleScheduleNext = async () => {
        if (!selectedStudentId || !nextAssessmentDate) {
            toast.error("Por favor, selecione uma data.");
            return;
        }

        try {
            await scheduleNextAssessment(selectedStudentId, nextAssessmentDate);
            toast.success("Próxima avaliação agendada!");
            setIsScheduleModalOpen(false);
            setNextAssessmentDate("");
            queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
        } catch (error) {
            toast.error("Erro ao agendar.");
        }
    };

    const handleEditAssessment = (assessment: any) => {
        setEditingAssessmentId(assessment.id);
        setNewAssessment({
            assessment_date: assessment.assessment_date,
            weight: assessment.weight.toString(),
            height: assessment.height.toString(),
            bmi: assessment.bmi.toString(),
            body_fat: assessment.body_fat.toString(),
            muscle_mass: assessment.muscle_mass.toString(),
            postural_notes: assessment.postural_notes || "",
            functional_notes: assessment.functional_notes || "",
            general_notes: assessment.general_notes || "",
            front_photo_url: assessment.front_photo_url || "",
            left_side_photo_url: assessment.left_side_photo_url || "",
            right_side_photo_url: assessment.right_side_photo_url || "",
            back_photo_url: assessment.back_photo_url || "",
            video_url: assessment.video_url || "",
            videos: assessment.videos || [],
            neck: assessment.neck?.toString() || "",
            shoulder: assessment.shoulder?.toString() || "",
            chest: assessment.chest?.toString() || "",
            waist: assessment.waist?.toString() || "",
            abdomen: assessment.abdomen?.toString() || "",
            hip: assessment.hip?.toString() || "",
            arm_right_relaxed: assessment.arm_right_relaxed?.toString() || "",
            arm_left_relaxed: assessment.arm_left_relaxed?.toString() || "",
            arm_right_contracted: assessment.arm_right_contracted?.toString() || "",
            arm_left_contracted: assessment.arm_left_contracted?.toString() || "",
            thigh_right_proximal: assessment.thigh_right_proximal?.toString() || "",
            thigh_left_proximal: assessment.thigh_left_proximal?.toString() || "",
            thigh_right_medial: assessment.thigh_right_medial?.toString() || "",
            thigh_left_medial: assessment.thigh_left_medial?.toString() || "",
            thigh_right_distal: assessment.thigh_right_distal?.toString() || "",
            thigh_left_distal: assessment.thigh_left_distal?.toString() || "",
            calf_right: assessment.calf_right?.toString() || "",
            calf_left: assessment.calf_left?.toString() || "",
            chest_fold: assessment.chest_fold?.toString() || "",
            midaxillary_fold: assessment.midaxillary_fold?.toString() || "",
            triceps_fold: assessment.triceps_fold?.toString() || "",
            subscapular_fold: assessment.subscapular_fold?.toString() || "",
            abdominal_fold: assessment.abdominal_fold?.toString() || "",
            suprailiac_fold: assessment.suprailiac_fold?.toString() || "",
            thigh_fold: assessment.thigh_fold?.toString() || "",
            mobility_notes: assessment.mobility_notes || "",
            rm_notes: assessment.rm_notes || ""
        });
        setIsModalOpen(true);
    };

    const handleDeleteAssessment = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.")) {
            return;
        }

        try {
            await deletePhysicalAssessment(id);
            toast.success("Avaliação excluída com sucesso!");
            queryClient.invalidateQueries({ queryKey: ["assessments", selectedStudentId] });
        } catch (error) {
            console.error("Erro ao excluir avaliação:", error);
            toast.error("Erro ao excluir avaliação.");
        }
    };

    const handleExportPDF = async (assessment: any) => {
        if (!selectedStudent || isGeneratingPdf) return;

        setIsGeneratingPdf(true);
        const toastId = toast.loading("Gerando relatório profissional...");

        let reportContent: HTMLDivElement | null = null;
        try {
            reportContent = document.createElement("div");
            reportContent.style.position = "absolute";
            reportContent.style.left = "-9999px";
            reportContent.style.top = "0";
            reportContent.style.width = "800px";
            reportContent.style.padding = "40px";
            reportContent.style.backgroundColor = "#FFFFFF";
            reportContent.style.color = "#111827";
            reportContent.style.fontFamily = "'Inter', sans-serif";

            const dateStr = format(new Date(assessment.assessment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

            reportContent.innerHTML = `
                <div style="border: 2px solid #F59E0B; padding: 40px; border-radius: 12px; min-height: 1050px; display: flex; flex-direction: column;">
                    <!-- Cabecalho -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #F3F4F6; padding-bottom: 25px; margin-bottom: 35px;">
                        <div>
                            <h1 style="color: #F59E0B; font-size: 32px; font-weight: 1000; margin: 0; font-style: italic; letter-spacing: -1.5px; font-family: 'Inter', sans-serif;">FIT <span style="color: #111827;">PRO</span></h1>
                            <p style="color: #4B5563; font-size: 11px; margin: 5px 0 0 0; letter-spacing: 3px; text-transform: uppercase; font-weight: 700;">Performance & Evolution Tracking</p>
                        </div>
                        <div style="text-align: right;">
                            <h2 style="margin: 0; font-weight: 800; font-size: 18px; color: #111827;">RELATÓRIO DE AVALIAÇÃO</h2>
                            <p style="margin: 5px 0 0 0; font-size: 13px; color: #6B7280; font-weight: 500;">Gerado em ${format(new Date(), "dd/MM/yyyy")}</p>
                        </div>
                    </div>

                    <!-- Dados do Aluno -->
                    <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 35px; display: flex; gap: 40px;">
                        <div style="flex: 1;">
                            <p style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; font-weight: 700; margin-bottom: 5px;">Aluno</p>
                            <p style="font-size: 16px; font-weight: 700; color: #111827; margin: 0;">${selectedStudent.name}</p>
                        </div>
                        <div style="flex: 1;">
                            <p style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; font-weight: 700; margin-bottom: 5px;">Objetivo</p>
                            <p style="font-size: 14px; font-weight: 600; color: #4B5563; margin: 0; text-transform: capitalize;">${selectedStudent.goal || 'Não informado'}</p>
                        </div>
                        <div style="flex: 1;">
                            <p style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; font-weight: 700; margin-bottom: 5px;">Data da Avaliação</p>
                            <p style="font-size: 14px; font-weight: 600; color: #111827; margin: 0;">${dateStr}</p>
                        </div>
                    </div>

                    <!-- Grid de Composicao -->
                    <div style="margin-bottom: 40px;">
                        <h3 style="font-size: 14px; color: #F59E0B; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px; margin-bottom: 20px;">Composição Corporal</h3>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                            <div style="border: 1px solid #E5E7EB; border-radius: 10px; padding: 15px; text-align: center;">
                                <span style="font-size: 10px; color: #6B7280; font-weight: 700; text-transform: uppercase;">Peso</span>
                                <p style="font-size: 22px; font-weight: 800; color: #111827; margin: 5px 0 0 0;">${assessment.weight}<small style="font-size: 12px; font-weight: 400; color: #9CA3AF; margin-left:2px;">kg</small></p>
                            </div>
                            <div style="border: 1px solid #E5E7EB; border-radius: 10px; padding: 15px; text-align: center;">
                                <span style="font-size: 10px; color: #6B7280; font-weight: 700; text-transform: uppercase;">Gordura</span>
                                <p style="font-size: 22px; font-weight: 800; color: #EF4444; margin: 5px 0 0 0;">${assessment.body_fat}<small style="font-size: 12px; font-weight: 400; color: #9CA3AF; margin-left:2px;">%</small></p>
                            </div>
                            <div style="border: 1px solid #E5E7EB; border-radius: 10px; padding: 15px; text-align: center;">
                                <span style="font-size: 10px; color: #6B7280; font-weight: 700; text-transform: uppercase;">Massa Magra</span>
                                <p style="font-size: 22px; font-weight: 800; color: #10B981; margin: 5px 0 0 0;">${assessment.muscle_mass}<small style="font-size: 12px; font-weight: 400; color: #9CA3AF; margin-left:2px;">kg</small></p>
                            </div>
                            <div style="border: 1px solid #E5E7EB; border-radius: 10px; padding: 15px; text-align: center;">
                                <span style="font-size: 10px; color: #6B7280; font-weight: 700; text-transform: uppercase;">IMC</span>
                                <p style="font-size: 22px; font-weight: 800; color: #111827; margin: 5px 0 0 0;">${assessment.bmi}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Perimetria e Dobras -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
                        <div>
                            <h3 style="font-size: 13px; color: #F59E0B; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px; margin-bottom: 15px;">Perimetria (cm)</h3>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: #F9FAFB; border-radius: 4px; font-size: 12px;"><span>Tórax</span> <b>${assessment.chest || '-'}</b></div>
                                <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: #F9FAFB; border-radius: 4px; font-size: 12px;"><span>Cintura</span> <b>${assessment.waist || '-'}</b></div>
                                <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: #F9FAFB; border-radius: 4px; font-size: 12px;"><span>Quadril</span> <b>${assessment.hip || '-'}</b></div>
                                <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: #F9FAFB; border-radius: 4px; font-size: 12px;"><span>Abdômen</span> <b>${assessment.abdomen || '-'}</b></div>
                                <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: #F9FAFB; border-radius: 4px; font-size: 12px;"><span>Braço D. (Cont)</span> <b>${assessment.arm_right_contracted || '-'}</b></div>
                                <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: #F9FAFB; border-radius: 4px; font-size: 12px;"><span>Braço E. (Cont)</span> <b>${assessment.arm_left_contracted || '-'}</b></div>
                                <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: #F9FAFB; border-radius: 4px; font-size: 12px;"><span>Coxa D. (Med)</span> <b>${assessment.thigh_right_medial || '-'}</b></div>
                                <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: #F9FAFB; border-radius: 4px; font-size: 12px;"><span>Coxa E. (Med)</span> <b>${assessment.thigh_left_medial || '-'}</b></div>
                            </div>
                        </div>
                        <div>
                            <h3 style="font-size: 13px; color: #F59E0B; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px; margin-bottom: 15px;">Dobras Cutâneas (mm)</h3>
                            <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                                <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: #F9FAFB; border-radius: 4px; font-size: 12px;"><span>Abdominal</span> <b>${assessment.abdominal_fold || '-'}</b></div>
                                <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: #F9FAFB; border-radius: 4px; font-size: 12px;"><span>Supra-ilíaca</span> <b>${assessment.suprailiac_fold || '-'}</b></div>
                                <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: #F9FAFB; border-radius: 4px; font-size: 12px;"><span>Tricipital</span> <b>${assessment.triceps_fold || '-'}</b></div>
                                <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: #F9FAFB; border-radius: 4px; font-size: 12px;"><span>Subescapular</span> <b>${assessment.subscapular_fold || '-'}</b></div>
                            </div>
                        </div>
                    </div>

                    <!-- Notas Técnicas -->
                    <div style="flex: 1;">
                        <h3 style="font-size: 13px; color: #F59E0B; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px; margin-bottom: 15px;">Parecer Técnico</h3>
                        <div style="background: #FDFCE9; border: 1px solid #FEF3C7; padding: 25px; border-radius: 10px; font-size: 13px; color: #78350F; line-height: 1.7; font-style: italic;">
                            ${assessment.postural_notes || assessment.functional_notes || assessment.general_notes || 'Nenhuma observação registrada para este período de treinamento. O aluno segue em evolução conforme o planejado.'}
                        </div>
                    </div>

                    <!-- Rodape -->
                    <div style="margin-top: auto; padding-top: 30px; border-top: 2px solid #F3F4F6; display: flex; justify-content: space-between; align-items: center;">
                        <p style="font-size: 11px; color: #9CA3AF; margin: 0; font-weight: 500;">Este relatório é propriedade do aluno e seu treinador.</p>
                        <p style="font-size: 11px; color: #111827; margin: 0; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">FIT PRO - THE NEW STANDARD</p>
                    </div>
                </div>
            `;

            document.body.appendChild(reportContent);

            const canvas = await html2canvas(reportContent, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#FFFFFF",
                logging: false
            });

            const imgData = canvas.toDataURL("image/png", 0.8);
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Relatorio_FIT_PRO_${selectedStudent.name.replace(/\s+/g, '_')}_${assessment.assessment_date}.pdf`);

            toast.success("Relatório gerado com sucesso!", { id: toastId });
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            toast.error("Erro ao gerar o PDF profissional.", { id: toastId });
        } finally {
            if (reportContent && reportContent.parentNode) {
                document.body.removeChild(reportContent);
            }
            setIsGeneratingPdf(false);
        }
    };

    const handleNewAssessment = () => {
        setEditingAssessmentId(null);
        setNewAssessment(initialAssessmentState);
        setIsModalOpen(true);
    };

    const handleVideoUpload = async (file: File) => {
        try {
            toast.info("Fazendo upload do vídeo...");
            const url = await uploadFile(file, 'avatars');
            setNewAssessment(prev => ({
                ...prev,
                videos: [...prev.videos, { url, label: `Vídeo ${prev.videos.length + 1}` }]
            }));
            toast.success("Vídeo adicionado!");
        } catch (error) {
            toast.error("Erro no upload do vídeo.");
        }
    };

    const updateVideoLabel = (index: number, label: string) => {
        setNewAssessment(prev => {
            const newVids = [...prev.videos];
            newVids[index].label = label;
            return { ...prev, videos: newVids };
        });
    };

    const removeVideo = (index: number) => {
        setNewAssessment(prev => ({
            ...prev,
            videos: prev.videos.filter((_, i) => i !== index)
        }));
    };

    const handleGenerateReport = async () => {
        if (!selectedStudent || !assessments) return;
        setIsGeneratingPdf(true);
        try {
            const feedbacks = await getStudentFeedbacks(selectedStudentId!);
            await generateEvolutionReport({
                student: selectedStudent,
                coach: { name: user?.email || 'Treinador' },
                assessments: assessments || [],
                feedbacks: feedbacks || []
            });
            toast.success("Relatório gerado com sucesso!");
        } catch (e) {
            console.error(e);
            toast.error("Erro ao gerar PDF.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const filteredStudents = students?.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedStudent = students?.find(s => s.id === selectedStudentId);

    // Prepare chart data
    const chartData = assessments?.map(a => ({
        date: format(new Date(a.assessment_date), "dd/MM", { locale: ptBR }),
        peso: a.weight,
        gordura: a.body_fat,
        musculo: a.muscle_mass,
    })).reverse();

    return (
        <div className="min-h-screen bg-background">
            <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

            <div className={cn("transition-all duration-300 min-h-screen pb-10", sidebarCollapsed ? "ml-16" : "ml-60")}>
                <main className="p-8">
                    <DashboardHeader title="Análise Comparativa" showSearch={false} />

                    {!selectedStudentId ? (
                        <div className="space-y-6">
                            <Card className="border-border bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Selecione um Aluno</CardTitle>
                                    <CardDescription>Busque o aluno para ver seu histórico ou realizar nova avaliação.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative mb-6">
                                        <Input
                                            placeholder="Buscar aluno por nome..."
                                            className="bg-sidebar pl-10 h-12"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredStudents?.map((student) => (
                                            <div
                                                key={student.id}
                                                onClick={() => setSelectedStudentId(student.id)}
                                                className="group p-4 rounded-xl border border-border bg-sidebar/30 hover:bg-sidebar/80 hover:border-primary transition-all cursor-pointer flex items-center gap-4"
                                            >
                                                <img src={student.avatar} className="w-12 h-12 rounded-full object-cover border border-border" />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold truncate">{student.name}</h4>
                                                    <p className="text-xs text-muted-foreground uppercase">{student.goal}</p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-tertiary group-hover:text-primary transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fade-in">
                            {/* Student Header */}
                            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedStudentId(null)} className="rounded-full bg-sidebar/50">
                                        <Plus className="w-5 h-5 rotate-45" />
                                    </Button>
                                    <img src={selectedStudent?.avatar} className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20 shadow-lg" />
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedStudent?.name}</h2>
                                        <p className="text-muted-foreground">{selectedStudent?.goal} • {selectedStudent?.phone}</p>
                                    </div>
                                </div>
                                <Button onClick={handleNewAssessment} className="h-12 px-6 gap-2 bg-primary hover:bg-primary/90 shadow-button">
                                    <Plus className="w-4 h-4" /> Nova Avaliação
                                </Button>
                                <Button
                                    onClick={handleGenerateReport}
                                    variant="outline"
                                    className="h-12 px-6 gap-2 border-primary text-primary hover:bg-primary/10"
                                    disabled={isGeneratingPdf}
                                >
                                    {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                    Relatório PDF
                                </Button>
                            </div>

                            <Tabs defaultValue="evolution" className="w-full">
                                <TabsList className="bg-muted/50 p-1 mb-8">
                                    <TabsTrigger value="evolution" className="gap-2"><TrendingUp className="w-4 h-4" /> Evolução</TabsTrigger>
                                    <TabsTrigger value="photos" className="gap-2"><Camera className="w-4 h-4" /> Fotos & Vídeos</TabsTrigger>
                                    <TabsTrigger value="history" className="gap-2"><Calendar className="w-4 h-4" /> Histórico</TabsTrigger>
                                </TabsList>

                                <TabsContent value="evolution" className="space-y-8">
                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Card className="bg-card/50 border-border">
                                            <CardContent className="pt-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Scale className="w-4 h-4 text-primary" />
                                                    <span className="text-sm font-medium text-muted-foreground">Peso Atual</span>
                                                </div>
                                                <h3 className="text-2xl font-bold">{assessments?.[0]?.weight || "--"} kg</h3>
                                                {assessments?.length > 1 && (
                                                    <p className={cn(
                                                        "text-xs mt-1 font-medium",
                                                        assessments[0].weight < assessments[1].weight ? "text-status-success" : "text-status-error"
                                                    )}>
                                                        {assessments[0].weight - assessments[1].weight > 0 ? "+" : ""}{(assessments[0].weight - assessments[1].weight).toFixed(1)} kg vs anterior
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-card/50 border-border">
                                            <CardContent className="pt-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Activity className="w-4 h-4 text-status-success" />
                                                    <span className="text-sm font-medium text-muted-foreground">% Gordura</span>
                                                </div>
                                                <h3 className="text-2xl font-bold">{assessments?.[0]?.body_fat || "--"}%</h3>
                                                {assessments?.length > 1 && (
                                                    <p className={cn(
                                                        "text-xs mt-1 font-medium",
                                                        assessments[0].body_fat < assessments[1].body_fat ? "text-status-success" : "text-status-error"
                                                    )}>
                                                        {assessments[0].body_fat - assessments[1].body_fat > 0 ? "+" : ""}{(assessments[0].body_fat - assessments[1].body_fat).toFixed(1)}% vs anterior
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-card/50 border-border">
                                            <CardContent className="pt-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <TrendingUp className="w-4 h-4 text-status-info" />
                                                    <span className="text-sm font-medium text-muted-foreground">Massa Muscular</span>
                                                </div>
                                                <h3 className="text-2xl font-bold">{assessments?.[0]?.muscle_mass || "--"} kg</h3>
                                                {assessments?.length > 1 && (
                                                    <p className={cn(
                                                        "text-xs mt-1 font-medium",
                                                        assessments[0].muscle_mass > assessments[1].muscle_mass ? "text-status-success" : "text-status-error"
                                                    )}>
                                                        {assessments[0].muscle_mass - assessments[1].muscle_mass > 0 ? "+" : ""}{(assessments[0].muscle_mass - assessments[1].muscle_mass).toFixed(1)} kg vs anterior
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-card/50 border-border">
                                            <CardContent className="pt-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Scale className="w-4 h-4 text-status-warning" />
                                                    <span className="text-sm font-medium text-muted-foreground">IMC</span>
                                                </div>
                                                <h3 className="text-2xl font-bold">{assessments?.[0]?.bmi || "--"}</h3>
                                                {assessments?.length > 1 && (
                                                    <p className={cn(
                                                        "text-xs mt-1 font-medium",
                                                        assessments[0].bmi < assessments[1].bmi ? "text-status-success" : "text-status-error"
                                                    )}>
                                                        {parseFloat(assessments[0].bmi) - parseFloat(assessments[1].bmi) > 0 ? "+" : ""}{(parseFloat(assessments[0].bmi) - parseFloat(assessments[1].bmi)).toFixed(1)} vs anterior
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Chart */}
                                    <Card className="border-border bg-card shadow-xl rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-muted/30 pb-2">
                                            <CardTitle className="text-lg">Gráfico de Desempenho</CardTitle>
                                        </CardHeader>
                                        <CardContent className="h-[400px] w-full pt-8">
                                            {assessments && assessments.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={chartData}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                                        <XAxis dataKey="date" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                                        <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                                        />
                                                        <Legend />
                                                        <Line type="monotone" dataKey="peso" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B' }} name="Peso (kg)" />
                                                        <Line type="monotone" dataKey="gordura" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444' }} name="% Gordura" />
                                                        <Line type="monotone" dataKey="musculo" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} name="Massa Muscular (kg)" />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                                    <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
                                                    <p>Nenhum dado histórico para exibir o gráfico.</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="photos" className="space-y-8 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <Card className="border-border bg-card overflow-hidden">
                                            <CardHeader className="flex flex-col space-y-4">
                                                <div className="flex flex-row items-center justify-between w-full">
                                                    <div>
                                                        <CardTitle>Comparações Visuais (Simetógrafo)</CardTitle>
                                                        <CardDescription>Analise a evolução postural entre períodos</CardDescription>
                                                    </div>
                                                    <div className="flex bg-muted p-1 rounded-lg gap-1">
                                                        {(["front", "right", "left", "back"] as const).map(view => (
                                                            <Button
                                                                key={view}
                                                                variant={comparisonView === view ? "secondary" : "ghost"}
                                                                size="sm"
                                                                className="h-8 text-[10px] px-2"
                                                                onClick={() => setComparisonView(view)}
                                                            >
                                                                {view === 'front' ? 'FRENTE' : view === 'back' ? 'COSTAS' : view === 'left' ? 'LADO E' : 'LADO D'}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 bg-sidebar/50 p-2 rounded-xl border border-border">
                                                    <Select
                                                        value={comparisonIndexB.toString()}
                                                        onValueChange={(v) => setComparisonIndexB(parseInt(v))}
                                                    >
                                                        <SelectTrigger className="h-9 bg-background border-none text-xs">
                                                            <SelectValue placeholder="Anterior" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {assessments?.map((a, i) => (
                                                                <SelectItem key={a.id} value={i.toString()}>
                                                                    {format(new Date(a.assessment_date), "dd/MM/yyyy")}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <ArrowLeftRight className="w-4 h-4 text-primary shrink-0" />
                                                    <Select
                                                        value={comparisonIndexA.toString()}
                                                        onValueChange={(v) => setComparisonIndexA(parseInt(v))}
                                                    >
                                                        <SelectTrigger className="h-9 bg-background border-none text-xs">
                                                            <SelectValue placeholder="Posterior" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {assessments?.map((a, i) => (
                                                                <SelectItem key={a.id} value={i.toString()}>
                                                                    {format(new Date(a.assessment_date), "dd/MM/yyyy")}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-center text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
                                                            PONTO A <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                                                                {assessments?.[comparisonIndexB] ? format(new Date(assessments[comparisonIndexB].assessment_date), "MM/yy") : "-"}
                                                            </span>
                                                        </p>
                                                        <div className="aspect-[3/4] rounded-xl bg-sidebar border border-border flex items-center justify-center overflow-hidden relative group">
                                                            <div className="absolute inset-0 border-[0.5px] border-primary/20 pointer-events-none opacity-50 z-10 grid grid-cols-4 grid-rows-6">
                                                                {Array.from({ length: 24 }).map((_, i) => (
                                                                    <div key={i} className="border-[0.2px] border-primary/10"></div>
                                                                ))}
                                                            </div>
                                                            {assessments?.[comparisonIndexB]?.[`${comparisonView === 'front' ? 'front' : comparisonView === 'back' ? 'back' : comparisonView === 'left' ? 'left_side' : 'right_side'}_photo_url`] ? (
                                                                <img src={assessments[comparisonIndexB][`${comparisonView === 'front' ? 'front' : comparisonView === 'back' ? 'back' : comparisonView === 'left' ? 'left_side' : 'right_side'}_photo_url`]} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Camera className="w-8 h-8 text-tertiary" />
                                                            )}
                                                            <div className="absolute bottom-2 left-2 z-20 bg-black/60 backdrop-blur-md text-[10px] text-white px-2 py-1 rounded-full border border-white/10 uppercase font-bold">
                                                                {comparisonView}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-center text-primary uppercase tracking-widest flex items-center justify-center gap-2">
                                                            PONTO B <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                                                                {assessments?.[comparisonIndexA] ? format(new Date(assessments[comparisonIndexA].assessment_date), "MM/yy") : "-"}
                                                            </span>
                                                        </p>
                                                        <div className="aspect-[3/4] rounded-xl bg-sidebar border border-primary/30 flex items-center justify-center overflow-hidden shadow-lg shadow-primary/5 relative group">
                                                            <div className="absolute inset-0 border-[0.5px] border-primary/20 pointer-events-none opacity-50 z-10 grid grid-cols-4 grid-rows-6">
                                                                {Array.from({ length: 24 }).map((_, i) => (
                                                                    <div key={i} className="border-[0.2px] border-primary/10"></div>
                                                                ))}
                                                            </div>
                                                            {assessments?.[comparisonIndexA]?.[`${comparisonView === 'front' ? 'front' : comparisonView === 'back' ? 'back' : comparisonView === 'left' ? 'left_side' : 'right_side'}_photo_url`] ? (
                                                                <img src={assessments[comparisonIndexA][`${comparisonView === 'front' ? 'front' : comparisonView === 'back' ? 'back' : comparisonView === 'left' ? 'left_side' : 'right_side'}_photo_url`]} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Camera className="w-8 h-8 text-tertiary" />
                                                            )}
                                                            <div className="absolute bottom-2 left-2 z-20 bg-primary/80 backdrop-blur-md text-[10px] text-white px-2 py-1 rounded-full border border-white/10 uppercase font-bold">
                                                                {comparisonView}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Botão de Análise Postural Elite */}
                                        {assessments?.[comparisonIndexA] && (
                                            <Button
                                                onClick={() => {
                                                    const photoKey = `${comparisonView === 'front' ? 'front' : comparisonView === 'back' ? 'back' : comparisonView === 'left' ? 'left_side' : 'right_side'}_photo_url`;
                                                    const photoUrl = assessments[comparisonIndexA][photoKey];
                                                    if (photoUrl) {
                                                        setSelectedPhotoForAnalysis({
                                                            url: photoUrl,
                                                            assessmentId: assessments[comparisonIndexA].id,
                                                            view: comparisonView
                                                        });
                                                        setIsSymmetrographOpen(true);
                                                    } else {
                                                        toast.error('Nenhuma foto disponível para análise.');
                                                    }
                                                }}
                                                className="w-full h-12 gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                                            >
                                                <Sparkles className="w-5 h-5" />
                                                Análise Postural Elite (IA Vision)
                                            </Button>
                                        )}

                                        <Card className="border-border bg-card">
                                            <CardHeader>
                                                <CardTitle className="flex items-center justify-between">
                                                    Vídeos de Execução
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                                        {(assessments?.[0]?.videos?.length || 0) + (assessments?.[0]?.video_url ? 1 : 0)} Vídeos
                                                    </span>
                                                </CardTitle>
                                                <CardDescription>Análise técnica de movimentos</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {/* Legacy Single Video Fallback */}
                                                {assessments?.[0]?.video_url && (
                                                    <div className="space-y-2">
                                                        <BiomechanicalVideoPlayer
                                                            videoUrl={assessments[0].video_url}
                                                            assessmentId={assessments[0].id}
                                                            exerciseName="Vídeo Principal"
                                                            onAnalysisComplete={() => {
                                                                queryClient.invalidateQueries({ queryKey: ["assessments", selectedStudentId] });
                                                            }}
                                                        />
                                                    </div>
                                                )}

                                                {/* Modern Video List */}
                                                <div className="grid grid-cols-1 gap-6">
                                                    {assessments?.[0]?.videos?.map((vid: any, i: number) => (
                                                        <div key={i} className="space-y-2">
                                                            <BiomechanicalVideoPlayer
                                                                videoUrl={vid.url}
                                                                assessmentId={assessments[0].id}
                                                                exerciseName={vid.label || `Vídeo ${i + 1}`}
                                                                onAnalysisComplete={() => {
                                                                    queryClient.invalidateQueries({ queryKey: ["assessments", selectedStudentId] });
                                                                }}
                                                            />
                                                        </div>
                                                    ))}

                                                    {(!assessments?.[0]?.videos?.length && !assessments?.[0]?.video_url) && (
                                                        <div className="aspect-video rounded-xl bg-sidebar border border-border flex flex-col items-center justify-center text-muted-foreground gap-4">
                                                            <Video className="w-12 h-12 opacity-20" />
                                                            <p>Nenhum vídeo registrado nesta análise.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                <TabsContent value="history" className="animate-fade-in">
                                    <div className="space-y-4">
                                        {assessments?.map((assessment) => (
                                            <Card key={assessment.id} className="border-border bg-card hover:bg-surface-hover transition-colors">
                                                <CardContent className="p-6">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                                {format(new Date(assessment.assessment_date), "dd")}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold">{format(new Date(assessment.assessment_date), "MMMM 'de' yyyy", { locale: ptBR })}</h4>
                                                                <p className="text-sm text-muted-foreground">{assessment.weight}kg • {assessment.body_fat}% gordura</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => handleEditAssessment(assessment)}>Ver Detalhes</Button>
                                                            <Button variant="outline" size="sm" className="text-status-error hover:bg-status-error/10 hover:text-status-error border-status-error/20" onClick={() => handleDeleteAssessment(assessment.id)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleExportPDF(assessment)}
                                                                disabled={isGeneratingPdf}
                                                                className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-colors"
                                                            >
                                                                {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                                                Exportar PDF
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </main>
            </div>

            {/* Modal de Nova Avaliação */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            {editingAssessmentId ? <FileText className="w-6 h-6 text-primary" /> : <Plus className="w-6 h-6 text-primary" />}
                            {editingAssessmentId ? "Editar Avaliação Física" : "Nova Avaliação Física"}
                        </DialogTitle>
                        <DialogDescription>
                            Registre as métricas, fotos e vídeos para acompanhar a evolução de {selectedStudent?.name}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        <Accordion type="single" collapsible defaultValue="metrics" className="w-full space-y-4">
                            {/* Item 1: Métricas Básicas */}
                            <AccordionItem value="metrics" className="border border-border rounded-xl bg-sidebar/50 px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3">
                                        <Scale className="w-5 h-5 text-primary" />
                                        <span className="text-lg font-semibold text-foreground">Composição Corporal & Métricas</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-foreground font-medium">Data da Avaliação</Label>
                                            <Input type="date" value={newAssessment.assessment_date} onChange={(e) => handleInputChange("assessment_date", e.target.value)} className="bg-background border-border text-foreground" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground font-medium">Peso (kg)</Label>
                                            <Input type="number" step="0.1" value={newAssessment.weight} onChange={(e) => handleInputChange("weight", e.target.value)} placeholder="0.0" className="bg-background border-border text-foreground" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground font-medium">Altura (cm)</Label>
                                            <Input type="number" value={newAssessment.height} onChange={(e) => handleInputChange("height", e.target.value)} placeholder="170" className="bg-background border-border text-foreground" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground font-medium">IMC</Label>
                                            <Input value={newAssessment.bmi} disabled className="bg-muted/30 border-border text-foreground/70" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground font-medium">% Gordura</Label>
                                            <Input type="number" step="0.1" value={newAssessment.body_fat} onChange={(e) => handleInputChange("body_fat", e.target.value)} placeholder="0.0" className="bg-background border-border text-foreground" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground font-medium">Massa Muscular (kg)</Label>
                                            <Input type="number" step="0.1" value={newAssessment.muscle_mass} onChange={(e) => handleInputChange("muscle_mass", e.target.value)} placeholder="0.0" className="bg-background border-border text-foreground" />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Item 2: Análise Técnica & Funcional */}
                            <AccordionItem value="analysis" className="border border-border rounded-xl bg-sidebar/50 px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-primary" />
                                        <span className="text-lg font-semibold text-foreground">Análise Postural & Funcional</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-foreground font-medium">Avaliação Postural</Label>
                                            <Textarea value={newAssessment.postural_notes} onChange={(e) => handleInputChange("postural_notes", e.target.value)} placeholder="Desvios, simetria..." className="bg-background border-border text-foreground min-h-[100px]" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground font-medium">Avaliação Funcional</Label>
                                            <Textarea value={newAssessment.functional_notes} onChange={(e) => handleInputChange("functional_notes", e.target.value)} placeholder="Limitações, testes de movimento..." className="bg-background border-border text-foreground min-h-[100px]" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground font-medium">Encurtamentos/Mobilidade</Label>
                                            <Textarea value={newAssessment.mobility_notes} onChange={(e) => handleInputChange("mobility_notes", e.target.value)} placeholder="Ex: Dorsiflexão limitada, Encurtamento de Isquiotibiais" className="bg-background border-border text-foreground min-h-[100px]" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground font-medium">Cargas de Referência (RM)</Label>
                                            <Textarea value={newAssessment.rm_notes} onChange={(e) => handleInputChange("rm_notes", e.target.value)} placeholder="Agachamento: 100kg, Supino: 80kg..." className="bg-background border-border text-foreground min-h-[100px]" />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Item 3: Perimetria */}
                            <AccordionItem value="perimetry" className="border border-border rounded-xl bg-sidebar/50 px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3">
                                        <Activity className="w-5 h-5 text-primary" />
                                        <span className="text-lg font-semibold text-foreground">Perimetria Detalhada (cm)</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-6 space-y-8">
                                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                        <div className="space-y-1.5"><Label className="text-[10px] uppercase font-bold text-foreground/80">Pescoço</Label><Input type="number" step="0.1" value={newAssessment.neck} onChange={(e) => handleNumericInputChange("neck", e.target.value)} className="bg-background h-9 text-foreground" /></div>
                                        <div className="space-y-1.5"><Label className="text-[10px] uppercase font-bold text-foreground/80">Ombro</Label><Input type="number" step="0.1" value={newAssessment.shoulder} onChange={(e) => handleNumericInputChange("shoulder", e.target.value)} className="bg-background h-9 text-foreground" /></div>
                                        <div className="space-y-1.5"><Label className="text-[10px] uppercase font-bold text-foreground/80">Tórax</Label><Input type="number" step="0.1" value={newAssessment.chest} onChange={(e) => handleNumericInputChange("chest", e.target.value)} className="bg-background h-9 text-foreground" /></div>
                                        <div className="space-y-1.5"><Label className="text-[10px] uppercase font-bold text-foreground/80">Cintura</Label><Input type="number" step="0.1" value={newAssessment.waist} onChange={(e) => handleNumericInputChange("waist", e.target.value)} className="bg-background h-9 text-foreground" /></div>
                                        <div className="space-y-1.5"><Label className="text-[10px] uppercase font-bold text-foreground/80">Abdômen</Label><Input type="number" step="0.1" value={newAssessment.abdomen} onChange={(e) => handleNumericInputChange("abdomen", e.target.value)} className="bg-background h-9 text-foreground" /></div>
                                        <div className="space-y-1.5"><Label className="text-[10px] uppercase font-bold text-foreground/80">Quadril</Label><Input type="number" step="0.1" value={newAssessment.hip} onChange={(e) => handleNumericInputChange("hip", e.target.value)} className="bg-background h-9 text-foreground" /></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-primary uppercase border-l-2 border-primary pl-2">Braços</h4>
                                            <div className="grid grid-cols-2 gap-4 bg-background/40 p-4 rounded-xl border border-border">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-foreground/70">Braço Direito</Label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Input placeholder="Rel." value={newAssessment.arm_right_relaxed} onChange={(e) => handleNumericInputChange("arm_right_relaxed", e.target.value)} className="bg-background h-8 text-xs text-foreground" />
                                                        <Input placeholder="Cont." value={newAssessment.arm_right_contracted} onChange={(e) => handleNumericInputChange("arm_right_contracted", e.target.value)} className="bg-background h-8 text-xs text-foreground" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-foreground/70">Braço Esquerdo</Label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Input placeholder="Rel." value={newAssessment.arm_left_relaxed} onChange={(e) => handleNumericInputChange("arm_left_relaxed", e.target.value)} className="bg-background h-8 text-xs text-foreground" />
                                                        <Input placeholder="Cont." value={newAssessment.arm_left_contracted} onChange={(e) => handleNumericInputChange("arm_left_contracted", e.target.value)} className="bg-background h-8 text-xs text-foreground" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-primary uppercase border-l-2 border-primary pl-2">Panturrilhas</h4>
                                            <div className="grid grid-cols-2 gap-4 bg-background/40 p-4 rounded-xl border border-border">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-foreground/70 text-center block">Direita</Label>
                                                    <Input value={newAssessment.calf_right} onChange={(e) => handleNumericInputChange("calf_right", e.target.value)} className="bg-background h-9 text-foreground" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-foreground/70 text-center block">Esquerda</Label>
                                                    <Input value={newAssessment.calf_left} onChange={(e) => handleNumericInputChange("calf_left", e.target.value)} className="bg-background h-9 text-foreground" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-primary uppercase border-l-2 border-primary pl-2">Coxas</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-background/40 p-4 rounded-xl border border-border">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-foreground/70">Coxa Direita</Label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <Input placeholder="Prox." value={newAssessment.thigh_right_proximal} onChange={(e) => handleNumericInputChange("thigh_right_proximal", e.target.value)} className="bg-background h-8 text-xs text-foreground" />
                                                    <Input placeholder="Med." value={newAssessment.thigh_right_medial} onChange={(e) => handleNumericInputChange("thigh_right_medial", e.target.value)} className="bg-background h-8 text-xs text-foreground" />
                                                    <Input placeholder="Dist." value={newAssessment.thigh_right_distal} onChange={(e) => handleNumericInputChange("thigh_right_distal", e.target.value)} className="bg-background h-8 text-xs text-foreground" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-foreground/70">Coxa Esquerda</Label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <Input placeholder="Prox." value={newAssessment.thigh_left_proximal} onChange={(e) => handleNumericInputChange("thigh_left_proximal", e.target.value)} className="bg-background h-8 text-xs text-foreground" />
                                                    <Input placeholder="Med." value={newAssessment.thigh_left_medial} onChange={(e) => handleNumericInputChange("thigh_left_medial", e.target.value)} className="bg-background h-8 text-xs text-foreground" />
                                                    <Input placeholder="Dist." value={newAssessment.thigh_left_distal} onChange={(e) => handleNumericInputChange("thigh_left_distal", e.target.value)} className="bg-background h-8 text-xs text-foreground" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Item 4: Dobras Cutâneas */}
                            <AccordionItem value="skinfolds" className="border border-border rounded-xl bg-sidebar/50 px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                        <span className="text-lg font-semibold text-foreground">Dobras Cutâneas (mm)</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="space-y-1.5"><Label className="text-[10px] uppercase font-bold text-foreground/80">Peitoral</Label><Input type="number" step="0.1" value={newAssessment.chest_fold} onChange={(e) => handleNumericInputChange("chest_fold", e.target.value)} className="bg-background h-9 text-foreground" /></div>
                                        <div className="space-y-1.5"><Label className="text-[10px] uppercase font-bold text-foreground/80">Axilar M.</Label><Input type="number" step="0.1" value={newAssessment.midaxillary_fold} onChange={(e) => handleNumericInputChange("midaxillary_fold", e.target.value)} className="bg-background h-9 text-foreground" /></div>
                                        <div className="space-y-1.5"><Label className="text-[10px] uppercase font-bold text-foreground/80">Tricipital</Label><Input type="number" step="0.1" value={newAssessment.triceps_fold} onChange={(e) => handleNumericInputChange("triceps_fold", e.target.value)} className="bg-background h-9 text-foreground" /></div>
                                        <div className="space-y-1.5"><Label className="text-[10px] uppercase font-bold text-foreground/80">Subescap.</Label><Input type="number" step="0.1" value={newAssessment.subscapular_fold} onChange={(e) => handleNumericInputChange("subscapular_fold", e.target.value)} className="bg-background h-9 text-foreground" /></div>
                                        <div className="space-y-1.5"><Label className="text-[10px] uppercase font-bold text-foreground/80">Abdominal</Label><Input type="number" step="0.1" value={newAssessment.abdominal_fold} onChange={(e) => handleNumericInputChange("abdominal_fold", e.target.value)} className="bg-background h-9 text-foreground" /></div>
                                        <div className="space-y-1.5"><Label className="text-[10px] uppercase font-bold text-foreground/80">Supra-il.</Label><Input type="number" step="0.1" value={newAssessment.suprailiac_fold} onChange={(e) => handleNumericInputChange("suprailiac_fold", e.target.value)} className="bg-background h-9 text-foreground" /></div>
                                        <div className="space-y-1.5"><Label className="text-[10px] uppercase font-bold text-foreground/80">Coxa</Label><Input type="number" step="0.1" value={newAssessment.thigh_fold} onChange={(e) => handleNumericInputChange("thigh_fold", e.target.value)} className="bg-background h-9 text-foreground" /></div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Item 5: Fotos & Vídeos */}
                            <AccordionItem value="media" className="border border-border rounded-xl bg-sidebar/50 px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3">
                                        <Camera className="w-5 h-5 text-primary" />
                                        <span className="text-lg font-semibold text-foreground">Registro Visual (Fotos & Vídeos)</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-6 space-y-8">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {(['front', 'right_side', 'left_side', 'back'] as const).map((side) => (
                                            <div key={side} className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-foreground/80 text-center block">
                                                    {side === 'front' ? 'Frente' : side === 'back' ? 'Costas' : side === 'left_side' ? 'Lado E' : 'Lado D'}
                                                </Label>
                                                <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-background">
                                                    {newAssessment[`${side}_photo_url` as keyof typeof newAssessment] ? (
                                                        <img src={newAssessment[`${side}_photo_url` as keyof typeof newAssessment] as string} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Upload className="w-6 h-6 text-foreground/30" />
                                                    )}
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], `${side}_photo_url`)} />
                                                </label>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-border">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-foreground font-semibold flex items-center gap-2">
                                                <Video className="w-4 h-4 text-primary" /> Vídeos de Movimentos
                                            </Label>
                                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                {newAssessment.videos.length} VÍDEOS
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {newAssessment.videos.map((vid, idx) => (
                                                <div key={idx} className="flex gap-2 items-end bg-background p-3 rounded-lg border border-border">
                                                    <div className="flex-1 space-y-1.5">
                                                        <Label className="text-[10px] uppercase font-bold text-foreground/60">Nome do Movimento</Label>
                                                        <Input
                                                            value={vid.label}
                                                            onChange={(e) => updateVideoLabel(idx, e.target.value)}
                                                            placeholder="Ex: Agachamento Lateral"
                                                            className="h-8 bg-sidebar border-none text-foreground text-sm"
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeVideo(idx)}
                                                        className="h-8 w-8 text-status-error hover:bg-status-error/10"
                                                    >
                                                        <Plus className="w-4 h-4 rotate-45" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>

                                        <label className="aspect-[6/1] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group bg-background">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:rotate-90 transition-transform">
                                                    <Plus className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-bold text-foreground">Adicionar Vídeo de Execução</span>
                                            </div>
                                            <input type="file" className="hidden" accept="video/*" onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])} />
                                        </label>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Item 6: Notas Finais */}
                            <AccordionItem value="summary" className="border border-border rounded-xl bg-sidebar/50 px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3">
                                        <Plus className="w-5 h-5 text-primary" />
                                        <span className="text-lg font-semibold text-foreground">Observações Gerais & Fechamento</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-6">
                                    <div className="space-y-2">
                                        <Label className="text-foreground font-medium">Considerações do Coach</Label>
                                        <Textarea
                                            value={newAssessment.general_notes}
                                            onChange={(e) => handleInputChange("general_notes", e.target.value)}
                                            placeholder="Descreve aqui os pontos principais da evolução e próximos passos..."
                                            className="bg-background border-border text-foreground min-h-[120px]"
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    <DialogFooter className="border-t border-border pt-6 mt-6">
                        <Button variant="ghost" onClick={() => {
                            setIsModalOpen(false);
                            setEditingAssessmentId(null);
                        }}>Cancelar</Button>
                        <Button onClick={handleSaveAssessment} disabled={isSaving || !newAssessment.weight} className="min-w-[150px]">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {editingAssessmentId ? "Atualizar Avaliação" : "Salvar Avaliação"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Modal para agendar próxima avaliação */}
            <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Remarcar Próxima Avaliação
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Defina uma data sugerida para a próxima avaliação física deste aluno. Isso aparecerá na sua agenda.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="next-date">Data Sugerida</Label>
                            <Input
                                id="next-date"
                                type="date"
                                value={nextAssessmentDate}
                                onChange={(e) => setNextAssessmentDate(e.target.value)}
                                className="bg-background/50 h-12"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setIsScheduleModalOpen(false)}
                            className="h-11"
                        >
                            Pular por agora
                        </Button>
                        <Button
                            onClick={handleScheduleNext}
                            className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            Agendar Avaliação
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Symmetrograph Modal */}
            <Dialog open={isSymmetrographOpen} onOpenChange={setIsSymmetrographOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Análise Postural Elite - IA Vision</DialogTitle>
                        <DialogDescription>
                            Utilize as ferramentas de desenho e análise de IA para identificar desvios posturais biomecânicos.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPhotoForAnalysis && (
                        <Symmetrograph
                            photoUrl={selectedPhotoForAnalysis.url}
                            assessmentId={selectedPhotoForAnalysis.assessmentId}
                            photoView={selectedPhotoForAnalysis.view as 'front' | 'back' | 'left_side' | 'right_side'}
                            onAnalysisComplete={(analysis) => {
                                queryClient.invalidateQueries({ queryKey: ["assessments", selectedStudentId] });
                                toast.success('Análise concluída! Dados salvos na avaliação.');
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ComparativeAnalysis;
