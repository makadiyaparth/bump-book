/* ============================================
   General Utility Functions
   ============================================ */

/**
 * Generate a UUID v4.
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get current ISO 8601 timestamp.
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Get today's date as YYYY-MM-DD.
 */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format a date string or Date object to a human-readable format.
 * e.g. "Sep 24, 2026"
 */
export function formatDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date string or Date object to short format.
 * e.g. "Sep 24"
 */
export function formatDateShort(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string or Date object to relative time.
 * e.g. "Today", "Yesterday", "3 days ago", "Sep 20"
 */
export function formatRelativeDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDateShort(date);
}

/**
 * Get time-of-day greeting.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Convert camelCase key to snake_case for Sheet headers.
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case key to camelCase for TypeScript.
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert an object's keys from camelCase to snake_case.
 */
export function toSnakeKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    result[camelToSnake(key)] = obj[key];
  }
  return result;
}

/**
 * Convert an object's keys from snake_case to camelCase.
 */
export function toCamelKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    result[snakeToCamel(key)] = obj[key];
  }
  return result;
}

/**
 * Parse a numeric value from a sheet cell (could be empty string).
 */
export function parseNumber(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

/**
 * Parse a boolean from a sheet cell.
 */
export function parseBoolean(value: string | undefined): boolean {
  return value?.toUpperCase() === 'TRUE';
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Group an array of items by a key.
 */
export function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Format a numeric or string amount as currency in INR (₹).
 * e.g. 150 -> "₹150", 1500 -> "₹1,500", 150000 -> "₹1,50,000"
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currencySymbol = '₹'
): string {
  if (amount === null || amount === undefined || amount === '') return '';
  const num =
    typeof amount === 'number'
      ? amount
      : parseFloat(String(amount).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return '';

  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${currencySymbol}${formatted}`;
}

