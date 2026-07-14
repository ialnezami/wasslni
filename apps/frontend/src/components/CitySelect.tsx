import { useEffect, useRef, useState } from 'react';
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

  const initialCity = cities.find((c) => c._id === (isControlled ? value : defaultValue));

  const [query, setQuery] = useState(initialCity ? getCityName(initialCity, i18n.language) : '');
  const [selectedId, setSelectedId] = useState(isControlled ? value : defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync controlled value changes
  useEffect(() => {
    if (isControlled) {
      const city = cities.find((c) => c._id === value);
      setSelectedId(value ?? '');
      setQuery(city ? getCityName(city, i18n.language) : '');
    }
  }, [value, cities, i18n.language, isControlled]);

  const filtered = query.trim()
    ? cities.filter((c) =>
        getCityName(c, i18n.language).includes(query) ||
        c.nameAr.includes(query) ||
        c.nameFr.toLowerCase().includes(query.toLowerCase()),
      )
    : cities;

  function select(city: City) {
    const name_ = getCityName(city, i18n.language);
    setQuery(name_);
    setSelectedId(city._id);
    onChange?.(city._id);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setSelectedId('');
    onChange?.('');
    setOpen(true);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      if (filtered[activeIndex]) select(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="block text-sm font-medium text-slate-700">{label}</label>

      {/* Hidden input carries the actual city ID for form submission */}
      <input type="hidden" name={name} value={selectedId} />

      <div className="relative">
        <input
          type="text"
          autoComplete="off"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${
            error ? 'border-red-300' : 'border-slate-200'
          }`}
        />

        {open && filtered.length > 0 && (
          <ul
            ref={listRef}
            className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            {filtered.map((city, idx) => (
              <li
                key={city._id}
                onMouseDown={() => select(city)}
                className={`cursor-pointer px-4 py-2.5 text-sm transition ${
                  idx === activeIndex
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                {getCityName(city, i18n.language)}
              </li>
            ))}
          </ul>
        )}

        {open && query.trim() && filtered.length === 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg">
            لا توجد مدينة مطابقة
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
