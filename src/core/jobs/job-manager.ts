import {CronJob} from "cron";
import moment from "moment-timezone";
import {toHumanReadable} from "../../utils";

export class JobManager {
  private jobs: Map<string, CronJob> = new Map();
  private cronLocks: Map<string, boolean> = new Map();

  cronDescription(cronExpr: string): string {
    return toHumanReadable(cronExpr);
  }

  createJob(
    taskId: string,
    cronExpr: string,
    task: () => Promise<void>,
    timeZone: string = "UTC",
    runImmediately: boolean = false,
  ): void {
    if (this.jobs.has(taskId)) {
      this.deleteJob(taskId);
    }

    const job = new CronJob(cronExpr, () => this.runWithLock(taskId, task), null, false, timeZone);

    this.jobs.set(taskId, job);

    this.startJob(taskId);

    console.info(`✅ Job "${taskId}" created. Schedule: ${this.cronDescription(cronExpr)} | TZ: ${timeZone}`);

    if (runImmediately) {
      console.info(`🟢 Job "${taskId}" triggered immediately after creation`);
      this.runWithLock(taskId, task);
    }

    this.showAllJobs();
  }

  startJob(id: string): void {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error(`Job with ID "${id}" does not exist`);
    }

    job.start();
    console.info(`▶️ Job "${id}" started.`);
  }

  stopJob(id: string): void {
    this.deleteJob(id);
    console.info(`🛑 Job "${id}" has been stopped and removed.`);
  }

  cleanup(): void {
    this.jobs.forEach((job, id) => {
      this.deleteJob(id);
      console.info(`🛑 Job "${id}" has been stopped during cleanup.`);
    });

    this.jobs.clear();
    this.cronLocks.clear();
    console.info(`🧹 All jobs have been cleaned up.`);
  }

  showAllJobs(): void {
    console.info(`📅 Existing cron jobs:`);

    if (this.jobs.size === 0) {
      console.info(`📭 No cron jobs found.`);
      return;
    }

    const jobEntries = Array.from(this.jobs.entries())
      .map(([id, job]) => {
        const cronExpr = job.cronTime?.source?.toString() || "N/A";
        const timeZone = (job.cronTime as any)?._timezone || "UTC";
        const nextRun = job.nextDate() ? moment(job.nextDate()).tz(timeZone).format("YYYY-MM-DD HH:mm:ss z") : "N/A";
        return {
          "Job ID": id,
          "Cron Expression": cronExpr,
          "Next Run": nextRun,
          "Time Zone": timeZone,
        };
      })
      .sort((a, b) => {
        const dateA = a["Next Run"] === "N/A" ? Infinity : new Date(a["Next Run"]).getTime();
        const dateB = b["Next Run"] === "N/A" ? Infinity : new Date(b["Next Run"]).getTime();
        return dateA - dateB;
      });

    console.table(jobEntries);
    console.info(`🗂️ Total cron jobs: ${this.jobs.size}`);
    console.info(`⏭️ Next run IDs: ${jobEntries.map((j) => j["Job ID"]).join(", ")}`);
    console.info(`🕒 Server time: ${moment().format("YYYY-MM-DD HH:mm:ss Z")}`);
  }

  private async runWithLock(taskId: string, task: () => Promise<void>): Promise<void> {
    if (this.cronLocks.get(taskId)) {
      console.warn(`🔒 Task "${taskId}" is already running. Skipping execution.`);
      return;
    }

    console.info(`🔓 Acquiring lock for task "${taskId}".`);
    this.cronLocks.set(taskId, true);

    try {
      await task();
      console.info(`✅ Task "${taskId}" completed successfully.`);
    } catch (error) {
      console.error(`❌ Task "${taskId}" failed. Error: ${(error as Error).message}`);
    } finally {
      console.info(`🔓 Releasing lock for task "${taskId}".`);
      this.cronLocks.set(taskId, false);
    }
  }

  deleteJob(taskId: string): void {
    const job = this.jobs.get(taskId);

    if (job) {
      job.stop();
      this.jobs.delete(taskId);
      this.cronLocks.delete(taskId);
      console.info(`🗑️ Job ${taskId} deleted.`);
    }
  }
}
