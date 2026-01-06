// StudentStatus is defined later in this file
export type StudentGoal = 'hipertrofia' | 'emagrecimento' | 'condicionamento' | 'reabilitacao' | 'performance';
export type StudentClassification = 'bronze' | 'silver' | 'gold';
export type ServiceType = 'presencial' | 'online';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  goal: StudentGoal;
  status: StudentStatus;
  classification: StudentClassification;
  serviceType: ServiceType;
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

export type StudentStatus = 'active' | 'inactive' | 'pending_approval' | 'deleted' | 'ativo' | 'inativo' | 'pendente' | 'excluido';

export const statusLabels: Record<StudentStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  pending_approval: 'Pendente',
  deleted: 'Excluído',
  ativo: 'Ativo',
  inativo: 'Inativo',
  pendente: 'Pendente',
  excluido: 'Excluído',
};
