import { Calendar, Settings, X } from 'lucide-react';

export default function HeatmapModal({ open, onClose, selectedMonth, heatmapData, getHeatmapColor, formatMoney, heatmapDraft, updateHeatmapDraft, saveHeatmapThresholds, heatmapValidationError }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dark-card bg-white dk-bg-slate-900 rounded-3xl w-full max-w-3xl p-8 relative shadow-2xl animate-fade-in-up max-h-[95vh] overflow-y-auto border border-slate-200 dk-border-slate-800">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-100 dk-bg-slate-800 rounded-full hover:bg-slate-200 dk-hover-bg-slate-700 text-slate-700 dk-text-slate-200 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-slate-900 dk-text-white">
          <Calendar className="w-7 h-7 text-indigo-500" /> Daily Spending Heatmap
        </h2>
        <p className="text-slate-500 dk-text-slate-400 mb-8 font-medium">Visualize spending intensity for {selectedMonth}.</p>
        <div className="grid grid-cols-7 gap-2 mb-8 relative">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-sm font-bold text-slate-500 dk-text-slate-400 mb-2">{d}</div>
          ))}
          {heatmapData.map((d, i) => {
            if (d.empty) return <div key={i} />;
            const colorClass = getHeatmapColor(d.spent, d.dateStr);
            const isNeutral = colorClass.includes('bg-slate-100');
            return (
              <div
                key={i}
                className={`relative group aspect-square rounded-2xl ${colorClass} flex items-center justify-center cursor-pointer transition-all hover:scale-105`}
              >
                <span className={`text-sm ${!isNeutral ? 'text-white font-bold' : 'text-slate-500 dk-text-slate-400 font-semibold'}`}>
                  {d.day}
                </span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700">
                  <span className="opacity-75 mr-2">{d.dateStr}:</span> {formatMoney(d.spent)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-5 bg-slate-50 dk-bg-slate-800-50 rounded-2xl border border-slate-200 dk-border-slate-700">
          <h4 className="text-sm font-bold text-slate-900 dk-text-white mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4"/> Customize Thresholds
          </h4>
          <div className="flex flex-wrap gap-4 items-center">
            {['green', 'yellow', 'orange'].map((name, index) => (
              <div key={name} className="dark-card flex items-center gap-2 bg-white dk-bg-slate-800 px-3 py-2 rounded-xl shadow-sm border border-slate-200 dk-border-slate-700">
                <div className={`w-4 h-4 ${['bg-emerald-400', 'bg-yellow-400', 'bg-orange-400'][index]} rounded-full`}></div>
                <span className="text-sm text-slate-500">&le;</span>
                <input type="number" min="0" value={heatmapDraft[name]} onChange={e => updateHeatmapDraft(name, e.target.value)} className="w-20 bg-transparent outline-none font-bold text-slate-900 dk-text-white" />
              </div>
            ))}
            <button type="button" onClick={saveHeatmapThresholds} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold">Save</button>
          </div>
          {heatmapValidationError && <p className="mt-3 text-sm font-semibold text-rose-600 dk-text-rose-300" role="alert">{heatmapValidationError}</p>}
        </div>
      </div>
    </div>
  );
}
