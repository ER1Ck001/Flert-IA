// Datas no fuso do produto (Brasil). O servidor (Vercel) roda em UTC, então nada aqui
// usa o fuso local do processo.

export const APP_TIMEZONE = "America/Sao_Paulo";

function zonedParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour"), mi: get("minute"), s: get("second") };
}

/** Diferença (ms) entre o relógio local do fuso e UTC no instante dado. */
function offsetMs(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** "YYYY-MM-DD" do dia local. */
export function getDayKey(now: Date = new Date(), timeZone: string = APP_TIMEZONE): string {
  const { y, m, d } = zonedParts(now, timeZone);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Instante (UTC) da meia-noite local do dia de `now`. */
export function startOfDay(now: Date = new Date(), timeZone: string = APP_TIMEZONE): Date {
  const { y, m, d } = zonedParts(now, timeZone);
  const guess = Date.UTC(y, m - 1, d);
  return new Date(guess - offsetMs(new Date(guess), timeZone));
}

/** Próxima meia-noite local — quando o limite diário reinicia. */
export function nextResetAt(now: Date = new Date(), timeZone: string = APP_TIMEZONE): Date {
  const start = startOfDay(now, timeZone);
  // +26h garante cair no dia seguinte mesmo em dias de 23/25h; depois normaliza.
  return startOfDay(new Date(start.getTime() + 26 * 60 * 60 * 1000), timeZone);
}
