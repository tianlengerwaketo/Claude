function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Formats a detection timestamp as "Hoy 14:32", "Ayer 09:05" or "04/09 21:10". */
export function formatDetectedAt(timestampMs: number): string {
  const date = new Date(timestampMs);
  const now = new Date();
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  if (isSameDay(date, now)) return `Hoy ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return `Ayer ${time}`;

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${time}`;
}
