import { useState } from 'react';
import {
  Landmark,
  User,
  FileText,
  DollarSign,
  CheckCircle,
  Edit2,
  Trash2,
  Plus,
  X,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { getTodayStr } from '../utils/dates.js';
import DatePicker from './DatePicker.jsx';

const formatLoanDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    if (year && !Number.isNaN(month) && day) {
      const d = new Date(year, month, day);
      return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  return dateStr;
};

export default function Loans({
  formatMoney,
  loans,
  loanForm,
  paymentInputs,
  handleLoanSubmit,
  handleEditLoan,
  setLoanForm,
  setPaymentInputs,
  recordLoanPayment,
  deleteLoanWithUndo,
  CurrencyIcon = DollarSign,
}) {
  const [loanFilter, setLoanFilter] = useState('lent'); // 'lent' | 'borrowed' | 'completed'
  const [completedFilter, setCompletedFilter] = useState('all'); // 'all' | 'lent' | 'borrowed'

  // Edit Modal State
  const [editingLoan, setEditingLoan] = useState(null);
  const [editFormData, setEditFormData] = useState({
    person: '',
    amount: '',
    date: '',
    note: '',
  });

  const isLoanCompleted = (l) => Number(l.amountPaid) >= Number(l.amount);

  const activeLentLoans = (loans || []).filter(l => l.type === 'lent' && !isLoanCompleted(l));
  const activeBorrowedLoans = (loans || []).filter(l => l.type === 'borrowed' && !isLoanCompleted(l));
  const completedLoans = (loans || []).filter(isLoanCompleted);

  const toReceive = (loans || []).filter(l => l.type === 'lent').reduce((acc, l) => acc + (l.amount - l.amountPaid), 0);
  const toPay = (loans || []).filter(l => l.type === 'borrowed').reduce((acc, l) => acc + (l.amount - l.amountPaid), 0);

  let displayedLoans = [];
  if (loanFilter === 'lent') {
    displayedLoans = activeLentLoans;
  } else if (loanFilter === 'borrowed') {
    displayedLoans = activeBorrowedLoans;
  } else if (loanFilter === 'completed') {
    if (completedFilter === 'all') {
      displayedLoans = completedLoans;
    } else if (completedFilter === 'lent') {
      displayedLoans = completedLoans.filter(l => l.type === 'lent');
    } else if (completedFilter === 'borrowed') {
      displayedLoans = completedLoans.filter(l => l.type === 'borrowed');
    }
  }

  const getEmptyMessage = () => {
    if (loanFilter === 'lent') return 'No active lent loans.';
    if (loanFilter === 'borrowed') return 'No active borrowed loans.';
    if (loanFilter === 'completed') {
      if (completedFilter === 'lent') return 'No completed lent loans.';
      if (completedFilter === 'borrowed') return 'No completed borrowed loans.';
      return 'No completed loans yet.';
    }
    return 'No loans logged yet';
  };

  const getEmptySubtitle = () => {
    if (loanFilter === 'completed') {
      return 'Loans will appear here once they are fully settled.';
    }
    return 'Add one on the left to start tracking who owes what.';
  };

  const handleOpenEdit = (loan) => {
    setEditingLoan(loan);
    setEditFormData({
      person: loan.person || '',
      amount: loan.amount !== undefined ? String(loan.amount) : '',
      date: loan.date || getTodayStr(),
      note: loan.note || '',
    });
  };

  const handleCloseEdit = () => {
    setEditingLoan(null);
    setEditFormData({ person: '', amount: '', date: '', note: '' });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingLoan || !handleEditLoan) return;
    const ok = handleEditLoan(editingLoan.id, editFormData);
    if (ok) {
      handleCloseEdit();
    }
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Loans
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track money lent, borrowed, and repayments.
          </p>
        </div>
      </div>

      {/* 2. Top Summary Cards: To Receive & To Pay */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* To Receive Card */}
        <div
          onClick={() => setLoanFilter('lent')}
          className={`card-lift bg-white dark:bg-slate-900 dk-bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 dk-border-slate-700 shadow-xs flex items-center justify-between cursor-pointer group transition-all ${
            loanFilter === 'lent' ? 'ring-1 ring-blue-500/30' : ''
          }`}
        >
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                To Receive
              </span>
              <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums mt-0.5 truncate">
                {formatMoney(toReceive)}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors shrink-0 ml-2" />
        </div>

        {/* To Pay Card */}
        <div
          onClick={() => setLoanFilter('borrowed')}
          className={`card-lift bg-white dark:bg-slate-900 dk-bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 dk-border-slate-700 shadow-xs flex items-center justify-between cursor-pointer group transition-all ${
            loanFilter === 'borrowed' ? 'ring-1 ring-blue-500/30' : ''
          }`}
        >
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-11 h-11 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/40">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                To Pay
              </span>
              <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight tabular-nums mt-0.5 truncate">
                {formatMoney(toPay)}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors shrink-0 ml-2" />
        </div>
      </div>

      {/* 3. Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Log New Loan Form Card */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4">
          <div className="card-lift bg-white dark:bg-slate-900 dk-bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 dk-border-slate-700 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                <Landmark className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white dk-text-white">
                Log New Loan
              </h3>
            </div>

            <form onSubmit={handleLoanSubmit} className="space-y-3.5">
              {/* Type Switcher */}
              <div className="flex bg-slate-100 dark:bg-slate-800/80 dk-bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 dk-border-slate-700">
                <button
                  type="button"
                  onClick={() => setLoanForm(p => ({ ...p, type: 'lent' }))}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    loanForm.type === 'lent'
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 dk-text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  I Lent
                </button>
                <button
                  type="button"
                  onClick={() => setLoanForm(p => ({ ...p, type: 'borrowed' }))}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    loanForm.type === 'borrowed'
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 dk-text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  I Borrowed
                </button>
              </div>

              {/* Person / Entity */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 dk-text-slate-300 mb-1.5">
                  Person / Entity
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={loanForm.person}
                    onChange={e => setLoanForm(p => ({ ...p, person: e.target.value }))}
                    placeholder="e.g. didi"
                    required
                    className="w-full h-10 pl-9.5 pr-3 bg-slate-50/70 dark:bg-slate-800/60 dk-bg-slate-900 border border-slate-200 dark:border-slate-700/80 dk-border-slate-600 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white dk-text-white font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 dk-text-slate-300 mb-1.5">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                    <CurrencyIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={loanForm.amount}
                    onChange={e => setLoanForm(p => ({ ...p, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                    className="w-full h-10 pl-9.5 pr-3 bg-slate-50/70 dark:bg-slate-800/60 dk-bg-slate-900 border border-slate-200 dark:border-slate-700/80 dk-border-slate-600 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white dk-text-white font-bold tabular-nums placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 dk-text-slate-300 mb-1.5">
                  Date
                </label>
                <DatePicker
                  value={loanForm.date || getTodayStr()}
                  onChange={e => setLoanForm(p => ({ ...p, date: e.target.value }))}
                  name="date"
                  required
                  className="h-10 text-xs sm:text-sm"
                />
              </div>

              {/* Note (optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 dk-text-slate-300 mb-1.5">
                  Note (optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                    <FileText className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={loanForm.note || ''}
                    onChange={e => setLoanForm(p => ({ ...p, note: e.target.value }))}
                    placeholder="e.g. for laptop"
                    className="w-full h-10 pl-9.5 pr-3 bg-slate-50/70 dark:bg-slate-800/60 dk-bg-slate-900 border border-slate-200 dark:border-slate-700/80 dk-border-slate-600 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white dk-text-white font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Log Loan</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Tabs & Loan Records */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
          {/* Tabs & Sub-filters Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Top-level filter: Lent | Borrowed | Completed */}
            <div className="inline-flex flex-wrap bg-slate-100 dark:bg-slate-800/80 dk-bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 dk-border-slate-700 max-w-full">
              <button
                type="button"
                onClick={() => setLoanFilter('lent')}
                className={`px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  loanFilter === 'lent'
                    ? 'bg-white dark:bg-slate-900 dk-bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 dk-text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                Lent {activeLentLoans.length > 0 && <span className="ml-1 text-[11px] opacity-80">({activeLentLoans.length})</span>}
              </button>
              <button
                type="button"
                onClick={() => setLoanFilter('borrowed')}
                className={`px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  loanFilter === 'borrowed'
                    ? 'bg-white dark:bg-slate-900 dk-bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 dk-text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                Borrowed {activeBorrowedLoans.length > 0 && <span className="ml-1 text-[11px] opacity-80">({activeBorrowedLoans.length})</span>}
              </button>
              <button
                type="button"
                onClick={() => setLoanFilter('completed')}
                className={`px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  loanFilter === 'completed'
                    ? 'bg-white dark:bg-slate-900 dk-bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 dk-text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                Completed {completedLoans.length > 0 && <span className="ml-1 text-[11px] opacity-80">({completedLoans.length})</span>}
              </button>
            </div>

            {/* Completed sub-filter: All | Lent | Borrowed */}
            {loanFilter === 'completed' && (
              <div className="inline-flex bg-slate-100 dark:bg-slate-800/80 dk-bg-slate-900 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 dk-border-slate-700">
                <button
                  type="button"
                  onClick={() => setCompletedFilter('all')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                    completedFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 dk-bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 dk-text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedFilter('lent')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                    completedFilter === 'lent'
                      ? 'bg-white dark:bg-slate-900 dk-bg-slate-700 text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 dk-text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  Lent
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedFilter('borrowed')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                    completedFilter === 'borrowed'
                      ? 'bg-white dark:bg-slate-900 dk-bg-slate-700 text-rose-600 dark:text-rose-400 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 dk-text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  Borrowed
                </button>
              </div>
            )}
          </div>

          {/* Empty State */}
          {displayedLoans.length === 0 && (
            <div className="bg-white dark:bg-slate-900 dk-bg-slate-800 rounded-2xl p-8 sm:p-10 border border-slate-200/90 dark:border-slate-800 dk-border-slate-700 shadow-xs flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400 dark:text-slate-500">
                <Landmark className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200 dk-text-slate-300">
                {getEmptyMessage()}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 dk-text-slate-400 mt-1 max-w-sm">
                {getEmptySubtitle()}
              </p>
            </div>
          )}

          {/* Loan Records List */}
          {displayedLoans.map(loan => {
            const isSettled = Number(loan.amountPaid) >= Number(loan.amount);
            const remaining = Math.max(0, Number(loan.amount) - Number(loan.amountPaid));
            const progressPercent = Math.min((Number(loan.amountPaid) / (Number(loan.amount) || 1)) * 100, 100);

            return (
              <div
                key={loan.id}
                className="card-lift bg-white dark:bg-slate-900 dk-bg-slate-800 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 dk-border-slate-700 shadow-xs relative space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                {/* Top Section: Badge, Person, Date, Amount & Actions */}
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          loan.type === 'lent'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 dk-bg-emerald-900-30 dk-text-emerald-300'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40 dk-bg-rose-900-20 dk-text-rose-300'
                        }`}
                      >
                        {loan.type === 'lent' ? 'LENT TO' : 'BORROWED FROM'}
                      </span>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white dk-text-white truncate">
                        {loan.person}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 dk-text-slate-400 mt-1 font-medium">
                      {formatLoanDate(loan.date) || 'No date'}
                      {loan.note ? ` • ${loan.note}` : ''}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white dk-text-white tracking-tight tabular-nums">
                      {formatMoney(loan.amount)}
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(loan)}
                        className="text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium cursor-pointer inline-flex items-center gap-1 transition-colors"
                        title="Edit loan"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <span className="text-slate-300 dark:text-slate-600 text-xs">•</span>
                      <button
                        type="button"
                        onClick={() => deleteLoanWithUndo(loan)}
                        className="text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium cursor-pointer inline-flex items-center gap-1 transition-colors"
                        title="Delete loan"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress & Repayment Section */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">Paid back</span>
                    <span className="text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatMoney(loan.amountPaid)} of {formatMoney(loan.amount)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full progress-smooth ${
                        isSettled ? 'bg-emerald-500' : 'bg-blue-600 dark:bg-blue-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Inline Repayment Row (if not settled) */}
                  {!isSettled ? (
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-1">
                      <div className="relative flex-1 min-w-[120px]">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                          <CurrencyIcon className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          max={remaining}
                          value={paymentInputs[loan.id] || ''}
                          onChange={e => setPaymentInputs({ ...paymentInputs, [loan.id]: e.target.value })}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              recordLoanPayment(loan.id);
                            }
                          }}
                          placeholder="Record a repayment"
                          className="w-full h-9 pl-9 pr-3 bg-slate-50/70 dark:bg-slate-800/50 dk-bg-slate-900 border border-slate-200 dark:border-slate-700/80 dk-border-slate-600 rounded-xl text-xs sm:text-sm font-semibold tabular-nums text-slate-900 dark:text-white dk-text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => recordLoanPayment(loan.id)}
                        className="h-9 px-3.5 sm:px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
                      >
                        Record
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Fully settled</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Loan Modal */}
      {editingLoan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[80] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 dk-bg-slate-900 rounded-3xl w-full max-w-md p-6 relative shadow-2xl modal-spring border border-slate-200/90 dark:border-slate-800 dk-border-slate-800">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white dk-text-white">
                    Edit Loan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 dk-text-slate-400 font-medium">
                    Update loan details and linked transaction
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              {/* Classification indicator (read-only, preserves lent/borrowed) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 dk-bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Classification
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                    editingLoan.type === 'lent'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40'
                  }`}
                >
                  {editingLoan.type === 'lent' ? 'Lent (You are owed)' : 'Borrowed (You owe)'}
                </span>
              </div>

              {/* Person / Entity */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Person / Entity
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={editFormData.person}
                    onChange={e => setEditFormData(p => ({ ...p, person: e.target.value }))}
                    required
                    placeholder="Person or entity name"
                    className="w-full h-10 pl-9.5 pr-3 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-medium outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Original Loan Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Original Loan Amount
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                    <CurrencyIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    step="any"
                    min={Number(editingLoan.amountPaid) > 0 ? Number(editingLoan.amountPaid) : 0.01}
                    value={editFormData.amount}
                    onChange={e => setEditFormData(p => ({ ...p, amount: e.target.value }))}
                    required
                    className="w-full h-10 pl-9.5 pr-3 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-bold tabular-nums outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
                {Number(editingLoan.amountPaid) > 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                    Repaid so far: {formatMoney(editingLoan.amountPaid)}. Amount cannot be less than {formatMoney(editingLoan.amountPaid)}.
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Loan Date
                </label>
                <DatePicker
                  value={editFormData.date}
                  onChange={e => setEditFormData(p => ({ ...p, date: e.target.value }))}
                  name="date"
                  required
                  className="h-10 text-xs sm:text-sm"
                />
              </div>

              {/* Note (optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Note (optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                    <FileText className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={editFormData.note}
                    onChange={e => setEditFormData(p => ({ ...p, note: e.target.value }))}
                    placeholder="e.g. Dinner, Rent share..."
                    className="w-full h-10 pl-9.5 pr-3 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-medium outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="flex-1 h-10 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors text-xs sm:text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow-2xs transition-colors text-xs sm:text-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
