import type { Event } from "./types";
const escape = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
const stamp = (s: string) =>
  new Date(s)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
function fold(s: string) {
  let lines = "",
    line = "",
    bytes = 0;
  for (const ch of s) {
    const len = new TextEncoder().encode(ch).length;
    if (bytes + len > 74) {
      lines += line + "\r\n";
      line = " ";
      bytes = 1;
    }
    line += ch;
    bytes += len;
  }
  return lines + line;
}
export function calendar(e: Event) {
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Ta Rolando//Agenda//PT-BR",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${e.id}@ta-rolando`,
      `DTSTAMP:${stamp(new Date().toISOString())}`,
      `DTSTART:${stamp(e.starts_at)}`,
      ...(e.ends_at ? [`DTEND:${stamp(e.ends_at)}`] : []),
      `SUMMARY:${escape(e.title)}`,
      `DESCRIPTION:${escape(e.description)}`,
      `LOCATION:${escape(e.venue_name + " - " + e.address)}`,
      `STATUS:${e.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .map(fold)
      .join("\r\n") + "\r\n"
  );
}
