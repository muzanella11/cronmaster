import {StoredJob} from "../../../types/stored";
export declare class MemoryStore {
  private jobs;
  saveJob(job: StoredJob): void;
  getJob(id: string): StoredJob | undefined;
  deleteJob(id: string): void;
  listJobs(): StoredJob[];
}
