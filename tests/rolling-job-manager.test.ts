import moment from "moment-timezone";
import {RollingJobManager} from "../src/core/jobs/rolling-job-manager";

describe("RollingJobManager", () => {
  let rollingJobManager: RollingJobManager;

  beforeEach(() => {
    jest.useFakeTimers();
    rollingJobManager = new RollingJobManager();
  });

  afterEach(() => {
    rollingJobManager.cleanup();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("should create and schedule a rolling job", () => {
    const mockTask = jest.fn(async () => {});
    rollingJobManager.createRollingJob("test-job", 1, mockTask);

    const job = rollingJobManager["rollingJobs"].get("test-job");
    expect(job).toBeDefined();
    expect(job?.nextTimestamp).toBeGreaterThan(Date.now());
  });

  it("should execute rolling job task immediately when runImmediately is true", () => {
    const mockTask = jest.fn(async () => {});
    rollingJobManager.createRollingJob("test-job", 1, mockTask, "UTC", true);

    expect(mockTask).toHaveBeenCalled();
  });

  it("should delete an existing rolling job", () => {
    const mockTask = jest.fn(async () => {});
    rollingJobManager.createRollingJob("test-job", 1, mockTask);

    rollingJobManager.deleteRollingJob("test-job");

    expect(rollingJobManager["rollingJobs"].has("test-job")).toBe(false);
  });

  it("should use locking to prevent duplicate executions", async () => {
    const mockTask = jest.fn();

    rollingJobManager["runWithLock"]("test-job", mockTask);
    await rollingJobManager["runWithLock"]("test-job", mockTask);

    expect(mockTask).toHaveBeenCalledTimes(1);
  });

  it("should handle test mode correctly", () => {
    const mockTask = jest.fn(async () => {});
    const now = moment.tz("UTC");
    jest.spyOn(moment, "tz").mockImplementation(() => now);

    rollingJobManager.createRollingJob("test-job", 1, mockTask, "UTC", false, true, 10);

    const job = rollingJobManager["rollingJobs"].get("test-job");
    expect(job?.nextTimestamp).toBe(now.add(10, "minutes").valueOf());

    jest.restoreAllMocks();
  });

  it("should schedule next job correctly and skip invalid firstRun", () => {
    const mockTask = jest.fn(async () => {
      return new Promise<void>((resolve) => {
        setTimeout(resolve, 500);
      });
    });

    rollingJobManager.createRollingJob("test-job", -1, mockTask);
    expect(rollingJobManager["rollingJobs"].has("test-job")).toBe(false);
  });

  it("should warn when creating a rolling job with invalid intervalDays", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const mockTask = jest.fn(async () => {});

    rollingJobManager.createRollingJob("test-job", 0, mockTask);

    expect(rollingJobManager["rollingJobs"].has("test-job")).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("⚠️ Invalid intervalDays"));
    consoleSpy.mockRestore();
  });

  it("should show rolling jobs successfully", () => {
    const mockTask = jest.fn(async () => {});
    rollingJobManager.createRollingJob("test-job", 1, mockTask);

    const consoleSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    const consoleTableSpy = jest.spyOn(console, "table").mockImplementation(() => {});

    rollingJobManager.showRollingJobs();

    expect(console.info).toHaveBeenCalledWith("📅 Existing rolling jobs:");
    expect(console.table).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "test-job",
        }),
      ]),
    );

    consoleSpy.mockRestore();
    consoleTableSpy.mockRestore();
  });
});
