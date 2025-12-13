export interface CronJobPayload {
  id: string;
  cron: string;
  timezone?: string;
  task: () => void;
}
