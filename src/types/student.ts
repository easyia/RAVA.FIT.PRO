export type StudentStatus = 'ativo' | 'inativo' | 'pendente' | 'aguardando';
export type StudentGoal = 'hipertrofia' | 'emagrecimento' | 'condicionamento' | 'reabilitacao' | 'performance';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  goal: StudentGoal;
  status: StudentStatus;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  startDate: string;
  nextSession?: string;
  lastSession?: string;
}

export const goalLabels: Record<StudentGoal, string> = {
  hipertrofia: 'Hipertrofia',
  emagrecimento: 'Emagrecimento',
  condicionamento: 'Condicionamento',
  reabilitacao: 'Reabilitação',
  performance: 'Performance',
};

export const statusLabels: Record<StudentStatus, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  pendente: 'Pendente',
  aguardando: 'Aguardando',
};
