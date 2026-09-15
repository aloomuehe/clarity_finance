import { useState } from 'react';
import { CheckCircle, Plus, Trash2 } from 'lucide-react';

export default function Goals({
  formatMoney,
  goals,
  goalForm,
  goalInputs,
  handleGoalSubmit,
  setGoalForm,
  setGoalInputs,
  addGoalContribution,
  deleteWithUndo,
  setGoals,
}) {
  const [goalFilter, setGoalFilter] = useState('active'); // 'active' | 'completed'

  const isGoalCompleted = (g) => Number(g.target) > 0 && Number(g.current) >= Number(g.target);

  const activeGoals = (goals || []).filter(g => !isGoalCompleted(g));
  const completedGoals = (goals || []).filter(isGoalCompleted);

  const displayedGoals = goalFilter === 'completed' ? completedGoals : activeGoals;

  const emptyMessage = goalFilter === 'completed' ? 'No completed savings goals yet.' : 'No active savings goals.';
  const emptySubtitle = goalFilter === 'completed'
    ? 'Goals will appear here once you reach your target amount.'
    : 'Create your first goal above to track progress.';

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dk-text-white mb-4">Add Savings Goal</h3>
        <form onSubmit={handleGoalSubmit} className="flex flex-wrap gap-4">
          <input type="text" placeholder="Goal Name" value={goalForm.name} onChange={e => setGoalForm({...goalForm, name: e.target.value})} required className="flex-1 min-w-[160px] px-3 py-2 border border-slate-300 dk-border-slate-700 bg-slate-50 dk-bg-slate-900 text-slate-900 dk-text-white rounded-xl text-sm" />
          <input type="number" placeholder="Target Amount" value={goalForm.target} onChange={e => setGoalForm({...goalForm, target: e.target.value})} required className="w-32 px-3 py-2 border border-slate-300 dk-border-slate-700 bg-slate-50 dk-bg-slate-900 text-slate-900 dk-text-white rounded-xl text-sm font-bold" />
          <input type="number" placeholder="Already Saved" value={goalForm.current} onChange={e => setGoalForm({...goalForm, current: e.target.value})} className="w-32 px-3 py-2 border border-slate-300 dk-border-slate-700 bg-slate-50 dk-bg-slate-900 text-slate-900 dk-text-white rounded-xl text-sm font-bold" />
          <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">Add Goal</button>
        </form>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex bg-slate-100 dk-bg-slate-900 p-1 rounded-xl border border-slate-200 dk-border-slate-700 w-fit">
          <button
            type="button"
            onClick={() => setGoalFilter('active')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              goalFilter === 'active'
                ? 'bg-white dk-bg-slate-700 text-indigo-600 dk-text-indigo-400 shadow-sm'
                : 'text-slate-600 dk-text-slate-400 hover:text-slate-900 dk-hover-text-white'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setGoalFilter('completed')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              goalFilter === 'completed'
                ? 'bg-white dk-bg-slate-700 text-emerald-600 dk-text-emerald-400 shadow-sm'
                : 'text-slate-600 dk-text-slate-400 hover:text-slate-900 dk-hover-text-white'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {displayedGoals.length === 0 ? (
        <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-10 border border-dashed border-slate-300 dk-border-slate-700 flex flex-col items-center justify-center text-center">
          <CheckCircle className="w-10 h-10 text-slate-300 dk-text-slate-400 mb-3" />
          <p className="font-semibold text-slate-700 dk-text-slate-300">{emptyMessage}</p>
          <p className="text-sm text-slate-500 dk-text-slate-400 mt-1">{emptySubtitle}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedGoals.map(g => {
          const remaining = Math.max(0, g.target - g.current);
          const pct = g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0;
          const isDone = remaining === 0 && g.target > 0;
          return (
            <div key={g.id} className="dark-card bg-white dk-bg-slate-800 p-6 rounded-3xl border border-slate-200 dk-border-slate-700 shadow-sm relative group flex flex-col">
              <button onClick={() => deleteWithUndo(goals, setGoals, g.id, 'savings goal')} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>
              <h4 className="font-bold mb-2 text-slate-900 dk-text-slate-100 pr-8">{g.name}</h4>
              <p className="text-2xl font-black text-indigo-600 dk-text-indigo-400 mb-4">{formatMoney(g.current)} <span className="text-sm font-semibold text-slate-500 dk-text-slate-400">/ {formatMoney(g.target)}</span></p>
              <div className="h-3 w-full bg-slate-100 dk-bg-slate-700 rounded-full overflow-hidden mb-2"><div className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{width:`${pct}%`}}></div></div>
              <div className="flex items-baseline justify-between gap-2 mb-4">
                <p className="text-xs text-slate-600 dk-text-slate-400 font-semibold">{pct.toFixed(1)}% Completed</p>
                {isDone ? (
                  <p className="text-xs font-bold text-emerald-600 dk-text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Goal reached</p>
                ) : (
                  <p className="text-xs font-bold text-slate-500 dk-text-slate-400 text-right"><span className="text-amber-600 dk-text-amber-400">{formatMoney(remaining)}</span> left</p>
                )}
              </div>
              <div className="mt-auto flex gap-2">
                <input type="number" min="0" value={goalInputs[g.id] || ''} onChange={e => setGoalInputs({ ...goalInputs, [g.id]: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGoalContribution(g.id, 1); } }} placeholder="Add amount" className="flex-1 min-w-0 px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-sm text-slate-900 dk-text-white font-bold" />
                <button type="button" onClick={() => addGoalContribution(g.id, -1)} title="Remove this amount" className="px-3 py-2 bg-slate-100 dk-bg-slate-700 hover:bg-slate-200 dk-hover-bg-slate-600 text-slate-600 dk-text-slate-300 font-bold rounded-xl transition-colors">&minus;</button>
                <button type="button" onClick={() => addGoalContribution(g.id, 1)} title="Add this amount" className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
