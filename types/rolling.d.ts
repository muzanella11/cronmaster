export interface RollingJobOptions {
  timeouts: NodeJS.Timeout[];
  nextTimestamp: number;
  timeZone: string;
  stop: () => void;
  nextDate: () => Date;
}
