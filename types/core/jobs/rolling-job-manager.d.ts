export declare class RollingJobManager {
  private rollingJobs;
  private rollingLocks;
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
  private runWithLock;
  showRollingJobs(): void;
  cleanup(): void;
}
