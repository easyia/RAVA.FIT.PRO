import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Minus,
    Circle,
    Eraser,
    Download,
    Sparkles,
    Loader2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface BiomechanicalVideoPlayerProps {
    videoUrl: string;
    assessmentId: string;
    exerciseName?: string;
    onAnalysisComplete?: (analysis: any) => void;
}

export function BiomechanicalVideoPlayer({
    videoUrl,
    assessmentId,
    exerciseName = "Exercício",
    onAnalysisComplete
}: BiomechanicalVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [tool, setTool] = useState<'line' | 'circle' | 'eraser'>('line');
    const [drawings, setDrawings] = useState<any[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState<{ x: number, y: number } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedMetadata = () => {
            setDuration(video.duration);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            redrawCanvas();
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, []);

    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !video) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw annotations
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

    const togglePlayPause = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            video.play();
        }
        setIsPlaying(!isPlaying);
    };

    const seekFrame = (direction: 'forward' | 'backward') => {
        const video = videoRef.current;
        if (!video) return;

        const frameTime = 1 / 30; // Assuming 30fps
        video.currentTime = Math.max(0, Math.min(duration, video.currentTime + (direction === 'forward' ? frameTime : -frameTime)));
    };

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (tool === 'eraser') {
            setDrawings([]);
            return;
        }

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDrawing(true);
        setDrawStart({ x, y });

        if (tool === 'circle') {
            setDrawings([...drawings, { type: 'circle', x, y, radius: 30, color: '#ff0000' }]);
            setIsDrawing(false);
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || tool !== 'line' || !drawStart) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Preview line (could be implemented with temporary canvas)
    };

    const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || tool !== 'line' || !drawStart) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;

        setDrawings([...drawings, {
            type: 'line',
            startX: drawStart.x,
            startY: drawStart.y,
            endX,
            endY,
            color: '#ff0000',
            timestamp: currentTime
        }]);

        setIsDrawing(false);
        setDrawStart(null);
        redrawCanvas();
    };

    const handleAIAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            // Capture current frame
            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            if (!video) throw new Error('Vídeo não disponível');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0);
            const frameDataUrl = canvas.toDataURL('image/jpeg', 0.8);

            const { data, error } = await supabase.functions.invoke('analyze-movement', {
                body: {
                    assessment_id: assessmentId,
                    video_url: videoUrl,
                    frame_data: frameDataUrl,
                    timestamp: currentTime,
                    exercise_name: exerciseName,
                    annotations: drawings
                }
            });

            if (error) throw error;
            if (data.success) {
                setAiAnalysis(data.analysis);
                toast.success('Análise biomecânica concluída!');
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

    const handleSaveAnnotations = async () => {
        try {
            const { error } = await supabase
                .from('physical_assessments')
                .update({
                    execution_analysis: {
                        video_url: videoUrl,
                        annotations: drawings,
                        ai_analysis: aiAnalysis,
                        exercise_name: exerciseName
                    }
                })
                .eq('id', assessmentId);

            if (error) throw error;
            toast.success('Anotações salvas!');
        } catch (error) {
            toast.error('Erro ao salvar anotações.');
        }
    };

    return (
        <Card className="border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Play className="w-5 h-5 text-primary" />
                        Análise Biomecânica de Vídeo
                    </span>
                    <Badge variant="outline">{exerciseName}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Video Player with Canvas Overlay */}
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-contain"
                        onLoadedMetadata={() => {
                            const canvas = canvasRef.current;
                            const video = videoRef.current;
                            if (canvas && video) {
                                canvas.width = video.videoWidth;
                                canvas.height = video.videoHeight;
                            }
                        }}
                    />
                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        className="absolute inset-0 w-full h-full cursor-crosshair"
                        style={{ pointerEvents: 'auto' }}
                    />
                </div>

                {/* Controls */}
                <div className="space-y-4">
                    {/* Playback Controls */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => seekFrame('backward')}
                            className="h-10 w-10"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="default"
                            size="icon"
                            onClick={togglePlayPause}
                            className="h-12 w-12"
                        >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => seekFrame('forward')}
                            className="h-10 w-10"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>

                        <div className="flex-1">
                            <Slider
                                value={[currentTime]}
                                onValueChange={(v) => {
                                    if (videoRef.current) {
                                        videoRef.current.currentTime = v[0];
                                    }
                                }}
                                min={0}
                                max={duration}
                                step={0.01}
                                className="cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>{currentTime.toFixed(2)}s</span>
                                <span>{duration.toFixed(2)}s</span>
                            </div>
                        </div>
                    </div>

                    {/* Drawing Tools */}
                    <div className="flex gap-2">
                        <Button
                            variant={tool === 'line' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTool('line')}
                        >
                            <Minus className="w-4 h-4 mr-2" />
                            Linha
                        </Button>
                        <Button
                            variant={tool === 'circle' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTool('circle')}
                        >
                            <Circle className="w-4 h-4 mr-2" />
                            Círculo
                        </Button>
                        <Button
                            variant={tool === 'eraser' ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => setTool('eraser')}
                        >
                            <Eraser className="w-4 h-4 mr-2" />
                            Limpar
                        </Button>
                        <div className="flex-1" />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSaveAnnotations}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Salvar
                        </Button>
                    </div>
                </div>

                {/* AI Analysis Button */}
                <Button
                    onClick={handleAIAnalysis}
                    disabled={isAnalyzing}
                    className="w-full h-12 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-600/90 hover:to-pink-600/90"
                >
                    {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {isAnalyzing ? 'Analisando Biomecânica...' : 'Análise Biomecânica PhD (IA)'}
                </Button>

                {/* AI Results */}
                {aiAnalysis && (
                    <div className="mt-6 p-4 bg-purple-500/5 rounded-xl border border-purple-500/20">
                        <h4 className="font-bold text-purple-600 mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Análise Biomecânica PhD
                        </h4>
                        {aiAnalysis.technical_issues?.length > 0 ? (
                            <div className="space-y-2">
                                {aiAnalysis.technical_issues.map((issue: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-background rounded-lg border border-border">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-sm">{issue.type}</span>
                                            <Badge variant={issue.severity === 'grave' ? 'destructive' : issue.severity === 'moderado' ? 'default' : 'secondary'}>
                                                {issue.severity}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{issue.description}</p>
                                        <p className="text-xs text-blue-600 mt-1 font-medium">💡 {issue.correction}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">✓ Execução tecnicamente adequada.</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
