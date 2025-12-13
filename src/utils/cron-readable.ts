import cronstrue from "cronstrue";

export function toHumanReadable(cronExpression: string): string {
  try {
    return cronstrue.toString(cronExpression);
  } catch (err) {
    return "Invalid Cron Expression";
  }
}
