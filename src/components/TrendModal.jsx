import { BarChart, X } from 'lucide-react';

export default function TrendModal({ open, onClose, sixMonthTrend, formatMoney, formatCompactMoney }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dark-card bg-white dk-bg-slate-900 rounded-3xl w-full max-w-4xl p-8 relative shadow-2xl modal-spring border border-slate-200 dk-border-slate-800">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-100 dk-bg-slate-800 rounded-full hover:bg-slate-200 dk-hover-bg-slate-700 text-slate-700 dk-text-slate-200 transition-colors"><X className="w-5 h-5" /></button>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-slate-900 dk-text-white"><BarChart className="w-7 h-7 text-emerald-500" /> 6-Month Trajectory</h2>
        <p className="text-slate-500 dk-text-slate-400 mb-12 font-medium">Compare your cash flow over the previous half-year. The current month updates live, and hovering shows the balance carried over from the month before.</p>
        <div className="flex items-center gap-6 mb-6 text-xs font-bold"><span className="flex items-center gap-2 text-slate-600 dk-text-slate-300"><span className="w-7 h-1 rounded-full bg-emerald-500"></span> Income</span><span className="flex items-center gap-2 text-slate-600 dk-text-slate-300"><span className="w-7 h-1 rounded-full bg-rose-500"></span> Expense</span></div>
        <div className="flex gap-3 mt-2 px-2">
          <div className="w-16 shrink-0 h-52 flex flex-col justify-between text-right text-[10px] font-bold text-slate-400 dk-text-slate-400 -mt-1.5">{sixMonthTrend.axisTicks.map((v, i) => <span key={i}>{formatCompactMoney(v)}</span>)}</div>
          <div className="flex-1 min-w-0">
            <div className="relative h-52">
              {[25, 50, 75, 100].map(pct => <div key={pct} className="absolute left-0 right-0 border-t border-dashed border-slate-200 dk-border-slate-700" style={{ bottom: `${pct}%` }}></div>)}
              <div className="absolute left-0 right-0 bottom-0 border-t-2 border-slate-300 dk-border-slate-600"></div>
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={sixMonthTrend.incomeLine} fill="none" stroke="#10b981" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" className="chart-draw" /><polyline points={sixMonthTrend.expenseLine} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" className="chart-draw" /></svg>
              <div className="absolute inset-0 flex items-end justify-between">
                {sixMonthTrend.trend.map((t, i) => {
                  const lastIdx = sixMonthTrend.trend.length - 1;
                  const tipPos = i === 0 ? 'left-0' : i === lastIdx ? 'right-0' : 'left-1/2 -translate-x-1/2';
                  const incomePct = (t.income / sixMonthTrend.maxVal) * 100;
                  const expensePct = (t.expense / sixMonthTrend.maxVal) * 100;
                  return (
                    <div key={t.key} className="relative flex-1 h-full flex items-end justify-center gap-1.5 cursor-pointer group">
                      <div className={`absolute top-0 ${tipPos} px-4 py-2.5 bg-slate-900/95 backdrop-blur-sm text-white text-xs font-medium rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-2xl border border-slate-700 w-[185px] z-50`}><span className="font-bold text-base border-b border-slate-700 pb-1.5 mb-1 flex items-center justify-between gap-3">{t.month}{t.isLive && <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Live</span>}</span><div className="text-slate-400 flex justify-between gap-3 mt-2"><span className="whitespace-nowrap">Carried in:</span> <span>{formatMoney(t.openingBalance)}</span></div><div className="text-emerald-400 flex justify-between gap-4"><span className="whitespace-nowrap">Income:</span> <span>{formatMoney(t.income)}</span></div><div className="text-rose-400 flex justify-between gap-4"><span className="whitespace-nowrap">Expense:</span> <span>{formatMoney(t.expense)}</span></div><div className="text-indigo-400 flex justify-between gap-4"><span className="whitespace-nowrap">Saved:</span> <span>{formatMoney(t.saved)}</span></div><div className="text-white font-bold flex justify-between gap-4 pt-2 mt-1 border-t border-slate-700"><span className="whitespace-nowrap">Balance:</span> <span>{formatMoney(t.closingBalance)}</span></div></div>
                      <div className="w-1/3 max-w-[26px] bg-emerald-400/70 rounded-t-lg transition-all group-hover:bg-emerald-400" style={{ height: `${incomePct}%` }}></div><div className="w-1/3 max-w-[26px] bg-rose-400/70 rounded-t-lg transition-all group-hover:bg-rose-400" style={{ height: `${expensePct}%` }}></div><div className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dk-border-slate-900 z-30" style={{ bottom: `${incomePct}%` }}></div><div className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dk-border-slate-900 z-30" style={{ bottom: `${expensePct}%` }}></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between mt-4">{sixMonthTrend.trend.map(t => <div key={t.key} className="flex-1 flex justify-center"><span className={`text-sm font-bold px-4 py-1 rounded-full flex items-center gap-1.5 ${t.isLive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 dk-text-slate-300 bg-slate-100 dk-bg-slate-800'}`}>{t.isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>}{t.month}</span></div>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
