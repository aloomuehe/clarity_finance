import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayStr } from '../utils/dates';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const parseDateParts = (str) => {
  if (!str || typeof str !== 'string') return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1; // 0-indexed
  const day = Number(parts[2]);
  if (!year || Number.isNaN(month) || !day) return null;
  return { year, month, day };
};

const formatDateParts = (year, month, day) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export default function DatePicker({
  value = '',
  onChange,
  name = 'date',
  placeholder = 'YYYY-MM-DD',
  required = false,
  disabled = false,
  className = '',
  min,
  max,
  align = 'left',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Derive initial calendar view from current value or today
  const todayStr = getTodayStr();
  const initialParts = parseDateParts(value) || parseDateParts(todayStr);

  const [viewYear, setViewYear] = useState(initialParts?.year || 2026);
  const [viewMonth, setViewMonth] = useState(initialParts?.month ?? 9);
  const [openUpward, setOpenUpward] = useState(false);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      const parts = parseDateParts(value) || parseDateParts(todayStr);
      if (parts) {
        setViewYear(parts.year);
        setViewMonth(parts.month);
      }
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Adjust open direction based on viewport space
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // Calendar height is approx 290px
      if (spaceBelow < 310 && rect.top > 310) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  // Handle click outside and Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Calendar grid construction (Timezone-safe pure date arithmetic)
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonthDays = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push({
      year: viewMonth === 0 ? viewYear - 1 : viewYear,
      month: viewMonth === 0 ? 11 : viewMonth - 1,
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
    });
  }

  const currentMonthDays = [];
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    currentMonthDays.push({
      year: viewYear,
      month: viewMonth,
      day: d,
      isCurrentMonth: true,
    });
  }

  const totalCells = prevMonthDays.length + currentMonthDays.length;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  const nextMonthDays = [];
  for (let d = 1; d <= remainingCells; d++) {
    nextMonthDays.push({
      year: viewMonth === 11 ? viewYear + 1 : viewYear,
      month: viewMonth === 11 ? 0 : viewMonth + 1,
      day: d,
      isCurrentMonth: false,
    });
  }

  const allCells = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSelectDay = (cell) => {
    const dateStr = formatDateParts(cell.year, cell.month, cell.day);
    if (min && dateStr < min) return;
    if (max && dateStr > max) return;

    if (onChange) {
      onChange({ target: { name, value: dateStr } });
    }
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    if (onChange) {
      onChange({ target: { name, value: todayStr } });
    }
    const parts = parseDateParts(todayStr);
    if (parts) {
      setViewYear(parts.year);
      setViewMonth(parts.month);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    if (onChange) {
      onChange({ target: { name, value: '' } });
    }
    setIsOpen(false);
  };

  const monthYearLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Input */}
      <div className="relative w-full">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
          <Calendar className="w-3.5 h-3.5" />
        </span>
        <input
          type="text"
          name={name}
          value={value || ''}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly
          onClick={toggleOpen}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
              e.preventDefault();
              toggleOpen();
            }
          }}
          className={`w-full h-9 pl-9 pr-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer select-none font-medium tabular-nums ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${className}`}
        />
      </div>

      {/* Integrated Calendar Popover */}
      {isOpen && (
        <div
          className={`absolute ${openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} ${
            align === 'right' ? 'right-0' : 'left-0'
          } p-3.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 z-50 w-64 max-w-[calc(100vw-2rem)] animate-popover-in origin-top`}
          role="dialog"
          aria-label="Date Picker"
        >
          {/* Calendar Header with Navigation */}
          <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
              {monthYearLabel}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">
            {WEEKDAYS.map(day => (
              <div key={day} className="py-0.5">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {allCells.map((cell, idx) => {
              const cellDateStr = formatDateParts(cell.year, cell.month, cell.day);
              const isSelected = value === cellDateStr;
              const isToday = todayStr === cellDateStr;
              const isDisabled = (min && cellDateStr < min) || (max && cellDateStr > max);

              let buttonClass = 'h-7 w-7 mx-auto flex items-center justify-center rounded-lg text-xs transition-colors cursor-pointer ';

              if (isDisabled) {
                buttonClass += 'opacity-25 cursor-not-allowed text-slate-400 ';
              } else if (isSelected) {
                buttonClass += 'bg-blue-600 text-white font-bold shadow-2xs hover:bg-blue-700 ';
              } else if (isToday) {
                buttonClass += 'border border-blue-500/70 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-950/40 ';
              } else if (cell.isCurrentMonth) {
                buttonClass += 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium ';
              } else {
                buttonClass += 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-400 ';
              }

              return (
                <button
                  key={`${cellDateStr}-${idx}`}
                  type="button"
                  onClick={() => !isDisabled && handleSelectDay(cell)}
                  disabled={isDisabled}
                  className={buttonClass}
                  aria-label={cellDateStr}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Calendar Actions: Today & Clear */}
          <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Today
            </button>
            {!required && (
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
