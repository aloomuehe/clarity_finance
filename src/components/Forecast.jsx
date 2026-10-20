import { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  Repeat,
  CalendarClock,
  Edit2,
  Trash2,
  Plus,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import { getTodayStr } from '../utils/dates';
import { EXPENSE_CATEGORIES as DEFAULT_CATEGORIES } from '../constants/finance';

export default function Forecast({
  formatMoney,
  projections = { projectedBalance: 0, projectedSavings: 0, upcomingRecurringTotal: 0 },
  recurring = [],
  planned = [],
  recurringForm = { name: '', amount: '', day: '1', category: 'utilities' },
  plannedForm = { name: '', amount: '', date: '', category: 'other_expense' },
  editingRecurringId = null,
  editingPlannedId = null,
  handleRecurringSubmit,
  handlePlannedSubmit,
  setRecurringForm,
  setPlannedForm,
  setEditingRecurringId,
  setEditingPlannedId,
  deleteWithUndo,
  setRecurring,
  setPlanned,
  selectedMonth = '',
  monthLabel = (m) => m,
  balance = 0,
  currentMonthData = { income: 0, expense: 0, savings: 0 },
  transactions = [],
  expenseCategories = [],
}) {
  // Local UI State
  const [recurringSearch, setRecurringSearch] = useState('');
  const [recurringTab, setRecurringTab] = useState('all'); // 'all' | 'upcoming' | 'paid'
  const [isAddingRecurring, setIsAddingRecurring] = useState(false);
  const [isAddingPlanned, setIsAddingPlanned] = useState(false);

  const categories = expenseCategories.length > 0 ? expenseCategories : DEFAULT_CATEGORIES;

  // Date context
  const todayStr = getTodayStr();
  const currentMonthStr = todayStr.slice(0, 7);
  const activeMonth = selectedMonth || currentMonthStr;
  const isCurrentForecastMonth = activeMonth === currentMonthStr;

  const [yStr, mStr] = activeMonth.split('-');
  const daysInMonth = new Date(Number(yStr), Number(mStr), 0).getDate();
  const monthEndStr = `${activeMonth}-${String(daysInMonth).padStart(2, '0')}`;
  const shortMonthName = new Date(Number(yStr), Number(mStr) - 1, 1).toLocaleDateString(undefined, {
    month: 'short',
  });

  // Calculate upcoming planned expenses this month (matches calculation in calculateProjections)
  const upcomingPlannedTotal = useMemo(() => {
    return isCurrentForecastMonth
      ? (planned || [])
          .filter((item) => item && item.date >= todayStr && item.date <= monthEndStr)
          .reduce((sum, item) => sum + Number(item.amount || 0), 0)
      : 0;
  }, [planned, isCurrentForecastMonth, todayStr, monthEndStr]);

  const totalUpcomingCommitments = (projections?.upcomingRecurringTotal || 0) + upcomingPlannedTotal;

  // Recurring Status Mapping (Paid this month vs Upcoming vs Past Due)
  const recurringStatusMap = useMemo(() => {
    const map = {};
    const todayDay = Number(todayStr.slice(8, 10));

    (recurring || []).forEach((item) => {
      if (!item || !item.id) return;
      const isPaid = (transactions || []).some(
        (t) =>
          t &&
          t.type === 'expense' &&
          t.recurringId === item.id &&
          t.recurringOccurrence === activeMonth
      );

      const dueDay = Math.min(Math.max(Number(item.day) || 1, 1), daysInMonth);
      let status = 'upcoming';
      let statusLabel;
      let statusType;

      if (isPaid) {
        status = 'paid';
        statusLabel = 'Paid this month';
        statusType = 'paid';
      } else if (isCurrentForecastMonth) {
        if (dueDay === todayDay) {
          statusLabel = 'Due today!';
          statusType = 'due_today';
        } else if (dueDay > todayDay) {
          const diff = dueDay - todayDay;
          statusLabel = diff === 1 ? 'Due tomorrow' : `Due in ${diff} days`;
          statusType = 'upcoming';
        } else {
          const diff = todayDay - dueDay;
          statusLabel = diff === 1 ? 'Due yesterday' : `Due ${diff} days ago`;
          statusType = 'overdue';
        }
      } else {
        statusLabel = `Scheduled Day ${dueDay}`;
        statusType = 'scheduled';
      }

      map[item.id] = { isPaid, dueDay, status, statusLabel, statusType };
    });
    return map;
  }, [recurring, transactions, activeMonth, todayStr, daysInMonth, isCurrentForecastMonth]);

  // Aggregate Paid Recurring Total
  const paidRecurringTotal = useMemo(() => {
    return (recurring || [])
      .filter((r) => recurringStatusMap[r.id]?.isPaid)
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  }, [recurring, recurringStatusMap]);

  // Filtered Recurring Items
  const filteredRecurring = useMemo(() => {
    return (recurring || []).filter((r) => {
      const matchesSearch =
        !recurringSearch.trim() ||
        r.name.toLowerCase().includes(recurringSearch.toLowerCase()) ||
        (r.category || '').toLowerCase().includes(recurringSearch.toLowerCase());

      if (!matchesSearch) return false;

      const info = recurringStatusMap[r.id];
      if (recurringTab === 'paid') return info?.isPaid;
      if (recurringTab === 'upcoming') return !info?.isPaid;
      return true;
    });
  }, [recurring, recurringSearch, recurringTab, recurringStatusMap]);

  // Planned items sorted by date
  const sortedPlanned = useMemo(() => {
    return [...(planned || [])].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [planned]);

  // Cancel form handlers
  const handleCancelRecurringEdit = () => {
    setEditingRecurringId(null);
    setRecurringForm({ name: '', amount: '', day: '1', category: 'utilities' });
    setIsAddingRecurring(false);
  };

  const handleCancelPlannedEdit = () => {
    setEditingPlannedId(null);
    setPlannedForm({ name: '', amount: '', date: todayStr, category: 'other_expense' });
    setIsAddingPlanned(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      {/* 1. Page Header matching Dashboard design language */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Financial Projections</span>
            <span>•</span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              {monthLabel(activeMonth)}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Forecast & Commitments
          </h2>
        </div>

        {/* Header Summary Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500 font-normal">Available Cash:</span>
            <span className="tabular-nums font-bold text-slate-900 dark:text-white">
              {formatMoney(balance)}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 text-xs font-semibold text-blue-700 dark:text-blue-300 shadow-2xs flex items-center gap-1.5">
            <span className="font-normal opacity-80">Upcoming Commitments:</span>
            <span className="tabular-nums font-bold">
              {formatMoney(totalUpcomingCommitments)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Key Projections Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Projected End-of-Month Balance */}
        <div className="card-lift bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Projected End Balance</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  projections.projectedBalance >= 0
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                }`}
              >
                {projections.projectedBalance >= 0 ? 'Safe' : 'Deficit Risk'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white mt-1">
              {formatMoney(projections.projectedBalance)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
            Available cash minus unpaid recurring & planned bills this month
          </div>
        </div>

        {/* Card 2: Projected Monthly Savings */}
        <div className="card-lift bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Projected Monthly Savings</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  projections.projectedSavings >= 0
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                }`}
              >
                {projections.projectedSavings >= 0 ? '+ Surplus' : '- Overspent'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white mt-1">
              {formatMoney(projections.projectedSavings)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Income: <strong className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">{formatMoney(currentMonthData.income)}</strong></span>
            <span>Spent: <strong className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">{formatMoney(currentMonthData.expense)}</strong></span>
          </div>
        </div>

        {/* Card 3: Upcoming Commitments Breakdown */}
        <div className="card-lift bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Upcoming Commitments</span>
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {isCurrentForecastMonth ? 'Active Month' : 'Projected'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white mt-1">
              {formatMoney(totalUpcomingCommitments)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              Recurring: <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{formatMoney(projections.upcomingRecurringTotal)}</strong>
            </span>
            <span>
              Planned: <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{formatMoney(upcomingPlannedTotal)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Section (Reference-Guided: Left = Recurring, Right = Planned) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: RECURRING PAYMENTS                          */}
        {/* ======================================================== */}
        <div className="card-lift bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          {/* Header & Quick Action */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Repeat className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recurring Payments
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Monthly subscriptions, rent, and utility bills
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (editingRecurringId) {
                  handleCancelRecurringEdit();
                } else {
                  setIsAddingRecurring((prev) => !prev);
                }
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors flex items-center gap-1.5"
            >
              {isAddingRecurring || editingRecurringId ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Bill</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Search & Summary Row matching reference screenshot */}
          <div className="space-y-3 pt-1">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="E.g. spotify, rent, wifi..."
                value={recurringSearch}
                onChange={(e) => setRecurringSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Status Pills Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setRecurringTab('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    recurringTab === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  All ({recurring.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRecurringTab('upcoming')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    recurringTab === 'upcoming'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  onClick={() => setRecurringTab('paid')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    recurringTab === 'paid'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Paid
                </button>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  Paid: <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">{formatMoney(paidRecurringTotal)}</strong>
                </span>
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  Upcoming: <strong className="text-blue-600 dark:text-blue-400 tabular-nums">{formatMoney(projections.upcomingRecurringTotal)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Add / Edit Recurring Form */}
          {(isAddingRecurring || editingRecurringId) && (
            <form
              onSubmit={(e) => {
                handleRecurringSubmit(e);
                setIsAddingRecurring(false);
              }}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 animate-fade-in-up"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {editingRecurringId ? 'Edit Recurring Bill' : 'Add New Recurring Bill'}
                </span>
                {editingRecurringId && (
                  <button
                    type="button"
                    onClick={handleCancelRecurringEdit}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Bill / Service Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Netflix, Wifi, House Rent"
                    value={recurringForm.name}
                    onChange={(e) => setRecurringForm({ ...recurringForm, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="0.00"
                    value={recurringForm.amount}
                    onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold tabular-nums text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Day of Month (1 - 31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="1"
                    value={recurringForm.day}
                    onChange={(e) => setRecurringForm({ ...recurringForm, day: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold tabular-nums text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={recurringForm.category || 'utilities'}
                    onChange={(e) => setRecurringForm({ ...recurringForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelRecurringEdit}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  {editingRecurringId ? 'Update Bill' : 'Save Recurring Bill'}
                </button>
              </div>
            </form>
          )}

          {/* Cards List matching reference screenshot */}
          {filteredRecurring.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <Repeat className="w-8 h-8 mb-2 stroke-1 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {recurringSearch ? 'No recurring bills match your search.' : 'No recurring payments configured yet.'}
              </p>
              {!recurringSearch && (
                <button
                  type="button"
                  onClick={() => setIsAddingRecurring(true)}
                  className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Add your first recurring payment
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {filteredRecurring.map((r) => {
                const info = recurringStatusMap[r.id] || {
                  isPaid: false,
                  dueDay: r.day,
                  statusLabel: `Day ${r.day}`,
                  statusType: 'neutral',
                };
                const catInfo = categories.find((c) => c.id === r.category);

                return (
                  <div
                    key={r.id}
                    className="group bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 sm:p-4 transition-all"
                  >
                    {/* Top Row: Category Icon, Title, Date Badge */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs shrink-0">
                          <CategoryIcon category={r.category || 'utilities'} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                            {r.name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {catInfo?.label || 'Utilities & Bills'}
                          </p>
                        </div>
                      </div>

                      {/* Date Badge: Large Day number + Month abbreviation (matching screenshot) */}
                      <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 flex flex-col items-center justify-center text-center shadow-2xs shrink-0">
                        <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-white leading-tight">
                          {String(info.dueDay).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mt-0.5">
                          {shortMonthName}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Due Status Badge + Amount + Edit/Delete Actions */}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                      {/* Status Pill Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          info.statusType === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                            : info.statusType === 'due_today'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
                            : info.statusType === 'overdue'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60'
                        }`}
                      >
                        {info.statusType === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                        {info.statusType === 'due_today' && <AlertCircle className="w-3 h-3" />}
                        <span>{info.statusLabel}</span>
                      </span>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-white">
                            {formatMoney(r.amount)}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                            • monthly
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRecurringId(r.id);
                              setRecurringForm({
                                name: r.name,
                                amount: r.amount,
                                day: String(r.day),
                                category: r.category || 'utilities',
                              });
                              setIsAddingRecurring(true);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                            title="Edit recurring expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteWithUndo(recurring, setRecurring, r.id, 'recurring expense')}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                            title="Delete recurring expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: PLANNED FUTURE EXPENSES                    */}
        {/* ======================================================== */}
        <div className="card-lift bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          {/* Header & Quick Action */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <CalendarClock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Planned Future Expenses
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Targeted one-off expenses and scheduled purchases
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (editingPlannedId) {
                  handleCancelPlannedEdit();
                } else {
                  setIsAddingPlanned((prev) => !prev);
                }
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors flex items-center gap-1.5"
            >
              {isAddingPlanned || editingPlannedId ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Planned</span>
                </>
              )}
            </button>
          </div>

          {/* Add / Edit Planned Form */}
          {(isAddingPlanned || editingPlannedId) && (
            <form
              onSubmit={(e) => {
                handlePlannedSubmit(e);
                setIsAddingPlanned(false);
              }}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 animate-fade-in-up"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {editingPlannedId ? 'Edit Planned Expense' : 'Add Planned Expense'}
                </span>
                {editingPlannedId && (
                  <button
                    type="button"
                    onClick={handleCancelPlannedEdit}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Expense Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flight tickets, Laptop repair"
                    value={plannedForm.name}
                    onChange={(e) => setPlannedForm({ ...plannedForm, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="0.00"
                    value={plannedForm.amount}
                    onChange={(e) => setPlannedForm({ ...plannedForm, amount: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold tabular-nums text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={plannedForm.date}
                    onChange={(e) => setPlannedForm({ ...plannedForm, date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold tabular-nums text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={plannedForm.category || 'other_expense'}
                    onChange={(e) => setPlannedForm({ ...plannedForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelPlannedEdit}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  {editingPlannedId ? 'Update Planned' : 'Save Planned Expense'}
                </button>
              </div>
            </form>
          )}

          {/* Planned Items List */}
          {sortedPlanned.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <CalendarClock className="w-8 h-8 mb-2 stroke-1 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                No planned future expenses recorded.
              </p>
              <button
                type="button"
                onClick={() => setIsAddingPlanned(true)}
                className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Plan an upcoming expense
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {sortedPlanned.map((p) => {
                const catInfo = categories.find((c) => c.id === p.category);
                const isUpcomingThisMonth =
                  isCurrentForecastMonth && p.date >= todayStr && p.date <= monthEndStr;

                return (
                  <div
                    key={p.id}
                    className="group bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 sm:p-4 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs shrink-0">
                          <CategoryIcon category={p.category || 'other_expense'} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            <span>{catInfo?.label || 'Other'}</span>
                            <span>•</span>
                            <span className="tabular-nums flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {p.date}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center gap-2.5 shrink-0 text-right">
                        <div>
                          <div className="text-xs sm:text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                            {formatMoney(p.amount)}
                          </div>
                          {isUpcomingThisMonth && (
                            <span className="inline-block text-[9px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                              Due this month
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPlannedId(p.id);
                              setPlannedForm({
                                name: p.name,
                                amount: p.amount,
                                date: p.date,
                                category: p.category || 'other_expense',
                              });
                              setIsAddingPlanned(true);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                            title="Edit planned expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteWithUndo(planned, setPlanned, p.id, 'planned expense')}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                            title="Delete planned expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Cashflow Trajectory Waterfall Explainer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Projection Calculation Breakdown
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              1. Current Cash
            </span>
            <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white mt-0.5 block">
              {formatMoney(balance)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              2. Less Unpaid Recurring
            </span>
            <span className="text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400 mt-0.5 block">
              -{formatMoney(projections.upcomingRecurringTotal)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              3. Less Unpaid Planned
            </span>
            <span className="text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400 mt-0.5 block">
              -{formatMoney(upcomingPlannedTotal)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60">
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
              = Projected Month-End
            </span>
            <span className="text-sm font-bold tabular-nums text-blue-700 dark:text-blue-300 mt-0.5 block">
              {formatMoney(projections.projectedBalance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
