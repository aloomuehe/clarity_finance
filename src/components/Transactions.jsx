import { ArrowRightLeft, CreditCard, Edit2, Search, Trash2 } from 'lucide-react';

export default function Transactions({
  formatMoney,
  monthLabel,
  selectedMonth,
  displayTransactions,
  currentMonthData,
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
  initiateEdit,
  deleteTransaction,
  expenseCategories,
  incomeSources,
}) {
  return (
    <div className="lg:col-span-2">
      <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm min-h-[600px] flex flex-col">
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 dk-text-white flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-indigo-500" /> Transactions</h3>
            <p className="text-sm font-bold text-indigo-600 dk-text-indigo-300 mt-1">{monthLabel(selectedMonth)}<span className="text-slate-400 dk-text-slate-400 font-semibold"> · {displayTransactions.length} shown</span></p>
          </div>
          <div className="text-right shrink-0"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dk-text-slate-400">Total spent</p><p className="text-2xl font-extrabold text-rose-500 leading-tight">{formatMoney(currentMonthData.expense)}</p><p className="text-[11px] font-semibold text-emerald-600 dk-text-emerald-300">+{formatMoney(currentMonthData.income)} in</p></div>
        </div>
        <div className="flex flex-wrap justify-end items-center mb-6 gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative"><span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400"><Search className="w-3.5 h-3.5" /></span><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-40 pl-8 pr-2 py-1.5 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-lg text-xs text-slate-900 dk-text-white font-medium outline-none" /></div>
            <div className="flex bg-slate-100 dk-bg-slate-900 p-1 rounded-xl">{['all', 'income', 'expense'].map((f) => <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 text-xs font-bold rounded-lg capitalize ${filter === f ? 'bg-white dk-bg-slate-700 text-indigo-600 dk-text-indigo-300 shadow-sm' : 'text-slate-500 dk-text-slate-400'}`}>{f}</button>)}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3">
          {displayTransactions.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12"><CreditCard className="w-12 h-12 mb-2 text-slate-400" /><p className="font-medium">No matching transactions found.</p></div> : displayTransactions.map((transaction) => {
            const isIncome = transaction.type === 'income';
            const catInfo = (isIncome ? incomeSources : expenseCategories).find(category => category.id === transaction.category);
            return (
              <div key={transaction.id} className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 dk-bg-slate-800-50 border border-slate-100 dk-border-slate-700-50 hover:border-slate-300 dk-hover-border-slate-600 transition-colors">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-white dk-bg-slate-700 flex items-center justify-center text-lg shadow-sm border border-slate-200 dk-border-slate-600">{catInfo?.icon || '📦'}</div><div><p className="font-bold text-sm text-slate-900 dk-text-slate-100">{catInfo?.label || 'Other'}</p>{transaction.note && <p className="text-xs text-slate-600 dk-text-slate-400 font-medium">"{transaction.note}"</p>}{transaction.linkedLoanId && <p className="text-[10px] text-indigo-600 dk-text-indigo-300 font-bold">Linked loan movement</p>}<p className="text-[10px] text-slate-500 dk-text-slate-400 mt-0.5">{transaction.date} • {transaction.paymentMethod?.toUpperCase() || 'UPI'}</p></div></div>
                <div className="flex items-center gap-3"><span className={`font-extrabold text-sm ${isIncome ? 'text-emerald-500' : 'text-slate-900 dk-text-slate-100'}`}>{isIncome ? '+' : '-'}{formatMoney(transaction.amount)}</span><div className="flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">{!transaction.linkedLoanId && <button onClick={() => initiateEdit(transaction)} className="p-1.5 text-slate-500 hover:text-indigo-600"><Edit2 className="w-3.5 h-3.5" /></button>}<button onClick={() => deleteTransaction(transaction.id)} className="p-1.5 text-slate-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button></div></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
