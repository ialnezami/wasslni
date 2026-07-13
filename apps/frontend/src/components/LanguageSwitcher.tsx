import { useTranslation } from 'react-i18next';
import { supportedLocales, setDocumentDirection, type SupportedLocale } from '@/i18n';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleChange = (locale: SupportedLocale) => {
    void i18n.changeLanguage(locale);
    setDocumentDirection(locale);
  };

  return (
    <select
      value={i18n.language}
      onChange={(e) => handleChange(e.target.value as SupportedLocale)}
      className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm"
      aria-label="Language"
    >
      {supportedLocales.map((locale) => (
        <option key={locale} value={locale}>
          {locale.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
