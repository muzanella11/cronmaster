export declare class JobManager {
  private jobs;
  private cronLocks;
  cronDescription(cronExpr: string): string;
  createJob(
    taskId: string,
    cronExpr: string,
    task: () => Promise<void>,
    timeZone?: string,
    runImmediately?: boolean,
  ): void;
  startJob(id: string): void;
  stopJob(id: string): void;
  cleanup(): void;
  showAllJobs(): void;
  private runWithLock;
  deleteJob(taskId: string): void;
}
