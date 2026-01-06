export type ActivityType = 'message' | 'workout' | 'assessment' | 'payment' | 'anamnesis';

export interface Activity {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  message: string;
  time: string;
  type: ActivityType;
}

export interface CalendarEvent {
  date: string;
  studentId: string;
  type: 'session' | 'assessment';
}
