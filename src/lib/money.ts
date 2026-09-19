export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "ZAR", "AED"] as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  AUD: "A$",
  CAD: "C$",
  ZAR: "R",
  AED: "د.إ",
};

// e.g. "INR (₹)" for the currency dropdown.
export const currencyLabel = (code: string) =>
  CURRENCY_SYMBOLS[code] ? `${code} (${CURRENCY_SYMBOLS[code]})` : code;

export type QuoteItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  tax: number;
};

export const money = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export const lineTotal = (item: QuoteItem) => item.quantity * item.rate;

export const quoteTotals = (items: QuoteItem[], discount: number) => {
  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const tax = items.reduce((sum, item) => sum + (lineTotal(item) * item.tax) / 100, 0);
  const total = Math.max(0, subtotal + tax - discount);
  return { subtotal, tax, total };
};

export const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};
