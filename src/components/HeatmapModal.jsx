import { Calendar, Settings, X, AlertCircle } from 'lucide-react';
import { getTodayStr, monthLabel } from '../utils/dates.js';

export default function HeatmapModal({
  open,
  onClose,
  selectedMonth,
  heatmapData,
  getHeatmapColor,
  formatMoney,
  heatmapDraft,
  updateHeatmapDraft,
  saveHeatmapThresholds,
  heatmapValidationError,
}) {
  if (!open) return null;

  const todayStr = getTodayStr();

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[70] flex items-center justify-center p-3 sm:p-4 overflow-y-auto overflow-x-hidden"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="heatmap-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-md sm:max-w-lg shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-fade-in-up my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0 truncate">
              <h2 id="heatmap-modal-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                Daily Spending Heatmap
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                {monthLabel(selectedMonth)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - strictly overflow-x-hidden to prevent any horizontal scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto overflow-x-hidden space-y-4 flex-1">
          {/* Calendar Grid */}
          <div>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5 text-center text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-0.5">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {heatmapData.map((d, i) => {
                if (d.empty) return <div key={i} className="aspect-square" />;
                const colorClass = getHeatmapColor(d.spent, d.dateStr);
                const isToday = d.dateStr === todayStr;

                // Tooltip horizontal alignment to prevent edge clipping & horizontal scroll
                const colIndex = i % 7;
                const tooltipAlignClass =
                  colIndex <= 1
                    ? 'left-0 translate-x-0'
                    : colIndex >= 5
                    ? 'right-0 translate-x-0'
                    : 'left-1/2 -translate-x-1/2';

                return (
                  <div
                    key={i}
                    className={`relative group aspect-square rounded-lg sm:rounded-xl ${colorClass} flex items-center justify-center cursor-pointer transition-all hover:scale-105 select-none shadow-2xs ${
                      isToday ? 'ring-2 ring-blue-600 dark:ring-blue-400 ring-offset-1 dark:ring-offset-slate-900' : ''
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-semibold tabular-nums">
                      {d.day}
                    </span>

                    {/* Edge-contained hover tooltip */}
                    <div
                      className={`absolute bottom-full mb-1.5 px-2 py-1 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xs text-white text-[11px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700/80 ${tooltipAlignClass}`}
                    >
                      <span className="text-slate-400 mr-1 font-normal">{d.dateStr}:</span>
                      <span className="font-bold tabular-nums">{formatMoney(d.spent)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Minimalist Threshold Controls */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Spending Limits</span>
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">Upper limit per band</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 items-center">
              {[
                { name: 'green', label: 'Low', dotColor: 'bg-emerald-400' },
                { name: 'yellow', label: 'Med', dotColor: 'bg-amber-400' },
                { name: 'orange', label: 'High', dotColor: 'bg-orange-400' },
              ].map(({ name, label, dotColor }) => (
                <div
                  key={name}
                  className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all min-w-0"
                  title={`${label} spending upper limit`}
                >
                  <span className={`w-2 h-2 ${dotColor} rounded-full shrink-0`} />
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0">&le;</span>
                  <input
                    type="number"
                    min="0"
                    value={heatmapDraft[name]}
                    onChange={(e) => updateHeatmapDraft(name, e.target.value)}
                    className="w-full bg-transparent outline-none font-bold text-xs text-slate-900 dark:text-white tabular-nums min-w-0"
                    aria-label={`${label} spending threshold`}
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={saveHeatmapThresholds}
                className="col-span-3 sm:col-span-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer text-center"
              >
                Save
              </button>
            </div>

            {heatmapValidationError && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{heatmapValidationError}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
