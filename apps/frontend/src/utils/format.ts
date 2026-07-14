export function formatPrice(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SY' : locale === 'fr' ? 'fr-MA' : 'en-MA', {
    style: 'currency',
    currency: 'SYP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY' : locale === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatShortDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY' : locale === 'fr' ? 'fr-FR' : 'en-GB', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
