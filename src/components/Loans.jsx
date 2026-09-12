import { CheckCircle, Landmark } from 'lucide-react';

export default function Loans({
  formatMoney,
  loans,
  loanForm,
  paymentInputs,
  handleLoanSubmit,
  setLoanForm,
  setPaymentInputs,
  recordLoanPayment,
  deleteLoanWithUndo,
}) {
  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow"><h2 className="text-sm font-semibold text-emerald-100 mb-1">To Receive</h2><p className="text-4xl font-extrabold">{formatMoney(loans.filter(l => l.type === 'lent').reduce((acc, l) => acc + (l.amount - l.amountPaid), 0))}</p></div>
        <div className="bg-gradient-to-br from-rose-500 to-orange-600 rounded-3xl p-6 text-white shadow"><h2 className="text-sm font-semibold text-rose-100 mb-1">To Pay</h2><p className="text-4xl font-extrabold">{formatMoney(loans.filter(l => l.type === 'borrowed').reduce((acc, l) => acc + (l.amount - l.amountPaid), 0))}</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm"><h3 className="text-lg font-bold text-slate-900 dk-text-white mb-6 flex items-center gap-2"><Landmark className="w-5 h-5 text-indigo-500" /> Log New Loan</h3>
            <form onSubmit={handleLoanSubmit} className="space-y-4">
              <div className="flex bg-slate-100 dk-bg-slate-900 p-1 rounded-xl">
                <button type="button" onClick={() => setLoanForm(p => ({...p, type: 'lent'}))} className={`flex-1 py-1.5 text-sm font-bold rounded-lg ${loanForm.type === 'lent' ? 'bg-white dk-bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-500 dk-text-slate-400'}`}>I Lent</button>
                <button type="button" onClick={() => setLoanForm(p => ({...p, type: 'borrowed'}))} className={`flex-1 py-1.5 text-sm font-bold rounded-lg ${loanForm.type === 'borrowed' ? 'bg-white dk-bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-500 dk-text-slate-400'}`}>I Borrowed</button>
              </div>
              <div><input type="text" value={loanForm.person} onChange={e => setLoanForm(p => ({...p, person: e.target.value}))} placeholder="Person/Entity" required className="w-full px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-sm text-slate-900 dk-text-white font-medium" /></div>
              <div><input type="number" value={loanForm.amount} onChange={e => setLoanForm(p => ({...p, amount: e.target.value}))} placeholder="Amount" required className="w-full px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-sm text-slate-900 dk-text-white font-bold" /></div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow">Log Loan</button>
            </form>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          {loans.length === 0 && (
            <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-10 border border-dashed border-slate-300 dk-border-slate-700 flex flex-col items-center justify-center text-center">
              <Landmark className="w-10 h-10 text-slate-300 dk-text-slate-400 mb-3" />
              <p className="font-semibold text-slate-700 dk-text-slate-300">No loans logged yet</p>
              <p className="text-sm text-slate-500 dk-text-slate-400 mt-1">Add one on the left to start tracking who owes what.</p>
            </div>
          )}
          {loans.map(loan => {
            const isSettled = loan.amountPaid >= loan.amount;
            return (
              <div key={loan.id} className="dark-card bg-white dk-bg-slate-800 rounded-2xl p-5 border border-slate-200 dk-border-slate-700 shadow-sm relative overflow-hidden group">
                {isSettled && <div className="absolute top-0 right-0 p-4"><CheckCircle className="w-6 h-6 text-emerald-500 opacity-50"/></div>}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${loan.type === 'lent' ? 'bg-emerald-100 text-emerald-800 dk-bg-emerald-900-30 dk-text-emerald-300' : 'bg-rose-100 text-rose-800 dk-bg-rose-900-20 dk-text-rose-300'}`}>{loan.type === 'lent' ? 'LENT TO' : 'BORROWED FROM'}</span>
                    <span className="font-bold ml-2 text-slate-900 dk-text-white">{loan.person}</span>
                    <p className="text-xs text-slate-500 dk-text-slate-400 mt-1 font-medium">{loan.note} • {loan.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900 dk-text-white">{formatMoney(loan.amount)}</p>
                    <button onClick={() => deleteLoanWithUndo(loan)} className="text-xs text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 mt-1">Delete</button>
                  </div>
                </div>
                <div className="bg-slate-50 dk-bg-slate-900-50 p-4 rounded-xl border border-slate-200 dk-border-slate-800">
                  <div className="flex justify-between text-sm mb-2 font-semibold text-slate-700 dk-text-slate-300"><span>Paid Back</span><span>{formatMoney(loan.amountPaid)} / {formatMoney(loan.amount)}</span></div>
                  <div className="h-2 w-full bg-slate-200 dk-bg-slate-700 rounded-full overflow-hidden mb-4"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((loan.amountPaid/loan.amount)*100, 100)}%` }}></div></div>
                  {!isSettled && (
                    <div className="flex gap-2">
                      <input type="number" value={paymentInputs[loan.id] || ''} onChange={e => setPaymentInputs({...paymentInputs, [loan.id]: e.target.value})} placeholder="Log partial payment" className="flex-1 px-3 py-2 bg-white dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-lg text-sm text-slate-900 dk-text-white font-bold" />
                      <button onClick={() => recordLoanPayment(loan.id)} className="px-4 py-2 bg-indigo-100 text-indigo-700 dk-bg-indigo-900-40 dk-text-indigo-300 rounded-lg text-sm font-bold">Record</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
