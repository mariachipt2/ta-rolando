import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
export const TZ = "America/Sao_Paulo";
export function day(d: Date | string = new Date()) {
  return formatInTimeZone(d, TZ, "yyyy-MM-dd");
}
export function displayDate(d: string) {
  return formatInTimeZone(d, TZ, "dd/MM/yyyy · HH:mm");
}
export function localInput(d: string) {
  return formatInTimeZone(d, TZ, "yyyy-MM-dd'T'HH:mm");
}
export function toISO(d: string) {
  return fromZonedTime(d, TZ).toISOString();
}
export function upcoming(
  e: { starts_at: string; ends_at: string | null },
  now = new Date(),
) {
  return new Date(e.ends_at || e.starts_at) > now;
}
export function inPeriod(
  start: string,
  end: string | null,
  period: string,
  now = new Date(),
) {
  const today = day(now);
  const base = new Date(today + "T12:00:00Z");
  const plus = (n: number) =>
    new Date(base.getTime() + n * 86400000).toISOString().slice(0, 10);
  let lo = today,
    hi = today;
  if (period === "tomorrow") lo = hi = plus(1);
  if (period === "week") hi = plus(6);
  if (period === "weekend") {
    const w = base.getUTCDay();
    const n = w === 0 ? -2 : 5 - w;
    lo = plus(n);
    hi = plus(n + 2);
  }
  return day(start) <= hi && day(end || start) >= lo;
}
