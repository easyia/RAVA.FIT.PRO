import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { acceptLegalTerms } from "@/services/studentService";
import { toast } from "sonner";
import { ShieldCheck, FileText } from "lucide-react";

interface LegalConsentModalProps {
    student: any;
    onConsentGiven: () => void;
}

export function LegalConsentModal({ student, onConsentGiven }: LegalConsentModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (student && (!student.terms_accepted_at || !student.legal_consent_at)) {
            setIsOpen(true);
        }
    }, [student]);

    const handleConfirm = async () => {
        if (!termsAccepted || !privacyAccepted) return;

        setIsSubmitting(true);
        try {
            await acceptLegalTerms(student.id);
            toast.success("Consentimentos registrados com sucesso.");
            setIsOpen(false);
            onConsentGiven();
        } catch (error) {
            toast.error("Erro ao registrar consentimento. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            // Prevent closing if not accepted
            if (!open && (!student.terms_accepted_at || !student.legal_consent_at)) {
                return;
            }
            setIsOpen(open);
        }}>
            <DialogContent className="max-w-2xl w-[95vw] p-0 overflow-hidden border-none bg-card/95 backdrop-blur-xl" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <div className="max-h-[90vh] flex flex-col">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                            Consentimento e Termos de Uso
                        </DialogTitle>
                        <DialogDescription>
                            Para continuar utilizando a plataforma e garantirmos a segurança dos seus dados, precisamos do seu consentimento explícito.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-6">
                        <div className="space-y-4">
                            <div className="border border-border rounded-lg p-4 bg-muted/20">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> 1. Tratamento de Dados de Saúde (LGPD)
                                </h4>
                                <div className="text-sm text-muted-foreground leading-relaxed">
                                    Autorizo o tratamento dos meus dados pessoais sensíveis, incluindo fotos posturais, medidas corporais (perimetria e dobras cutâneas) e histórico de saúde (anamnese), exclusivamente para fins de prescrição de treinamento, avaliação física e monitoramento de evolução por parte do meu treinador responsável. Entendo que estes dados são sigilosos e protegidos.
                                </div>
                                <div className="flex items-start space-x-2 mt-4">
                                    <Checkbox id="privacy" checked={privacyAccepted} onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)} />
                                    <Label htmlFor="privacy" className="cursor-pointer font-medium text-xs leading-none pt-1">
                                        Li e concordo com o tratamento dos meus dados de saúde/imagem.
                                    </Label>
                                </div>
                            </div>

                            <div className="border border-border rounded-lg p-4 bg-muted/20">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> 2. Termos de Serviço
                                </h4>
                                <div className="text-sm text-muted-foreground leading-relaxed">
                                    Ao utilizar esta plataforma, concordo em fornecer informações verdadeiras sobre meu estado de saúde e seguir as orientações profissionais com responsabilidade. Isento a plataforma de responsabilidade por execução incorreta dos exercícios sem supervisão ou omissão de dados clínicos relevantes.
                                </div>
                                <div className="flex items-start space-x-2 mt-4">
                                    <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} />
                                    <Label htmlFor="terms" className="cursor-pointer font-medium text-xs leading-none pt-1">
                                        Aceito os Termos de Serviço da plataforma.
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-2 border-t border-border/50">
                        <Button
                            onClick={handleConfirm}
                            disabled={!termsAccepted || !privacyAccepted || isSubmitting}
                            className="w-full font-bold h-12"
                        >
                            {isSubmitting ? "Registrando..." : "Confirmar e Continuar"}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
