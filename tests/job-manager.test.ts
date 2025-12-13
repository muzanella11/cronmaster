import {JobManager} from "../src";

jest.mock("./../src/utils", () => ({
  toHumanReadable: jest.fn(() => "Every minute"),
}));

describe("JobManager", () => {
  let jobManager: JobManager;

  beforeEach(() => {
    jobManager = new JobManager();
  });

  afterEach(() => {
    jobManager.cleanup();
    jest.restoreAllMocks();
  });

  it("should create and start a job", () => {
    const mockTask = jest.fn(async () => {});
    jobManager.createJob("test-job", "* * * * *", mockTask);

    const job = jobManager["jobs"].get("test-job");
    expect(job).toBeDefined();
    expect(job).toBeTruthy();
  });

  it("should re-create a job if taskId already exists", () => {
    const mockTask = jest.fn(async () => {});
    jobManager.createJob("test-job", "* * * * *", mockTask);

    const deleteSpy = jest.spyOn(jobManager, "deleteJob");
    jobManager.createJob("test-job", "*/5 * * * *", mockTask);

    const job = jobManager["jobs"].get("test-job");
    expect(job).toBeDefined();
    expect(job?.cronTime?.source).toBe("*/5 * * * *");
    expect(deleteSpy).toHaveBeenCalledWith("test-job");
  });

  it("should throw an error when starting a non-existent job", () => {
    expect(() => jobManager.startJob("non-existent-job")).toThrow(`Job with ID "non-existent-job" does not exist`);
  });

  it("should delete an existing job", () => {
    const mockTask = jest.fn(async () => {});
    jobManager.createJob("test-job", "* * * * *", mockTask);

    jobManager.deleteJob("test-job");

    expect(jobManager["jobs"].has("test-job")).toBe(false);
  });

  it("should clean up all jobs", () => {
    const mockTask1 = jest.fn(async () => {});
    const mockTask2 = jest.fn(async () => {});

    jobManager.createJob("job-1", "* * * * *", mockTask1);
    jobManager.createJob("job-2", "*/2 * * * *", mockTask2);

    const stopSpy = jest.spyOn(jobManager, "deleteJob");

    jobManager.cleanup();

    expect(jobManager["jobs"].size).toBe(0);
    expect(stopSpy).toHaveBeenCalledWith("job-1");
    expect(stopSpy).toHaveBeenCalledWith("job-2");
  });

  it("should show all jobs", () => {
    const mockTask1 = jest.fn(async () => {});
    const mockTask2 = jest.fn(async () => {});

    jobManager.createJob("job-1", "* * * * *", mockTask1);
    jobManager.createJob("job-2", "*/2 * * * *", mockTask2);

    const consoleTableSpy = jest.spyOn(console, "table").mockImplementation(() => {});
    const consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {});

    jobManager.showAllJobs();

    expect(console.info).toHaveBeenCalledWith("📅 Existing cron jobs:");
    expect(console.table).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          "Job ID": "job-1",
          "Cron Expression": "* * * * *",
          "Time Zone": "UTC",
        }),
        expect.objectContaining({
          "Job ID": "job-2",
          "Cron Expression": "*/2 * * * *",
          "Time Zone": "UTC",
        }),
      ]),
    );

    consoleTableSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  it("should utilize locking to prevent duplicate executions", async () => {
    const mockTask = jest.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    const firstRun = jobManager["runWithLock"]("test-job", mockTask);
    const secondRun = jobManager["runWithLock"]("test-job", mockTask);
    await Promise.all([firstRun, secondRun]);

    expect(mockTask).toHaveBeenCalledTimes(1);
  });

  it("should run a job immediately when runImmediately is true", async () => {
    const mockTask = jest.fn(async () => {});
    jobManager.createJob("test-job", "* * * * *", mockTask, "UTC", true);

    expect(mockTask).toHaveBeenCalled();
  });

  it("should handle job failure gracefully", async () => {
    const failingTask = jest.fn(async () => {
      throw new Error("Task failed");
    });

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await jobManager["runWithLock"]("failing-job", failingTask);

    expect(failingTask).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('❌ Task "failing-job" failed.'));

    consoleErrorSpy.mockRestore();
  });

  it("should handle a human-readable cron description", () => {
    const cronExpr = "* * * * *";
    const description = jobManager.cronDescription(cronExpr);

    expect(description).toBe("Every minute");
  });
});
