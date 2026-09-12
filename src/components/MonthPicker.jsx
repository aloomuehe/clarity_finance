import { useState } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';

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
        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dk-bg-slate-800 dk-hover-bg-slate-700 px-4 py-2 rounded-xl transition-all duration-300 ease-in-out cursor-pointer hover:shadow-sm"
      >
        <Calendar className="w-4 h-4 text-indigo-500" />
        <span className="font-bold text-slate-800 dk-text-slate-200">
          {monthLabel(selectedMonth, { month: 'short', year: 'numeric' })}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full right-0 sm:left-0 mt-2 p-4 bg-white dk-bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dk-border-slate-700 z-50 w-64 animate-fade-in-up origin-top-left">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200 dk-border-slate-700">
              <button 
                onClick={() => setYear(y => y - 1)} 
                className="p-1 hover:bg-slate-100 dk-hover-bg-slate-700 rounded-lg transition-colors text-slate-700 dk-text-slate-200"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <span className="font-bold text-lg text-slate-900 dk-text-white">{year}</span>
              <button 
                onClick={() => setYear(y => y + 1)} 
                className="p-1 hover:bg-slate-100 dk-hover-bg-slate-700 rounded-lg transition-colors text-slate-700 dk-text-slate-200"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MONTH_NAMES.map((m, i) => {
                const monthStr = `${year}-${(i + 1).toString().padStart(2, '0')}`;
                const isSelected = selectedMonth === monthStr;
                return (
                  <button 
                    key={m} 
                    onClick={() => handleSelect(monthStr)}
                    className={`py-2 rounded-xl text-sm font-semibold transition-colors ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-indigo-50 dk-hover-bg-indigo-900-30 text-slate-700 dk-text-slate-300'}`}
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
