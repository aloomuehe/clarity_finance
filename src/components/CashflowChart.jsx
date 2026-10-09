import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function CashflowChart({
  sixMonthTrend,
  formatMoney,
  formatCompactMoney,
  onOpenModal,
}) {
  const [activeSeries, setActiveSeries] = useState('all'); // 'all' | 'income' | 'expense' | 'savings'
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!sixMonthTrend || !sixMonthTrend.trend || sixMonthTrend.trend.length === 0) {
    return null;
  }

  const { trend, maxVal, axisTicks } = sixMonthTrend;
  const numMonths = trend.length;

  // Build SVG points for each line
  // Coordinates are percentage-based: x from 0 to 100, y from 0 to 100 (where 0 is top and 100 is bottom)
  const getX = (i) => ((i + 0.5) / numMonths) * 100;
  const getY = (val) => 100 - (Math.max(0, val) / maxVal) * 85 - 8; // leave 8% padding top and bottom

  const incomePoints = trend.map((t, i) => `${getX(i)},${getY(t.income)}`).join(' ');
  const expensePoints = trend.map((t, i) => `${getX(i)},${getY(t.expense)}`).join(' ');
  const savingsPoints = trend.map((t, i) => `${getX(i)},${getY(Math.max(0, t.saved))}`).join(' ');

  // Gradient area path for income or active series
  const activeAreaPoints = (activeSeries === 'expense' ? trend.map((t, i) => `${getX(i)},${getY(t.expense)}`) : trend.map((t, i) => `${getX(i)},${getY(t.income)}`)).join(' ');
  const areaPath = `M ${getX(0)},100 L ${activeAreaPoints} L ${getX(numMonths - 1)},100 Z`;

  const hoveredData = hoveredIdx !== null ? trend[hoveredIdx] : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between relative">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Cashflow
            </h3>
            {onOpenModal && (
              <button
                type="button"
                onClick={onOpenModal}
                className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-0.5 rounded transition-colors"
                title="Open detailed trajectory view"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Income vs expenses across past 6 months
          </p>
        </div>

        {/* Series Filter Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
          {[
            { id: 'all', label: 'All' },
            { id: 'income', label: 'Income' },
            { id: 'expense', label: 'Expense' },
            { id: 'savings', label: 'Savings' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSeries(tab.id)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeSeries === tab.id
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart SVG & Axes */}
      <div className="relative h-56 sm:h-64 mt-2">
        {/* Horizontal grid guidelines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-1">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="w-full border-b border-dashed border-slate-100 dark:border-slate-800/80 flex items-center justify-end"
            >
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums -mt-3.5 pr-1">
                {axisTicks && axisTicks[idx] ? formatCompactMoney(axisTicks[idx]) : ''}
              </span>
            </div>
          ))}
        </div>

        {/* SVG Curve Canvas */}
        <svg
          className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="cfIncomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="cfExpenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area Fill for Primary Line */}
          {(activeSeries === 'all' || activeSeries === 'income') && (
            <path d={areaPath} fill="url(#cfIncomeGrad)" />
          )}
          {activeSeries === 'expense' && (
            <path d={areaPath} fill="url(#cfExpenseGrad)" />
          )}

          {/* Income Line (Blue / Cyan) */}
          {(activeSeries === 'all' || activeSeries === 'income') && (
            <polyline
              points={incomePoints}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Expense Line (Rose / Slate dashed) */}
          {(activeSeries === 'all' || activeSeries === 'expense') && (
            <polyline
              points={expensePoints}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.2"
              strokeDasharray={activeSeries === 'all' ? '4 3' : 'none'}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Net Savings Line (Emerald) */}
          {(activeSeries === 'all' || activeSeries === 'savings') && (
            <polyline
              points={savingsPoints}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>

        {/* Hover / Point Columns */}
        <div className="absolute inset-0 flex items-stretch">
          {trend.map((t, idx) => {
            const isHovered = hoveredIdx === idx;
            const isLive = t.isLive;

            return (
              <div
                key={t.key}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="flex-1 relative cursor-pointer group flex flex-col justify-end items-center"
              >
                {/* Vertical guideline on hover */}
                {isHovered && (
                  <div className="absolute inset-y-0 w-px bg-blue-500/40 dark:bg-blue-400/40 pointer-events-none" />
                )}

                {/* Point indicators on curves */}
                {(activeSeries === 'all' || activeSeries === 'income') && (
                  <div
                    className={`absolute w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 transition-transform ${
                      isHovered ? 'scale-125 ring-2 ring-blue-400/50' : 'opacity-80'
                    }`}
                    style={{ bottom: `${100 - getY(t.income)}%`, transform: 'translateY(50%)' }}
                  />
                )}
                {(activeSeries === 'all' || activeSeries === 'expense') && (
                  <div
                    className={`absolute w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 transition-transform ${
                      isHovered ? 'scale-125 ring-2 ring-rose-400/50' : 'opacity-80'
                    }`}
                    style={{ bottom: `${100 - getY(t.expense)}%`, transform: 'translateY(50%)' }}
                  />
                )}

                {/* Month label at bottom */}
                <span
                  className={`text-xs mt-auto pt-2 font-semibold transition-colors tabular-nums ${
                    isLive
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : isHovered
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {t.month}
                  {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 ml-1 mb-0.5" />}
                </span>
              </div>
            );
          })}
        </div>

        {/* Floating Tooltip when hovering over a month */}
        {hoveredData && (
          <div
            className={`absolute top-0 z-30 pointer-events-none bg-slate-950/90 dark:bg-slate-900/95 backdrop-blur-md text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700/80 min-w-[160px] transition-all duration-150 ${
              hoveredIdx <= 1
                ? 'left-4'
                : hoveredIdx >= numMonths - 2
                ? 'right-4'
                : 'left-1/2 -translate-x-1/2'
            }`}
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-700 font-bold">
              <span>{hoveredData.month}</span>
              {hoveredData.isLive && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-300">
                  Current
                </span>
              )}
            </div>
            <div className="space-y-1 tabular-nums">
              <div className="flex justify-between text-blue-300">
                <span>Income:</span>
                <span className="font-semibold">+{formatMoney(hoveredData.income)}</span>
              </div>
              <div className="flex justify-between text-rose-300">
                <span>Expense:</span>
                <span className="font-semibold">-{formatMoney(hoveredData.expense)}</span>
              </div>
              <div className="flex justify-between text-emerald-300 pt-1 border-t border-slate-800">
                <span>Net Saved:</span>
                <span className="font-bold">{formatMoney(hoveredData.saved)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px] pt-1">
                <span>End Balance:</span>
                <span>{formatMoney(hoveredData.closingBalance)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Legend */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Income
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expense
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Net Savings
          </span>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
          Live ledger tracking
        </span>
      </div>
    </div>
  );
}
