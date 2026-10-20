import { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CreditCard,
  Edit2,
  Search,
  Trash2,
  SlidersHorizontal,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { shiftMonth } from '../utils/dates.js';
import { CategoryIcon, PaymentMethodIcon } from './CategoryIcon';

// Format YYYY-MM-DD into "Feb 5, 2026"
const formatDateLabel = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return dateStr;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function Transactions({
  formatMoney,
  monthLabel,
  selectedMonth,
  onSelectMonth,
  displayTransactions,
  currentMonthData,
  searchQuery,
  setSearchQuery,
  filter = 'all',
  setFilter,
  initiateEdit,
  deleteTransaction,
  expenseCategories = [],
  incomeSources = [],
  paymentMethods = [
    { id: 'upi', label: 'UPI' },
    { id: 'cash', label: 'Cash' },
    { id: 'card', label: 'Card' },
    { id: 'bank', label: 'Bank Transfer' },
    { id: 'wallet', label: 'Wallet' },
  ],
}) {
  // Sort State
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'

  // Filter Popover Visibility & Active Category in Popover
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [popoverCategory, setPopoverCategory] = useState('status'); // 'status' | 'category' | 'method' | 'amount'
  const filterPopoverRef = useRef(null);

  // Applied Advanced Filters
  const [appliedFilters, setAppliedFilters] = useState({
    status: 'all', // 'all' | 'completed' | 'income' | 'expense' | 'loan'
    categories: [], // array of category IDs (empty means all)
    methods: [], // array of payment method IDs (empty means all)
    minAmount: '',
    maxAmount: '',
  });

  // Draft filters while popover is open
  const [draftFilters, setDraftFilters] = useState(appliedFilters);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target)) {
        setShowFilterPopover(false);
      }
    };
    if (showFilterPopover) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showFilterPopover]);

  // Open Popover and copy applied to draft
  const handleOpenPopover = () => {
    setDraftFilters({ ...appliedFilters });
    setShowFilterPopover(!showFilterPopover);
  };

  // Count active applied filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.status && appliedFilters.status !== 'all') count++;
    if (appliedFilters.categories && appliedFilters.categories.length > 0) count += appliedFilters.categories.length;
    if (appliedFilters.methods && appliedFilters.methods.length > 0) count += appliedFilters.methods.length;
    if (appliedFilters.minAmount || appliedFilters.maxAmount) count++;
    return count;
  }, [appliedFilters]);

  // Count draft filters
  const draftFilterCount = useMemo(() => {
    let count = 0;
    if (draftFilters.status && draftFilters.status !== 'all') count++;
    if (draftFilters.categories && draftFilters.categories.length > 0) count += draftFilters.categories.length;
    if (draftFilters.methods && draftFilters.methods.length > 0) count += draftFilters.methods.length;
    if (draftFilters.minAmount || draftFilters.maxAmount) count++;
    return count;
  }, [draftFilters]);

  // Clear all draft filters
  const handleClearDraft = () => {
    setDraftFilters({
      status: 'all',
      categories: [],
      methods: [],
      minAmount: '',
      maxAmount: '',
    });
  };

  // Clear all applied filters
  const handleClearAll = () => {
    const reset = {
      status: 'all',
      categories: [],
      methods: [],
      minAmount: '',
      maxAmount: '',
    };
    setAppliedFilters(reset);
    setDraftFilters(reset);
    if (setFilter) setFilter('all');
  };

  // Apply draft filters
  const handleApplyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setShowFilterPopover(false);
  };

  // All category options combined
  const allCategories = useMemo(() => {
    const list = [];
    (expenseCategories || []).forEach(c => list.push({ ...c, type: 'expense' }));
    (incomeSources || []).forEach(c => list.push({ ...c, type: 'income' }));
    return list;
  }, [expenseCategories, incomeSources]);

  // Filter & Sort pipeline
  const processedTransactions = useMemo(() => {
    let list = [...(displayTransactions || [])];

    // Effective type: combine filter or applied status
    const effectiveType = filter !== 'all' ? filter : appliedFilters.status;
    if (effectiveType === 'income') {
      list = list.filter(t => t.type === 'income');
    } else if (effectiveType === 'expense') {
      list = list.filter(t => t.type === 'expense');
    } else if (effectiveType === 'loan') {
      list = list.filter(t => Boolean(t.linkedLoanId));
    }

    // Category filter
    if (appliedFilters.categories && appliedFilters.categories.length > 0) {
      list = list.filter(t => appliedFilters.categories.includes(t.category));
    }

    // Payment method filter
    if (appliedFilters.methods && appliedFilters.methods.length > 0) {
      list = list.filter(t => appliedFilters.methods.includes(t.paymentMethod));
    }

    // Amount range filter
    if (appliedFilters.minAmount !== '' && !Number.isNaN(Number(appliedFilters.minAmount))) {
      list = list.filter(t => t.amount >= Number(appliedFilters.minAmount));
    }
    if (appliedFilters.maxAmount !== '' && !Number.isNaN(Number(appliedFilters.maxAmount))) {
      list = list.filter(t => t.amount <= Number(appliedFilters.maxAmount));
    }

    // Sort order
    list.sort((a, b) => {
      if (sortBy === 'date-desc') return (b.date || '').localeCompare(a.date || '');
      if (sortBy === 'date-asc') return (a.date || '').localeCompare(b.date || '');
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    return list;
  }, [displayTransactions, filter, appliedFilters, sortBy]);

  return (
    <div className="card-lift bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col relative">
      {/* 1. Header / Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Statement & History</span>
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
              {processedTransactions.length} of {displayTransactions.length} records
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {monthLabel(selectedMonth)} statement ledger
          </p>
        </div>

        {/* Month Summary Outflow / Inflow Pills */}
        <div className="flex items-center gap-3 text-xs tabular-nums">
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-right">
            <span className="text-[10px] uppercase font-semibold text-rose-500 block">Outflow</span>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
              -{formatMoney(currentMonthData.expense)}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-right">
            <span className="text-[10px] uppercase font-semibold text-emerald-500 block">Inflow</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              +{formatMoney(currentMonthData.income)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar Matching CashSync Screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-3 border-b border-slate-100 dark:border-slate-800 relative">
        {/* Left: Filter Controls Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onSelectMonth && onSelectMonth(shiftMonth(selectedMonth, -1))}
              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
              {monthLabel(selectedMonth, { month: 'short', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => onSelectMonth && onSelectMonth(shiftMonth(selectedMonth, 1))}
              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* "All Transaction ∨" Dropdown Pill */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter && setFilter(e.target.value)}
              className="appearance-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-xl border border-slate-200/80 dark:border-slate-700 cursor-pointer outline-none transition-colors"
            >
              <option value="all">All Transactions</option>
              <option value="income">Money In (Income)</option>
              <option value="expense">Money Out (Expense)</option>
              <option value="loan">Loan-Linked</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
          </div>

          {/* "Date ∨" Sort Dropdown Pill */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-xl border border-slate-200/80 dark:border-slate-700 cursor-pointer outline-none transition-colors"
            >
              <option value="date-desc">Date: Newest</option>
              <option value="date-asc">Date: Oldest</option>
              <option value="amount-desc">Amount: Highest</option>
              <option value="amount-asc">Amount: Lowest</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
          </div>

          {/* "Filter ⊶" Button that triggers the Screenshot's Filter Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={handleOpenPopover}
              className={`flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-xl border transition-all ${
                activeFilterCount > 0 || showFilterPopover
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/80 shadow-2xs font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* THE FILTER POPOVER (Exact Layout & Behavior from Screenshot) */}
            {showFilterPopover && (
              <div
                ref={filterPopoverRef}
                className="absolute left-0 sm:left-auto sm:right-auto top-full mt-2 z-50 w-[340px] sm:w-[420px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up"
              >
                {/* 2-Column Body */}
                <div className="flex min-h-[260px] max-h-[360px]">
                  {/* Left Column: Filter Categories */}
                  <div className="w-36 shrink-0 bg-slate-50/70 dark:bg-slate-850/60 border-r border-slate-100 dark:border-slate-800 p-2 flex flex-col justify-between text-xs">
                    <div className="space-y-1">
                      {[
                        { id: 'status', label: 'Status' },
                        { id: 'category', label: 'Category' },
                        { id: 'method', label: 'Payment Method' },
                        { id: 'amount', label: 'Amount' },
                      ].map((cat) => {
                        const isActive = popoverCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setPopoverCategory(cat.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl font-semibold transition-colors text-left ${
                              isActive
                                ? 'bg-white dark:bg-slate-750 text-slate-900 dark:text-white shadow-2xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <span>{cat.label}</span>
                            {isActive && <span className="text-slate-400 text-[10px]">&gt;</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Bottom Left: (count) Clear Button */}
                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-750">
                      <button
                        type="button"
                        onClick={handleClearDraft}
                        className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline px-1 py-0.5 flex items-center gap-1"
                      >
                        <span>({draftFilterCount}) Clear</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Filter Options */}
                  <div className="flex-1 p-3.5 overflow-y-auto text-xs">
                    {/* STATUS / TYPE OPTIONS */}
                    {popoverCategory === 'status' && (
                      <div className="space-y-2">
                        <span className="font-bold text-slate-900 dark:text-white block mb-2 text-xs">
                          Status
                        </span>
                        {[
                          { id: 'all', label: 'Select all' },
                          { id: 'completed', label: 'Completed (All)' },
                          { id: 'income', label: 'Income' },
                          { id: 'expense', label: 'Expense' },
                          { id: 'loan', label: 'Loan-linked' },
                        ].map((opt) => (
                          <label
                            key={opt.id}
                            className="flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="draft_status"
                              checked={draftFilters.status === opt.id}
                              onChange={() =>
                                setDraftFilters(prev => ({ ...prev, status: opt.id }))
                              }
                              className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600"
                            />
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              {opt.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* CATEGORY OPTIONS */}
                    {popoverCategory === 'category' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            Category
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setDraftFilters(prev => ({
                                ...prev,
                                categories:
                                  prev.categories.length === allCategories.length
                                    ? []
                                    : allCategories.map(c => c.id),
                              }))
                            }
                            className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {draftFilters.categories.length === allCategories.length
                              ? 'Deselect all'
                              : 'Select all'}
                          </button>
                        </div>
                        {allCategories.map((cat) => {
                          const isChecked = draftFilters.categories.includes(cat.id);
                          return (
                            <label
                              key={cat.id}
                              className="flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  setDraftFilters(prev => ({
                                    ...prev,
                                    categories: isChecked
                                      ? prev.categories.filter(id => id !== cat.id)
                                      : [...prev.categories, cat.id],
                                  }))
                                }
                                className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600"
                              />
                              <CategoryIcon category={cat.id} className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                                {cat.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* PAYMENT METHOD OPTIONS */}
                    {popoverCategory === 'method' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            Payment Method
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setDraftFilters(prev => ({
                                ...prev,
                                methods:
                                  prev.methods.length === paymentMethods.length
                                    ? []
                                    : paymentMethods.map(m => m.id),
                              }))
                            }
                            className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {draftFilters.methods.length === paymentMethods.length
                              ? 'Deselect all'
                              : 'Select all'}
                          </button>
                        </div>
                        {paymentMethods.map((m) => {
                          const isChecked = draftFilters.methods.includes(m.id);
                          return (
                            <label
                              key={m.id}
                              className="flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  setDraftFilters(prev => ({
                                    ...prev,
                                    methods: isChecked
                                      ? prev.methods.filter(id => id !== m.id)
                                      : [...prev.methods, m.id],
                                  }))
                                }
                                className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600"
                              />
                              <PaymentMethodIcon method={m.id} className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                                {m.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* AMOUNT RANGE OPTIONS */}
                    {popoverCategory === 'amount' && (
                      <div className="space-y-3">
                        <span className="font-bold text-slate-900 dark:text-white block mb-1 text-xs">
                          Amount Range
                        </span>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                            Minimum Amount
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 100"
                            value={draftFilters.minAmount}
                            onChange={(e) =>
                              setDraftFilters(prev => ({ ...prev, minAmount: e.target.value }))
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                            Maximum Amount
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 5000"
                            value={draftFilters.maxAmount}
                            onChange={(e) =>
                              setDraftFilters(prev => ({ ...prev, maxAmount: e.target.value }))
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Popover Footer: Cancel & Apply Buttons */}
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowFilterPopover(false)}
                    className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Filter Clear Tag */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center gap-1 px-2 py-1 rounded-lg transition-colors"
              title="Clear all active filters"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Right: Search Input (Matching "Search or jump to...") */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 pointer-events-none">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search or jump to..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-44 sm:w-56 pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* 3. Data-Dense Table Styled Directly After CashSync Screenshot */}
      <div className="overflow-x-auto">
        {processedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-16">
            <CreditCard className="w-10 h-10 mb-2 stroke-1 text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-medium">No transactions match your current filters.</p>
            {(activeFilterCount > 0 || searchQuery) && (
              <button
                type="button"
                onClick={handleClearAll}
                className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">To/From</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Payment Method</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/60">
              {processedTransactions.map((transaction) => {
                const isIncome = transaction.type === 'income';
                const catInfo = (isIncome ? incomeSources : expenseCategories).find(
                  (c) => c.id === transaction.category
                );

                const methodInfo = (paymentMethods || []).find(
                  (m) => m.id === transaction.paymentMethod
                );

                return (
                  <tr
                    key={transaction.id}
                    className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* 1. Date (e.g. Feb 5, 2026) */}
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                      {formatDateLabel(transaction.date)}
                    </td>

                    {/* 2. To/From (Avatar Icon + Description) */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xs border border-slate-200/80 dark:border-slate-700 shrink-0">
                          <CategoryIcon category={transaction.category} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                            <span>{transaction.note ? transaction.note : catInfo?.label || 'Other'}</span>
                            {transaction.linkedLoanId && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold" title="Linked Loan">
                                <AlertCircle className="w-3 h-3" />
                              </span>
                            )}
                          </p>
                          {transaction.linkedLoanId && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block">
                              Loan principal/repayment
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 3. Category (Colored pill badge like screenshot) */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                        <CategoryIcon category={transaction.category} className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[120px]">{catInfo?.label || 'Other'}</span>
                      </span>
                    </td>

                    {/* 4. Payment Method */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                        <PaymentMethodIcon method={transaction.paymentMethod} className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{methodInfo?.label || transaction.paymentMethod?.toUpperCase() || 'UPI'}</span>
                      </span>
                    </td>

                    {/* 5. Amount */}
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`font-bold tabular-nums tracking-tight text-xs sm:text-sm ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatMoney(transaction.amount)}
                      </span>
                    </td>

                    {/* 6. Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {!transaction.linkedLoanId && (
                          <button
                            type="button"
                            onClick={() => initiateEdit(transaction)}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteTransaction(transaction.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
