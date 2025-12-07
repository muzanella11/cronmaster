import {CronJobPayload} from "./cron";

export interface RollingJobOptions {
  baseId: string;
  schedules: string[];
  timezone?: string;
  createPayload: (schedule: string, index: number) => Partial<CronJobPayload>;
}
