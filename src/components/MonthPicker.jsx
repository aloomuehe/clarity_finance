import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MonthPicker({ selectedMonth, onSelectMonth, monthLabel }) {
  const [isOpen, setIsOpen] = useState(false);
  const [year, setYear] = useState(() => parseInt(selectedMonth.split('-')[0], 10));

  const handleOpen = () => {
    setYear(parseInt(selectedMonth.split('-')[0], 10));
    setIsOpen(prev => !prev);
  };

  const handleSelect = (monthStr) => {
    onSelectMonth(monthStr);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={handleOpen} 
        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 transition-colors shadow-2xs cursor-pointer"
        aria-label="Select month"
      >
        <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span>
          {monthLabel(selectedMonth, { month: 'short', year: 'numeric' })}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true"></div>
          <div className="absolute top-full right-0 mt-2 p-3.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 z-50 w-64 max-w-[calc(100vw-1.5rem)] animate-popover-in origin-top-right">
            <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <button 
                type="button"
                onClick={() => setYear(y => y - 1)} 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                aria-label="Previous year"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">{year}</span>
              <button 
                type="button"
                onClick={() => setYear(y => y + 1)} 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                aria-label="Next year"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {MONTH_NAMES.map((m, i) => {
                const monthStr = `${year}-${(i + 1).toString().padStart(2, '0')}`;
                const isSelected = selectedMonth === monthStr;
                return (
                  <button 
                    key={m} 
                    type="button"
                    onClick={() => handleSelect(monthStr)}
                    className={`py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-600 text-white font-semibold shadow-2xs' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
