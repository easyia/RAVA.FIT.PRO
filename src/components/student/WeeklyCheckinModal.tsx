import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { getLastFeedback, createFeedback } from "@/services/feedbackService";
import { toast } from "sonner";
import { Loader2, CalendarCheck, AlertCircle } from "lucide-react";

export function WeeklyCheckinModal({
    studentId,
    coachId,
    open: externalOpen,
    onOpenChange: setExternalOpen
}: {
    studentId: string,
    coachId: string,
    open?: boolean,
    onOpenChange?: (open: boolean) => void
}) {
    const [internalOpen, setInternalOpen] = useState(false);

    // Determine if we use internal or external controlled state
    const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
    const setIsOpen = setExternalOpen || setInternalOpen;
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form Stats
    const [trainingCount, setTrainingCount] = useState<number>(0);
    const [loadPerception, setLoadPerception] = useState("");
    const [fatigue, setFatigue] = useState([5]); // Array cause slider
    const [sleep, setSleep] = useState([7]);
    const [hasPain, setHasPain] = useState(false);
    const [painIntensity, setPainIntensity] = useState([0]);
    const [painLocation, setPainLocation] = useState("");
    const [notes, setNotes] = useState("");

    // Check Eligibility - Removed automatic opening to honor manual button control
    useEffect(() => {
        const checkEligibility = async () => {
            if (!studentId) return;
            try {
                // Just keeping the service call if there's any future need, 
                // but we no longer force isOpen to true here.
                await getLastFeedback(studentId);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        checkEligibility();
    }, [studentId]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await createFeedback({
                student_id: studentId,
                coach_id: coachId,
                training_count: trainingCount,
                load_perception: loadPerception,
                has_pain: hasPain,
                pain_intensity: hasPain ? painIntensity[0] : 0,
                pain_location: hasPain ? painLocation : "",
                fatigue_level: fatigue[0],
                sleep_quality: sleep[0],
                notes: notes
            });
            toast.success("Feedback enviado! Boa semana de treinos.");
            setIsOpen(false);
        } catch (error) {
            toast.error("Erro ao enviar feedback.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarCheck className="w-5 h-5 text-primary" /> Check-in Semanal
                    </DialogTitle>
                    <DialogDescription>
                        Conte como foi sua semana para o Treinador ajustar seu próximo protocolo.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Training Count */}
                    <div className="space-y-2">
                        <Label>Quantos treinos você realizou?</Label>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={() => setTrainingCount(Math.max(0, trainingCount - 1))}>-</Button>
                            <span className="text-xl font-bold w-8 text-center">{trainingCount}</span>
                            <Button variant="outline" size="icon" onClick={() => setTrainingCount(trainingCount + 1)}>+</Button>
                        </div>
                    </div>

                    {/* Fatigue & Sleep */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Nível de Cansaço (0-10)</Label>
                                <span className={fatigue[0] > 7 ? "text-red-500 font-bold" : "text-muted-foreground"}>{fatigue[0]}</span>
                            </div>
                            <Slider value={fatigue} onValueChange={setFatigue} max={10} step={1} className={fatigue[0] > 7 ? "bg-red-500/10 rounded-full" : ""} />
                            <p className="text-[10px] text-muted-foreground text-right">{fatigue[0] > 7 ? "Alto risco de overtraining" : "Normal"}</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Qualidade do Sono (0-10)</Label>
                                <span className={sleep[0] < 5 ? "text-red-500 font-bold" : "text-muted-foreground"}>{sleep[0]}</span>
                            </div>
                            <Slider value={sleep} onValueChange={setSleep} max={10} step={1} />
                            <p className="text-[10px] text-muted-foreground text-right">{sleep[0] < 5 ? "Sono ruim prejudica recuperação" : "Bom descanso"}</p>
                        </div>
                    </div>

                    {/* Pain Report */}
                    <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Sentiu alguma dor?</Label>
                            <Switch checked={hasPain} onCheckedChange={setHasPain} />
                        </div>

                        {hasPain && (
                            <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Intensidade (0-10)</Label>
                                        <span className="font-bold">{painIntensity[0]}</span>
                                    </div>
                                    <Slider value={painIntensity} onValueChange={setPainIntensity} max={10} step={1} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Onde dói?</Label>
                                    <Input placeholder="Ex: Ombro direito, Joelho..." value={painLocation} onChange={(e) => setPainLocation(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Load Perception */}
                    <div className="space-y-2">
                        <Label>Percepção de Carga</Label>
                        <Textarea
                            placeholder="Quais exercícios foram fáceis ou difíceis? Alguma observação sobre as cargas?"
                            value={loadPerception}
                            onChange={(e) => setLoadPerception(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Depois</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Enviar Check-in"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
