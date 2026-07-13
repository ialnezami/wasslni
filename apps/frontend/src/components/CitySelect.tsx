import { useTranslation } from 'react-i18next';
import type { City } from '@wasslni/shared-types';
import { getCityName } from '@/data/demo';

interface CitySelectProps {
  cities: City[];
  label: string;
  placeholder: string;
  error?: string;
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function CitySelect({
  cities,
  label,
  placeholder,
  error,
  name,
  defaultValue = '',
  value,
  onChange,
}: CitySelectProps) {
  const { i18n } = useTranslation();
  const isControlled = value !== undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        {...(isControlled
          ? { value, onChange: (e) => onChange?.(e.target.value) }
          : { defaultValue })}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${
          error ? 'border-red-300' : 'border-slate-200'
        }`}
      >
        <option value="">{placeholder}</option>
        {cities.map((city) => (
          <option key={city._id} value={city._id}>
            {getCityName(city, i18n.language)}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
