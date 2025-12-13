import moment from "moment-timezone";
import {RollingJobOptions} from "../../../types/rolling";

// Node.js maximum safe delay for setTimeout
const MAX_DELAY = 2147483647;

export class RollingJobManager {
  private rollingJobs: Map<string, RollingJobOptions> = new Map();
  private rollingLocks: Map<string, boolean> = new Map();

  createRollingJob(
    taskId: string,
    intervalDays: number,
    task: () => Promise<void>,
    timeZone: string = "UTC",
    runImmediately: boolean = false,
    isTestMode: boolean = false,
    intervalTestInMinutes: number = 1,
  ): void {
    // Delete previous job if exists
    if (this.rollingJobs.has(taskId)) {
      this.deleteRollingJob(taskId);
    }

    // Validate interval
    if (!Number.isFinite(intervalDays) || intervalDays <= 0) {
      console.warn(`⚠️ Invalid intervalDays (${intervalDays}) for rolling job ${taskId}. Must be > 0.`);
      return;
    }

    const now = moment.tz(timeZone);

    // ===== Determine first run =====
    let firstRun = now.clone().add(intervalDays, "days").startOf("day");

    if (isTestMode) {
      console.info(`🧪 Test mode: scheduling first run of ${taskId} in ${intervalTestInMinutes} minutes`);
      firstRun = now.clone().add(intervalTestInMinutes, "minutes");
    }

    if (!firstRun.isAfter(now)) {
      console.warn(`⏭️ First run time (${firstRun.format()}) has already passed. Skipping job creation.`);
      return;
    }

    const firstDelay = firstRun.diff(now);
    if (firstDelay <= 0) {
      console.warn(`⚠️ Computed first delay is invalid (${firstDelay}).`);
      return;
    }

    console.info(
      `🕒 Rolling job ${taskId} created. First run: ${firstRun.format("YYYY-MM-DD HH:mm:ss z")} | TZ: ${timeZone}`,
    );

    // ===== Helper to execute task with lock =====
    const runTask = async () => {
      return this.runWithLock(taskId, async () => {
        console.info(`🟢 Rolling job ${taskId} executed`);
        await task();
        this.showRollingJobs();
      });
    };

    // ===== Schedule next run safely =====
    const scheduleNextRun = (state: RollingJobOptions) => {
      let nextMoment = moment.tz(state.timeZone).add(intervalDays, "days").startOf("day");

      if (isTestMode) {
        console.info(`🧪 Test mode: scheduling next run of ${taskId} in ${intervalTestInMinutes} minutes`);
        nextMoment = moment.tz(state.timeZone).add(intervalTestInMinutes, "minutes");
      }

      state.nextTimestamp = nextMoment.valueOf();

      const scheduleChunk = () => {
        const remaining = state.nextTimestamp - Date.now();

        if (remaining <= 0) {
          runTask();
          return scheduleNextRun(state);
        }

        const chunkDelay = Math.min(MAX_DELAY, remaining);

        const timeoutHandle = setTimeout(scheduleChunk, chunkDelay);
        state.timeouts.push(timeoutHandle);
      };

      scheduleChunk();
    };

    // ===== Initial Rolling Job State =====
    const state: RollingJobOptions = {
      timeouts: [],
      nextTimestamp: firstRun.valueOf(),
      timeZone,
      stop: () => {
        state.timeouts.forEach((t) => clearTimeout(t));
        state.timeouts = [];
      },
      nextDate: () => new Date(state.nextTimestamp),
    };

    // ===== Schedule First Run =====
    const firstTimeout = setTimeout(
      async () => {
        await runTask();
        scheduleNextRun(state);
      },
      Math.min(firstDelay, MAX_DELAY),
    );

    state.timeouts.push(firstTimeout);

    this.rollingJobs.set(taskId, state);

    // Optional immediate run
    if (runImmediately) {
      console.info(`🟢 Immediate trigger for rolling job ${taskId}`);
      runTask();
    }

    this.showRollingJobs();
  }

  deleteRollingJob(taskId: string): void {
    const rollingJob = this.rollingJobs.get(taskId);
    if (rollingJob) {
      rollingJob.stop();
      this.rollingJobs.delete(taskId);
      this.rollingLocks.delete(taskId);
      console.info(`🗑️ Rolling job ${taskId} deleted.`);
    }
  }

  private async runWithLock(taskId: string, task: () => Promise<void>): Promise<void> {
    if (this.rollingLocks.get(taskId)) {
      console.warn(`🔒 Task "${taskId}" is already running. Skipping execution.`);
      return;
    }

    console.info(`🔓 Acquiring lock for task "${taskId}".`);
    this.rollingLocks.set(taskId, true);

    try {
      await task();
      console.info(`✅ Task "${taskId}" completed successfully.`);
    } catch (error) {
      console.error(`❌ Task "${taskId}" failed. Error: ${(error as Error).message}`);
    } finally {
      console.info(`🔓 Releasing lock for task "${taskId}".`);
      this.rollingLocks.set(taskId, false);
    }
  }

  showRollingJobs(): void {
    console.info("📅 Existing rolling jobs:");
    if (this.rollingJobs.size === 0) {
      console.info("📭 No rolling jobs found.");
      return;
    }

    const rows = Array.from(this.rollingJobs.entries()).map(([id, state]) => ({
      id,
      nextRun: moment(state.nextDate()).format("YYYY-MM-DD HH:mm:ss z"),
      timeZone: state.timeZone,
    }));

    console.table(rows);

    console.info(`🗂️ Total rolling jobs: ${this.rollingJobs.size}`);
    console.info(`⏭️ Next run IDs: ${rows.map((r) => r.id).join(", ")}`);
  }

  cleanup(): void {
    this.rollingJobs.forEach((job, id) => {
      job.stop();
      console.info(`🛑 Rolling job "${id}" has been stopped during cleanup.`);
    });

    this.rollingJobs.clear();
    this.rollingLocks.clear();
    console.info(`🧹 All rolling jobs have been cleaned up.`);
  }
}
