import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Grid3x3, Eraser, Circle, Minus, Download, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface SymmetrographProps {
    photoUrl: string;
    assessmentId: string;
    photoView: 'front' | 'back' | 'left_side' | 'right_side';
    onAnalysisComplete?: (analysis: any) => void;
}

export function Symmetrograph({ photoUrl, assessmentId, photoView, onAnalysisComplete }: SymmetrographProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [tool, setTool] = useState<'line' | 'circle' | 'eraser'>('line');
    const [gridOpacity, setGridOpacity] = useState(50);
    const [gridColor, setGridColor] = useState('#00ff00');
    const [gridSize, setGridSize] = useState(50);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawings, setDrawings] = useState<any[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);

    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = photoUrl;
        img.onload = () => {
            imageRef.current = img;
            redrawCanvas();
        };
    }, [photoUrl]);

    useEffect(() => {
        redrawCanvas();
    }, [gridOpacity, gridColor, gridSize, drawings]);

    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !imageRef.current) return;

        const img = imageRef.current;
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw Image
        ctx.drawImage(img, 0, 0);

        // Draw Grid
        ctx.strokeStyle = gridColor;
        ctx.globalAlpha = gridOpacity / 100;
        ctx.lineWidth = 1;

        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;

        // Draw Annotations
        drawings.forEach((drawing) => {
            ctx.strokeStyle = drawing.color || '#ff0000';
            ctx.lineWidth = 3;
            if (drawing.type === 'line') {
                ctx.beginPath();
                ctx.moveTo(drawing.startX, drawing.startY);
                ctx.lineTo(drawing.endX, drawing.endY);
                ctx.stroke();
            } else if (drawing.type === 'circle') {
                ctx.beginPath();
                ctx.arc(drawing.x, drawing.y, drawing.radius, 0, 2 * Math.PI);
                ctx.stroke();
            }
        });
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (tool === 'eraser') {
            setDrawings([]);
            return;
        }
        setIsDrawing(true);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (tool === 'circle') {
            setDrawings([...drawings, { type: 'circle', x, y, radius: 30, color: '#ff0000' }]);
            setIsDrawing(false);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || tool !== 'line') return;
        // For simplicity, we'll add line on mouse up
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || tool !== 'line') return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;

        // For demo, we'll use a simple line from center to click
        const canvas = canvasRef.current;
        if (canvas) {
            setDrawings([...drawings, {
                type: 'line',
                startX: canvas.width / 2,
                startY: 0,
                endX,
                endY,
                color: '#ff0000'
            }]);
        }
        setIsDrawing(false);
    };

    const handleAIAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const { data, error } = await supabase.functions.invoke('analyze-posture', {
                body: {
                    assessment_id: assessmentId,
                    photo_url: photoUrl,
                    photo_view: photoView,
                }
            });

            if (error) throw error;
            if (data.success) {
                setAiAnalysis(data.analysis);
                toast.success('Análise postural concluída!');
                onAnalysisComplete?.(data.analysis);
            } else {
                throw new Error(data.error || 'Erro na análise');
            }
        } catch (error: any) {
            toast.error('Erro na análise: ' + error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveGrid = async () => {
        const symmetrographData = {
            gridSize,
            gridColor,
            gridOpacity,
            drawings,
        };

        try {
            const { error } = await supabase
                .from('physical_assessments')
                .update({ symmetrograph_data: symmetrographData })
                .eq('id', assessmentId);

            if (error) throw error;
            toast.success('Configuração do simetrógrafo salva!');
        } catch (error) {
            toast.error('Erro ao salvar.');
        }
    };

    return (
        <Card className="border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Grid3x3 className="w-5 h-5 text-primary" />
                        Simetrógrafo Digital
                    </span>
                    <Badge variant="outline">{photoView}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Controls */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs">Opacidade da Grade</Label>
                        <Slider
                            value={[gridOpacity]}
                            onValueChange={(v) => setGridOpacity(v[0])}
                            min={0}
                            max={100}
                            step={5}
                        />
                        <span className="text-xs text-muted-foreground">{gridOpacity}%</span>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs">Espaçamento</Label>
                        <Slider
                            value={[gridSize]}
                            onValueChange={(v) => setGridSize(v[0])}
                            min={20}
                            max={100}
                            step={10}
                        />
                        <span className="text-xs text-muted-foreground">{gridSize}px</span>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs">Cor da Grade</Label>
                        <input
                            type="color"
                            value={gridColor}
                            onChange={(e) => setGridColor(e.target.value)}
                            className="w-full h-10 rounded border border-border cursor-pointer"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs">Ferramentas</Label>
                        <div className="flex gap-1">
                            <Button
                                variant={tool === 'line' ? 'default' : 'outline'}
                                size="icon"
                                onClick={() => setTool('line')}
                                className="h-10 w-10"
                            >
                                <Minus className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={tool === 'circle' ? 'default' : 'outline'}
                                size="icon"
                                onClick={() => setTool('circle')}
                                className="h-10 w-10"
                            >
                                <Circle className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={tool === 'eraser' ? 'destructive' : 'outline'}
                                size="icon"
                                onClick={() => setTool('eraser')}
                                className="h-10 w-10"
                            >
                                <Eraser className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Canvas */}
                <div className="relative border border-border rounded-lg overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        className="w-full cursor-crosshair"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button onClick={handleSaveGrid} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Salvar Grade
                    </Button>
                    <Button onClick={handleAIAnalysis} disabled={isAnalyzing} className="flex-1">
                        {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {isAnalyzing ? 'Analisando...' : 'Analisar com Elite Vision'}
                    </Button>
                </div>

                {/* AI Results */}
                {aiAnalysis && (
                    <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
                        <h4 className="font-bold text-primary mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Análise Biomecânica Elite
                        </h4>
                        {aiAnalysis.desvios_detectados?.length > 0 ? (
                            <div className="space-y-2">
                                {aiAnalysis.desvios_detectados.map((desvio: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-background rounded-lg border border-border">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-sm">{desvio.descricao}</span>
                                            <Badge variant={desvio.severidade === 'severo' ? 'destructive' : desvio.severidade === 'moderado' ? 'default' : 'secondary'}>
                                                {desvio.severidade}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{desvio.impacto_funcional}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhum desvio significativo detectado.</p>
                        )}
                        {aiAnalysis.recomendacoes_treino && (
                            <div className="mt-3 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{aiAnalysis.recomendacoes_treino}</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
