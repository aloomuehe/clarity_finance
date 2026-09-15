export const getTodayStr = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const sanitizeDate = (value, fallback) => {
  if (typeof value !== 'string') return fallback;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return fallback;
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return fallback;
  // Reject nonsense years (models often answer with training-era dates)
  const year = Number(match[1]);
  const nowYear = new Date().getFullYear();
  if (year < nowYear - 5 || year > nowYear + 1) return fallback;
  return value;
};

export const shiftDate = (baseStr, days) => {
  const d = new Date(`${baseStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const pad2 = (n) => String(n).padStart(2, '0');

// Timezone-safe. "2026-09-03" -> "2026-09" without ever touching UTC, and Date
// objects are read in LOCAL time. The old version used toISOString(), which in
// IST (UTC+5:30) pushed local month starts back into the previous month.
export const getMonthString = (date) => {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 7);
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return '';
  return `${parsedDate.getFullYear()}-${pad2(parsedDate.getMonth() + 1)}`;
};

// "2026-09" -> local Date for the 1st of that month (never UTC-shifted).
export const monthToDate = (monthStr) => {
  const [y, m] = String(monthStr || '').split('-').map(Number);
  if (!y || !m) return new Date();
  return new Date(y, m - 1, 1);
};

export const monthLabel = (monthStr, opts = { month: 'long', year: 'numeric' }) =>
  monthToDate(monthStr).toLocaleDateString(undefined, opts);

// Shift a "YYYY-MM" string by n months, arithmetic only.
export const shiftMonth = (monthStr, n) => {
  const [y, m] = String(monthStr || '').split('-').map(Number);
  if (!y || !m || Number.isNaN(y) || Number.isNaN(m)) return monthStr || '';
  const d = new Date(y, (m - 1) + n, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};
