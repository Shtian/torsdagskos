const OSLO_TIME_ZONE = 'Europe/Oslo';
const MS_PER_MINUTE = 60 * 1000;

function getOsloOffsetMinutes(at: Date): number {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: OSLO_TIME_ZONE,
    timeZoneName: 'shortOffset',
  }).formatToParts(at);

  const offsetValue = formatted.find(
    (part) => part.type === 'timeZoneName',
  )?.value;

  if (!offsetValue) {
    throw new Error('Missing Oslo timezone offset.');
  }

  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(offsetValue);
  if (!match) {
    throw new Error(`Unexpected Oslo timezone offset format: ${offsetValue}`);
  }

  const sign = match[1] === '+' ? 1 : -1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] || '0');

  return sign * (hours * 60 + minutes);
}

export function parseOsloDateTimeInput(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    throw new Error('Invalid date/time input.');
  }

  const naiveUtc = Date.UTC(year, month - 1, day, hours, minutes);

  const firstOffset = getOsloOffsetMinutes(new Date(naiveUtc));
  let resolvedUtc = naiveUtc - firstOffset * MS_PER_MINUTE;

  // Re-resolve once to handle DST boundary transitions correctly.
  const secondOffset = getOsloOffsetMinutes(new Date(resolvedUtc));
  if (secondOffset !== firstOffset) {
    resolvedUtc = naiveUtc - secondOffset * MS_PER_MINUTE;
  }

  return new Date(resolvedUtc);
}
