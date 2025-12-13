export declare class RollingJobManager {
  private rollingJobs;
  createRollingJob(
    taskId: string,
    intervalDays: number,
    task: () => Promise<void>,
    timeZone?: string,
    runImmediately?: boolean,
    isTestMode?: boolean,
    intervalTestInMinutes?: number,
  ): void;
  deleteRollingJob(taskId: string): void;
  showRollingJobs(): void;
}
