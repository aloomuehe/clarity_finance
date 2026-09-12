import { Bot, CheckCircle, FileText, Loader2, RefreshCw, X } from 'lucide-react';

export default function Reports({
  showReport,
  setShowReport,
  selectedMonth,
  monthLabel,
  isReportLoading,
  formatMoney,
  currentMonthData,
  reportError,
  reportInsights,
  generateDetailedReport,
}) {
  if (!showReport) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="dark-card bg-white dk-bg-slate-900 rounded-3xl w-full max-w-2xl p-8 relative shadow-2xl animate-fade-in-up border border-slate-200 dk-border-slate-800">
        <button onClick={() => setShowReport(false)} className="absolute top-6 right-6 p-2 bg-slate-100 dk-bg-slate-800 rounded-full hover:bg-slate-200 dk-hover-bg-slate-700 text-slate-700 dk-text-slate-200 transition-colors"><X className="w-5 h-5" /></button>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-slate-900 dk-text-white"><FileText className="w-7 h-7 text-indigo-500" /> Executive Summary <span className="text-base font-semibold text-slate-500 dk-text-slate-400">{monthLabel(selectedMonth)}</span></h2>
        {isReportLoading ? (
          <div className="flex flex-col items-center justify-center py-12"><Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" /><p className="font-semibold text-slate-600 dk-text-slate-400">AI is analyzing your data...</p></div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dk-bg-slate-800-50 p-6 rounded-2xl border border-slate-200 dk-border-slate-700">
              <div><span className="text-sm font-bold text-slate-600 dk-text-slate-400">Income</span><p className="text-xl font-extrabold text-emerald-500">{formatMoney(currentMonthData.income)}</p></div>
              <div><span className="text-sm font-bold text-slate-600 dk-text-slate-400">Expense</span><p className="text-xl font-extrabold text-rose-500">{formatMoney(currentMonthData.expense)}</p></div>
              <div><span className="text-sm font-bold text-slate-600 dk-text-slate-400">Saved</span><p className="text-xl font-extrabold text-indigo-500">{formatMoney(currentMonthData.savings)}</p></div>
              <div><span className="text-sm font-bold text-slate-600 dk-text-slate-400">Savings Rate</span><p className="text-xl font-extrabold text-slate-900 dk-text-white">{currentMonthData.income ? ((currentMonthData.savings/currentMonthData.income)*100).toFixed(1) : 0}%</p></div>
            </div>
            {reportError && <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dk-bg-amber-900-20 border border-amber-200 dk-border-orange-800-30 text-amber-900 dk-text-amber-300 no-print"><span className="text-lg leading-none">⚠️</span><p className="text-xs font-semibold leading-relaxed">{reportError}</p></div>}
            <div className="p-6 bg-indigo-50 dk-bg-indigo-900-20 rounded-2xl border border-indigo-200 dk-border-indigo-800-50">
              <h3 className="font-bold flex items-center gap-2 mb-4 text-indigo-950 dk-text-indigo-200"><Bot className="w-5 h-5"/> AI Insights</h3>
              <div className="space-y-4">
                <p className="text-sm text-slate-800 dk-text-slate-200 leading-relaxed"><strong>Observation:</strong> {reportInsights?.observation}</p>
                {Array.isArray(reportInsights?.highlights) && reportInsights.highlights.length > 0 && <ul className="space-y-2">{reportInsights.highlights.map((item, idx) => <li key={idx} className="flex items-start gap-2 text-sm text-slate-800 dk-text-slate-200"><CheckCircle className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" /><span className="leading-relaxed">{item}</span></li>)}</ul>}
                <p className="text-sm text-slate-800 dk-text-slate-200 leading-relaxed"><strong>Suggestion:</strong> {reportInsights?.suggestion}</p>
                {reportInsights?.watchOut && <p className="text-sm text-slate-800 dk-text-slate-200 leading-relaxed"><strong>Watch out:</strong> {reportInsights.watchOut}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={generateDetailedReport} className="flex-1 py-3 bg-slate-100 dk-bg-slate-800 hover:bg-slate-200 dk-hover-bg-slate-700 text-slate-800 dk-text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 no-print"><RefreshCw className="w-4 h-4" /> Regenerate</button>
              <button onClick={() => window.print()} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md no-print">Download as PDF</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
