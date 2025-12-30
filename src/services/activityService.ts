import { Activity, CalendarEvent } from "@/types/activity";

export async function getRecentActivities(): Promise<Activity[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [];
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [];
}
