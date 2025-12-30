import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, MoreHorizontal, Video } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const CalendarPage = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Mock events
    const [events] = useState([
        { id: '1', title: 'Avaliação Física - João Silva', time: '09:00', type: 'presencial', date: new Date() },
        { id: '2', title: 'Consultoria Online - Maria Oliveira', time: '14:30', type: 'online', date: new Date() },
        { id: '3', title: 'Planejamento Semanal', time: '17:00', type: 'trabalho', date: new Date() },
    ]);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: ptBR });
    const endDate = endOfWeek(monthEnd, { locale: ptBR });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    return (
        <div className="min-h-screen bg-background">
            <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

            <div className={cn("transition-all duration-300 min-h-screen pb-10", sidebarCollapsed ? "ml-16" : "ml-60")}>
                <main className="p-8">
                    <DashboardHeader
                        title="Calendário"
                        actions={
                            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                                <Plus className="w-4 h-4 mr-2" /> Novo Evento
                            </Button>
                        }
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Calendar View */}
                        <div className="lg:col-span-3">
                            <Card className="border-none bg-card shadow-xl overflow-hidden rounded-2xl">
                                <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-xl font-bold text-foreground capitalize">
                                            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                                        </h2>
                                        <div className="flex bg-sidebar rounded-lg p-1 border border-border">
                                            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 text-tertiary hover:text-primary"><ChevronLeft className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 text-tertiary hover:text-primary"><ChevronRight className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="bg-sidebar border-border">Hoje</Button>
                                        <div className="flex rounded-lg border border-border overflow-hidden">
                                            <Button variant="ghost" size="sm" className="bg-primary text-primary-foreground rounded-none">Mês</Button>
                                            <Button variant="ghost" size="sm" className="bg-sidebar text-muted-foreground rounded-none border-l border-border hover:bg-muted">Semana</Button>
                                            <Button variant="ghost" size="sm" className="bg-sidebar text-muted-foreground rounded-none border-l border-border hover:bg-muted">Dia</Button>
                                        </div>
                                    </div>
                                </div>

                                <CardContent className="p-0">
                                    <div className="grid grid-cols-7 border-b border-border bg-muted/10">
                                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                            <div key={day} className="p-4 text-center text-xs font-bold text-tertiary uppercase tracking-wider border-r border-border last:border-r-0">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7">
                                        {calendarDays.map((day, idx) => {
                                            const dayEvents = events.filter(e => isSameDay(e.date, day));
                                            return (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        "min-h-[140px] p-2 border-r border-b border-border last:border-r-0 transition-colors hover:bg-muted/30 cursor-pointer group",
                                                        !isSameMonth(day, monthStart) && "bg-muted/5 text-muted-foreground/30",
                                                        isSameDay(day, new Date()) && "bg-primary/5 border-primary/20"
                                                    )}
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className={cn(
                                                            "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                                                            isSameDay(day, new Date()) ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-foreground group-hover:text-primary"
                                                        )}>
                                                            {format(day, "d")}
                                                        </span>
                                                        {dayEvents.length > 0 && (
                                                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                        )}
                                                    </div>

                                                    <div className="space-y-1">
                                                        {dayEvents.slice(0, 3).map(event => (
                                                            <div
                                                                key={event.id}
                                                                className={cn(
                                                                    "text-[10px] px-2 py-1 rounded border leading-tight truncate font-medium",
                                                                    event.type === 'presencial' ? "bg-status-success/10 border-status-success/20 text-status-success" :
                                                                        event.type === 'online' ? "bg-primary/10 border-primary/20 text-primary" : "bg-status-info/10 border-status-info/20 text-status-info"
                                                                )}
                                                            >
                                                                {event.time} {event.title}
                                                            </div>
                                                        ))}
                                                        {dayEvents.length > 3 && (
                                                            <div className="text-[10px] text-tertiary text-center font-bold">
                                                                + {dayEvents.length - 3} mais
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar - Upcoming Appointments */}
                        <div className="space-y-6">
                            <Card className="border-none bg-card shadow-xl rounded-2xl">
                                <div className="p-6 border-b border-border">
                                    <h3 className="font-bold text-foreground">Próximos Compromissos</h3>
                                </div>
                                <CardContent className="p-6 space-y-4">
                                    {events.map(event => (
                                        <div key={event.id} className="p-4 rounded-xl border border-border bg-sidebar hover:border-primary transition-all group cursor-pointer">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg",
                                                    event.type === 'presencial' ? "bg-status-success/10 text-status-success" : "bg-primary/10 text-primary"
                                                )}>
                                                    {event.type === 'online' ? <Video className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-tertiary"><MoreHorizontal className="w-4 h-4" /></Button>
                                            </div>
                                            <h4 className="font-bold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">{event.title}</h4>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.time}</div>
                                                <div className="flex items-center gap-1 capitalize"><CalendarIcon className="w-3 h-3" /> {format(event.date, "E, d/MM", { locale: ptBR })}</div>
                                            </div>
                                        </div>
                                    ))}

                                    <Button variant="outline" className="w-full border-dashed border-border text-tertiary hover:text-primary hover:border-primary">
                                        <Plus className="w-4 h-4 mr-2" /> Agendar Horário
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-none bg-gradient-to-br from-primary/10 to-accent/10 shadow-xl rounded-2xl">
                                <CardContent className="p-8 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-card flex items-center justify-center mb-4 shadow-lg">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-8 h-8" alt="Google Calendar" />
                                    </div>
                                    <h4 className="font-bold text-foreground mb-2">Sincronize sua Agenda</h4>
                                    <p className="text-xs text-muted-foreground mb-6">Integre com o Google Agenda para nunca mais perder um horário e facilitar o agendamento.</p>
                                    <Button className="w-full bg-body hover:bg-body/90 text-foreground font-bold shadow-lg border border-border">
                                        Conectar Google
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CalendarPage;
