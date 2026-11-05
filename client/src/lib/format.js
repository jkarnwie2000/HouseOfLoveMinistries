const moneyFormatters = {};

export function money(cents, currency = 'usd') {
  const key = currency.toUpperCase();
  moneyFormatters[key] ||= new Intl.NumberFormat('en-US', { style: 'currency', currency: key });
  return moneyFormatters[key].format((cents || 0) / 100);
}

export const formatDate = (iso, opts = { dateStyle: 'long' }) => new Date(iso).toLocaleDateString('en-US', opts);
export const formatDateTime = (iso) => new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
export const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export function dateParts(iso) {
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    day: d.getDate(),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
  };
}

export function timeRange(start, end) {
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}

export const titleCase = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Builds a downloadable iCalendar file for an event. */
export function downloadIcs(event) {
  const stamp = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s) => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const end = event.endDate || new Date(new Date(event.startDate).getTime() + 2 * 3600 * 1000).toISOString();
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//House of Love International Ministries//Events//EN', 'BEGIN:VEVENT',
    `UID:${event.id}-${stamp(event.startDate)}@houseoflove`, `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.startDate)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(event.title)}`, `DESCRIPTION:${esc(event.description)}`, `LOCATION:${esc(event.location)}`,
    /^every sunday/i.test(event.recurrence) ? 'RRULE:FREQ=WEEKLY;BYDAY=SU' : '',
    /^every wednesday/i.test(event.recurrence) ? 'RRULE:FREQ=WEEKLY;BYDAY=WE' : '',
    /^every friday/i.test(event.recurrence) ? 'RRULE:FREQ=WEEKLY;BYDAY=FR' : '',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean);
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
