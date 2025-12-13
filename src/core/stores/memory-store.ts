import {StoredJob} from "../../../types/stored";

export class MemoryStore {
  private jobs: Record<string, StoredJob> = {};

  saveJob(job: StoredJob): void {
    this.jobs[job.id] = job;
  }

  getJob(id: string): StoredJob | undefined {
    return this.jobs[id];
  }

  deleteJob(id: string): void {
    delete this.jobs[id];
  }

  listJobs(): StoredJob[] {
    return Object.values(this.jobs);
  }
}
