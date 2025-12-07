export interface StoredJob {
  id: string;
  cron: string;
  timezone?: string;
}
