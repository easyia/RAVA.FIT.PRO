import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSignature, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { signContract } from "@/services/financeService";
import { toast } from "sonner";

export function StudentContractCard({ subscription, studentName, coachName, onSigned }: any) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSigning, setIsSigning] = useState(false);

    if (!subscription) return null;

    const isSigned = !!subscription.contract_accepted_at;

    const contractText = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CONSULTORIA ESPORTIVA

CONTRATANTE: ${studentName || "Aluno"}
CONTRATADO: ${coachName || "Treinador Responsável"}
PLANO SELECIONADO: ${subscription.plan?.name} - R$ ${subscription.plan?.price.toFixed(2)}
DURAÇÃO: ${subscription.plan?.duration_months} meses

CLÁUSULA 1 - DO OBJETO
O presente contrato tem por objeto a prestação de serviços de consultoria esportiva e prescrição de treinamento físico e orientações nutricionais (quando aplicável) através da plataforma RAVA FIT PRO.

CLÁUSULA 2 - DAS OBRIGAÇÕES DO CONTRATANTE
I - Fornecer informações verídicas sobre seu estado de saúde;
II - Seguir as orientações prescritas;
III - Efetuar o pagamento conforme acordado.

CLÁUSULA 3 - DA VIGÊNCIA
O contrato inicia-se em ${new Date(subscription.start_date).toLocaleDateString()} e tem validade conforme a duração do plano escolhido.

CLÁUSULA 4 - DA ASSINATURA DIGITAL
As partes reconhecem a validade da assinatura digital deste instrumento aceito via plataforma RAVA FIT PRO.

Data: ${new Date().toLocaleDateString()}
    `;

    const handleSign = async () => {
        setIsSigning(true);
        try {
            await signContract(subscription.id, contractText);
            toast.success("Contrato assinado com sucesso!");
            setIsDialogOpen(false);
            onSigned();
        } catch (error) {
            toast.error("Erro ao assinar contrato.");
        } finally {
            setIsSigning(false);
        }
    };

    return (
        <>
            <Card className="bg-card/40 backdrop-blur-xl border-border">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileSignature className="w-4 h-4 text-primary" /> Meu Contrato
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">{subscription.plan?.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {isSigned
                                    ? `Assinado em ${new Date(subscription.contract_accepted_at).toLocaleDateString()}`
                                    : "Assinatura Pendente - Ação Necessária"}
                            </p>
                        </div>
                        {isSigned ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : (
                            <Button size="sm" onClick={() => setIsDialogOpen(true)} className="animate-pulse bg-amber-500 hover:bg-amber-600">
                                Assinar
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Contrato de Prestação de Serviços</DialogTitle>
                        <DialogDescription>Leia atentamente os termos do vínculo com seu treinador.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[50vh] border p-4 rounded-md bg-muted/10 whitespace-pre-wrap text-sm font-mono leading-relaxed">
                        {contractText}
                    </ScrollArea>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSign} disabled={isSigning}>
                            {isSigning ? "Assinando..." : "Li e Aceito o Contrato"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
