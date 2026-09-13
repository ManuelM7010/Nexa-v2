export function formatMoney(
  cents: number,
  currencySymbol = '$',
  showSign = false
): string {
  const isNegative = cents < 0;
  const absDollars = (Math.abs(cents) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (showSign && cents > 0) {
    return `+${currencySymbol}${absDollars}`;
  }
  if (isNegative) {
    return `-${currencySymbol}${absDollars}`;
  }
  return `${currencySymbol}${absDollars}`;
}

export function dollarsToCents(dollars: number | string): number {
  if (typeof dollars === 'string') {
    const clean = dollars.replace(/[^0-9.-]+/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : Math.round(num * 100);
  }
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const MONTH_NAMES_SHORT_ES = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC',
];

export const DAY_NAMES_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export function formatDateEs(dateStr: string, options?: { withYear?: boolean; withDayName?: boolean }): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayName = DAY_NAMES_ES[dateObj.getDay()];
  const monthName = MONTH_NAMES_ES[m - 1];

  if (options?.withDayName) {
    return `${dayName}, ${d} de ${monthName}${options.withYear ? ` de ${y}` : ''}`;
  }
  return `${d} ${monthName.substring(0, 3)}${options?.withYear ? ` ${y}` : ''}`;
}

export function getTodayDateStr(): string {
  // Respect user context: September 12, 2026 or current browser time if simulated
  const now = new Date();
  // Check if year matches 2026 as in the scenario
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const ry = dt.getFullYear();
  const rm = String(dt.getMonth() + 1).padStart(2, '0');
  const rd = String(dt.getDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
}

export function diffDays(dateA: string, dateB: string): number {
  const [ya, ma, da] = dateA.split('-').map(Number);
  const [yb, mb, db] = dateB.split('-').map(Number);
  const dtA = new Date(ya, ma - 1, da).getTime();
  const dtB = new Date(yb, mb - 1, db).getTime();
  return Math.round((dtA - dtB) / (1000 * 60 * 60 * 24));
}
