import moment from "moment-timezone";

export const getLocalizedTime = (date: Date, timeZone: string): string => {
  return moment(date).tz(timeZone).format("YYYY-MM-DD HH:mm:ss");
};
