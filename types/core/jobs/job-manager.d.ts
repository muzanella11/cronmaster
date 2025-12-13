import {CronJobPayload} from "./../../../types/cron";
export declare class JobManager {
  private jobs;
  createJob(payload: CronJobPayload): void;
  startJob(id: string): void;
  stopJob(id: string): void;
  deleteJob(id: string): void;
}
