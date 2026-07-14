import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface DatePickerCalendarProps {
  value: string;            // YYYY-MM-DD
  onChange: (date: string) => void;
  highlightedDates?: string[];  // YYYY-MM-DD dates with trips
  minDate?: string;
  name?: string;
}

const AR_DAYS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']; // Sun–Sat
const AR_MONTHS = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];

function toYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function DatePickerCalendar({
  value,
  onChange,
  highlightedDates = [],
  minDate,
  name,
}: DatePickerCalendarProps) {
  const { t } = useTranslation();

  const parseValue = (): [number, number, number] => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return [y, m - 1, d];
    }
    const now = new Date();
    return [now.getFullYear(), now.getMonth(), now.getDate()];
  };

  const [selYear, selMonth] = parseValue();
  const [viewYear, setViewYear] = useState(selYear);
  const [viewMonth, setViewMonth] = useState(selMonth);
  const [inputText, setInputText] = useState(value);

  const today = new Date();
  const todayStr = toYMD(today.getFullYear(), today.getMonth(), today.getDate());
  const highlightSet = new Set(highlightedDates);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }, [viewMonth]);

  const handleDayClick = (day: number) => {
    const dateStr = toYMD(viewYear, viewMonth, day);
    if (minDate && dateStr < minDate) return;
    onChange(dateStr);
    setInputText(dateStr);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputText(raw);
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) {
        onChange(raw);
        setViewYear(parsed.getFullYear());
        setViewMonth(parsed.getMonth());
      }
    }
  };

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="w-full select-none rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Text input */}
      <div className="border-b border-slate-100 px-4 pt-3 pb-2">
        <label className="mb-1 block text-xs font-medium text-slate-500">
          {t('search.date')}
        </label>
        <input
          type="text"
          name={name}
          value={inputText}
          onChange={handleInputChange}
          placeholder="YYYY-MM-DD"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <button
          type="button"
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="الشهر التالي"
        >
          ‹
        </button>
        <span className="font-semibold text-slate-800">
          {AR_MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="الشهر السابق"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-2 pb-1">
        {AR_DAYS.map((d) => (
          <div key={d} className="py-1 text-center text-xs font-medium text-slate-400">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1 px-2 pb-3">
        {cells.map((day, idx) => {
          if (day === null) return <div key={idx} />;

          const dateStr = toYMD(viewYear, viewMonth, day);
          const isSelected = dateStr === value;
          const isToday = dateStr === todayStr;
          const hasTrip = highlightSet.has(dateStr);
          const isPast = minDate ? dateStr < minDate : false;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleDayClick(day)}
              disabled={isPast}
              className={[
                'relative mx-auto flex h-9 w-9 flex-col items-center justify-center rounded-xl text-sm transition',
                isSelected
                  ? 'bg-emerald-500 font-bold text-white shadow-sm'
                  : isToday
                  ? 'border border-emerald-300 font-semibold text-emerald-700'
                  : isPast
                  ? 'cursor-not-allowed text-slate-300'
                  : 'text-slate-700 hover:bg-emerald-50',
              ].join(' ')}
            >
              {day}
              {hasTrip && !isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-emerald-500" />
              )}
              {hasTrip && isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>

      {highlightedDates.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-2 text-center text-xs text-slate-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />{' '}
          {t('search.daysWithTrips')}
        </div>
      )}
    </div>
  );
}
