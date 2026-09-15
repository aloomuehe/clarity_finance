import { Clock, Edit2, Repeat, Trash2 } from 'lucide-react';

export default function Forecast({
  formatMoney,
  projections,
  recurring,
  planned,
  recurringForm,
  plannedForm,
  editingRecurringId,
  editingPlannedId,
  handleRecurringSubmit,
  handlePlannedSubmit,
  setRecurringForm,
  setPlannedForm,
  setEditingRecurringId,
  setEditingPlannedId,
  deleteWithUndo,
  setRecurring,
  setPlanned,
}) {
  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-600 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-6 text-white shadow-lg"><h2 className="text-sm font-semibold text-white/90 mb-1">Projected End-of-Month Balance</h2><p className="text-4xl font-extrabold text-white">{formatMoney(projections.projectedBalance)}</p><p className="text-xs text-white/70 mt-2">Current balance minus unpaid recurring and planned expenses due this month.</p></div>
        <div className="bg-emerald-600 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl p-6 text-white shadow-lg"><h2 className="text-sm font-semibold text-white/90 mb-1">Projected Monthly Savings</h2><p className="text-4xl font-extrabold text-white">{formatMoney(projections.projectedSavings)}</p><p className="text-xs text-white/70 mt-2">Uses recorded income and expenses; no expected income is assumed.</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 dk-text-white mb-4 flex items-center gap-2"><Repeat className="w-5 h-5 text-indigo-500" /> Recurring Expenses</h3>
          <form onSubmit={handleRecurringSubmit} className="flex flex-wrap gap-2 mb-4">
            <input type="text" placeholder="Name" value={recurringForm.name} onChange={e => setRecurringForm({...recurringForm, name: e.target.value})} className="flex-1 min-w-[120px] px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-xs text-slate-900 dk-text-white" required />
            <input type="number" placeholder="Amt" value={recurringForm.amount} onChange={e => setRecurringForm({...recurringForm, amount: e.target.value})} className="w-24 px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-xs text-slate-900 dk-text-white font-bold" required />
            <input type="number" min="1" max="31" placeholder="Day" value={recurringForm.day} onChange={e => setRecurringForm({...recurringForm, day: e.target.value})} className="w-16 px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-xs text-slate-900 dk-text-white font-bold" required />
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">{editingRecurringId ? 'Update' : 'Add'}</button>
          </form>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-60">
            {recurring.map(r => (
              <div key={r.id} className="flex justify-between items-center p-3 bg-slate-50 dk-bg-slate-900 rounded-xl text-sm border border-slate-200 dk-border-slate-800"><div className="flex-1"><p className="font-bold text-slate-900 dk-text-slate-100">{r.name}</p><p className="text-xs text-slate-500 dk-text-slate-400">Day {r.day}</p></div><div className="flex items-center gap-3"><span className="font-bold text-rose-500">{formatMoney(r.amount)}</span><button onClick={() => { setEditingRecurringId(r.id); setRecurringForm({ name: r.name, amount: r.amount, day: String(r.day), category: r.category || 'utilities' }); }} className="text-slate-400 hover:text-indigo-500" title="Edit recurring expense"><Edit2 className="w-4 h-4" /></button><button onClick={() => deleteWithUndo(recurring, setRecurring, r.id, 'recurring expense')} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></div></div>
            ))}
          </div>
        </div>
        <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 dk-text-white mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-500" /> Planned Future Expenses</h3>
          <form onSubmit={handlePlannedSubmit} className="flex flex-wrap gap-2 mb-4">
            <input type="text" placeholder="Name" value={plannedForm.name} onChange={e => setPlannedForm({...plannedForm, name: e.target.value})} className="flex-1 min-w-[120px] px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-xs text-slate-900 dk-text-white" required />
            <input type="number" placeholder="Amt" value={plannedForm.amount} onChange={e => setPlannedForm({...plannedForm, amount: e.target.value})} className="w-24 px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-xs text-slate-900 dk-text-white font-bold" required />
            <input type="date" value={plannedForm.date} onChange={e => setPlannedForm({...plannedForm, date: e.target.value})} className="w-32 px-2 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-xs text-slate-900 dk-text-white font-bold" required />
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">{editingPlannedId ? 'Update' : 'Add'}</button>
          </form>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-60">
            {planned.map(p => (
              <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 dk-bg-slate-900 rounded-xl text-sm border border-slate-200 dk-border-slate-800"><div className="flex-1"><p className="font-bold text-slate-900 dk-text-slate-100">{p.name}</p><p className="text-xs text-slate-500 dk-text-slate-400">{p.date}</p></div><div className="flex items-center gap-3"><span className="font-bold text-rose-500">{formatMoney(p.amount)}</span><button onClick={() => { setEditingPlannedId(p.id); setPlannedForm({ name: p.name, amount: p.amount, date: p.date, category: p.category || 'other_expense' }); }} className="text-slate-400 hover:text-indigo-500" title="Edit planned expense"><Edit2 className="w-4 h-4" /></button><button onClick={() => deleteWithUndo(planned, setPlanned, p.id, 'planned expense')} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
