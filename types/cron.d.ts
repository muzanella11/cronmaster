export interface CronJobPayload {
  id: string;
  cron: string;
  timezone?: string;
  onTick: () => void;
}
