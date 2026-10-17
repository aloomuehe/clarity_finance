import { useState, useRef, useEffect } from 'react';
import {
  Target,
  BarChart3,
  CircleDot,
  PlusCircle,
  Plus,
  Trash2,
  Edit2,
  X,
  Bookmark,
  FileText,
  Calendar,
  MoreVertical,
  CheckCircle,
  SlidersHorizontal,
  ChevronDown,
  Laptop,
  Car,
  Plane,
  Home,
  ShieldAlert,
  Gift,
  GraduationCap,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import DatePicker from './DatePicker.jsx';

const formatGoalDate = (dateStr) => {
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

const getGoalIcon = (name = '') => {
  const lower = name.toLowerCase();
  if (
    lower.includes('laptop') ||
    lower.includes('pc') ||
    lower.includes('mac') ||
    lower.includes('computer') ||
    lower.includes('phone') ||
    lower.includes('tech') ||
    lower.includes('gadget') ||
    lower.includes('hello')
  ) {
    return Laptop;
  }
  if (
    lower.includes('car') ||
    lower.includes('bike') ||
    lower.includes('vehicle') ||
    lower.includes('auto') ||
    lower.includes('motor')
  ) {
    return Car;
  }
  if (
    lower.includes('vacation') ||
    lower.includes('travel') ||
    lower.includes('trip') ||
    lower.includes('holiday') ||
    lower.includes('flight') ||
    lower.includes('tour')
  ) {
    return Plane;
  }
  if (
    lower.includes('home') ||
    lower.includes('house') ||
    lower.includes('flat') ||
    lower.includes('rent') ||
    lower.includes('furniture')
  ) {
    return Home;
  }
  if (
    lower.includes('emergency') ||
    lower.includes('medical') ||
    lower.includes('health') ||
    lower.includes('insurance')
  ) {
    return ShieldAlert;
  }
  if (
    lower.includes('wedding') ||
    lower.includes('ring') ||
    lower.includes('gift') ||
    lower.includes('anniversary')
  ) {
    return Gift;
  }
  if (
    lower.includes('study') ||
    lower.includes('course') ||
    lower.includes('college') ||
    lower.includes('education') ||
    lower.includes('book') ||
    lower.includes('school')
  ) {
    return GraduationCap;
  }
  if (
    lower.includes('invest') ||
    lower.includes('fund') ||
    lower.includes('stock') ||
    lower.includes('crypto')
  ) {
    return TrendingUp;
  }
  return Target;
};

const SORT_OPTIONS = [
  { id: 'progress_desc', label: 'Progress (High to Low)' },
  { id: 'progress_asc', label: 'Progress (Low to High)' },
  { id: 'target_desc', label: 'Target Amount (High to Low)' },
  { id: 'target_asc', label: 'Target Amount (Low to High)' },
  { id: 'saved_desc', label: 'Saved Amount (High to Low)' },
  { id: 'name_asc', label: 'Name (A-Z)' },
  { id: 'date_asc', label: 'Target Date (Earliest)' },
];

export default function Goals({
  formatMoney,
  goals = [],
  goalForm,
  goalInputs = {},
  handleGoalSubmit,
  setGoalForm,
  setGoalInputs,
  addGoalContribution,
  deleteWithUndo,
  setGoals,
  CurrencyIcon = DollarSign,
}) {
  const [goalFilter, setGoalFilter] = useState('active'); // 'active' | 'completed'
  const [sortBy, setSortBy] = useState('progress_desc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Edit Goal Modal State
  const [editingGoal, setEditingGoal] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    target: '',
    current: '',
    targetDate: '',
    note: '',
  });

  const sortRef = useRef(null);
  const menuRef = useRef(null);
  const nameInputRef = useRef(null);

  // Goal completion derived from authoritative target & current amounts
  const isGoalCompleted = (g) => Number(g.target) > 0 && Number(g.current) >= Number(g.target);

  const activeGoals = (goals || []).filter(g => !isGoalCompleted(g));
  const completedGoals = (goals || []).filter(isGoalCompleted);

  // Summary figures
  const totalGoalsCount = (goals || []).length;
  const totalSaved = (goals || []).reduce((acc, g) => acc + (Number(g.current) || 0), 0);
  const totalTarget = (goals || []).reduce((acc, g) => acc + (Number(g.target) || 0), 0);
  const overallProgressPct = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  const getProgressEncouragement = () => {
    if (totalTarget === 0) return 'No goals yet';
    if (overallProgressPct >= 100) return 'All goals completed!';
    if (overallProgressPct >= 75) return 'Almost there! Keep pushing!';
    if (overallProgressPct >= 50) return 'Halfway there! Great progress!';
    if (overallProgressPct > 0) return "You're on your way!";
    return 'Start your savings journey!';
  };

  // Filter & Sort
  const rawList = goalFilter === 'completed' ? completedGoals : activeGoals;
  const displayedGoals = [...rawList].sort((a, b) => {
    const targetA = Number(a.target) || 0;
    const targetB = Number(b.target) || 0;
    const currentA = Number(a.current) || 0;
    const currentB = Number(b.current) || 0;
    const pctA = targetA > 0 ? currentA / targetA : 0;
    const pctB = targetB > 0 ? currentB / targetB : 0;

    if (sortBy === 'progress_desc') return pctB - pctA;
    if (sortBy === 'progress_asc') return pctA - pctB;
    if (sortBy === 'target_desc') return targetB - targetA;
    if (sortBy === 'target_asc') return targetA - targetB;
    if (sortBy === 'saved_desc') return currentB - currentA;
    if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'date_asc') {
      if (!a.targetDate) return 1;
      if (!b.targetDate) return -1;
      return a.targetDate.localeCompare(b.targetDate);
    }
    return 0;
  });

  const emptyMessage = goalFilter === 'completed' ? 'No completed savings goals yet.' : 'No active savings goals.';
  const emptySubtitle = goalFilter === 'completed'
    ? 'Goals will appear here once you reach your target amount.'
    : 'Create your first goal above to track progress.';

  // Focus add goal form when top "+ Add Goal" button clicked
  const handleAddGoalClick = () => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSortOpen(false);
        setActiveMenuId(null);
        if (editingGoal) setEditingGoal(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingGoal]);

  // Edit Goal handlers
  const handleOpenEdit = (goal) => {
    setEditingGoal(goal);
    setEditFormData({
      name: goal.name || '',
      target: goal.target !== undefined ? String(goal.target) : '',
      current: goal.current !== undefined ? String(goal.current) : '',
      targetDate: goal.targetDate || '',
      note: goal.note || '',
    });
    setActiveMenuId(null);
  };

  const handleCloseEdit = () => {
    setEditingGoal(null);
    setEditFormData({ name: '', target: '', current: '', targetDate: '', note: '' });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingGoal) return;
    const target = Number(editFormData.target);
    const current = Number(editFormData.current || 0);
    if (!editFormData.name.trim() || !Number.isFinite(target) || target <= 0 || !Number.isFinite(current) || current < 0 || current > target) {
      return;
    }
    setGoals(prev => prev.map(g => {
      if (g.id !== editingGoal.id) return g;
      return {
        ...g,
        name: editFormData.name.trim(),
        target,
        current,
        targetDate: editFormData.targetDate || '',
        note: editFormData.note || '',
      };
    }));
    handleCloseEdit();
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.id === sortBy)?.label.split(' ')[0] || 'Progress';

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Goals
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Save for what matters. Track your progress and stay motivated.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddGoalClick}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Goal</span>
        </button>
      </div>

      {/* 2. Top Summary Cards: Total Saved, Total Target, Overall Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Saved Card */}
        <div className="bg-white dark:bg-slate-900 dk-bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 dk-border-slate-700 shadow-xs flex items-center justify-between transition-all">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Saved
              </span>
              <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums mt-0.5 truncate">
                {formatMoney(totalSaved)}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block truncate">
                Across {totalGoalsCount} {totalGoalsCount === 1 ? 'goal' : 'goals'}
              </span>
            </div>
          </div>
        </div>

        {/* Total Target Card */}
        <div className="bg-white dark:bg-slate-900 dk-bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 dk-border-slate-700 shadow-xs flex items-center justify-between transition-all">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-11 h-11 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/40">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Target
              </span>
              <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums mt-0.5 truncate">
                {formatMoney(totalTarget)}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block truncate">
                Across {totalGoalsCount} {totalGoalsCount === 1 ? 'goal' : 'goals'}
              </span>
            </div>
          </div>
        </div>

        {/* Overall Progress Card */}
        <div className="bg-white dark:bg-slate-900 dk-bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 dk-border-slate-700 shadow-xs flex items-center justify-between transition-all">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
              <CircleDot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Overall Progress
              </span>
              <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums mt-0.5 truncate">
                {overallProgressPct.toFixed(1)}%
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block truncate">
                {getProgressEncouragement()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Add New Goal Form */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 dk-bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 dk-border-slate-700 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                <PlusCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white dk-text-white">
                  Add New Goal
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Start saving for something important.
                </p>
              </div>
            </div>

            <form onSubmit={handleGoalSubmit} className="space-y-3.5">
              {/* Goal Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 dk-text-slate-300 mb-1.5">
                  Goal Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Bookmark className="w-4 h-4" />
                  </span>
                  <input
                    ref={nameInputRef}
                    type="text"
                    placeholder="e.g. New Laptop, Vacation, Emergency Fund"
                    value={goalForm.name || ''}
                    onChange={e => setGoalForm({ ...goalForm, name: e.target.value })}
                    required
                    className="w-full h-10 pl-9.5 pr-3 bg-slate-50/70 dark:bg-slate-800/60 dk-bg-slate-900 border border-slate-200 dark:border-slate-700/80 dk-border-slate-600 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white dk-text-white font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Target Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 dk-text-slate-300 mb-1.5">
                  Target Amount
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                    <CurrencyIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="0.00"
                    value={goalForm.target || ''}
                    onChange={e => setGoalForm({ ...goalForm, target: e.target.value })}
                    required
                    className="w-full h-10 pl-9.5 pr-3 bg-slate-50/70 dark:bg-slate-800/60 dk-bg-slate-900 border border-slate-200 dark:border-slate-700/80 dk-border-slate-600 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white dk-text-white font-bold tabular-nums placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Initial Amount (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 dk-text-slate-300 mb-1.5">
                  Initial Amount (Optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                    <CurrencyIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={goalForm.current || ''}
                    onChange={e => setGoalForm({ ...goalForm, current: e.target.value })}
                    className="w-full h-10 pl-9.5 pr-3 bg-slate-50/70 dark:bg-slate-800/60 dk-bg-slate-900 border border-slate-200 dark:border-slate-700/80 dk-border-slate-600 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white dk-text-white font-bold tabular-nums placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Target Date (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 dk-text-slate-300 mb-1.5">
                  Target Date (Optional)
                </label>
                <DatePicker
                  value={goalForm.targetDate || ''}
                  onChange={e => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                  name="targetDate"
                  placeholder="dd-mm-yyyy"
                  className="h-10 text-xs sm:text-sm"
                />
              </div>

              {/* Note (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 dk-text-slate-300 mb-1.5">
                  Note (Optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                    <FileText className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. For college, travel, or emergency"
                    value={goalForm.note || ''}
                    onChange={e => setGoalForm({ ...goalForm, note: e.target.value })}
                    className="w-full h-10 pl-9.5 pr-3 bg-slate-50/70 dark:bg-slate-800/60 dk-bg-slate-900 border border-slate-200 dark:border-slate-700/80 dk-border-slate-600 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white dk-text-white font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              >
                <Plus className="w-4 h-4" />
                <span>Add Goal</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Tabs, Sort & Goal Cards */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
          {/* Controls Bar: Tabs & Sort Dropdown */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Tabs: Active (N) | Completed (N) */}
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setGoalFilter('active')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  goalFilter === 'active'
                    ? 'border border-blue-600 text-blue-600 bg-blue-50/60 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                }`}
              >
                Active ({activeGoals.length})
              </button>
              <button
                type="button"
                onClick={() => setGoalFilter('completed')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  goalFilter === 'completed'
                    ? 'border border-blue-600 text-blue-600 bg-blue-50/60 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                }`}
              >
                Completed ({completedGoals.length})
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setIsSortOpen(p => !p)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>Sort: {currentSortLabel}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-30 animate-fade-in-up">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.id);
                        setIsSortOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-xs text-left transition-colors flex items-center justify-between cursor-pointer ${
                        sortBy === opt.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.id && <CheckCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Empty State */}
          {displayedGoals.length === 0 && (
            <div className="bg-white dark:bg-slate-900 dk-bg-slate-800 rounded-2xl p-8 sm:p-10 border border-slate-200/90 dark:border-slate-800 dk-border-slate-700 shadow-xs flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400 dark:text-slate-500">
                <Target className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200 dk-text-slate-300">
                {emptyMessage}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 dk-text-slate-400 mt-1 max-w-sm">
                {emptySubtitle}
              </p>
            </div>
          )}

          {/* Goal Cards List */}
          {displayedGoals.map(g => {
            const target = Number(g.target) || 0;
            const current = Number(g.current) || 0;
            const remaining = Math.max(0, target - current);
            const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
            const isDone = remaining === 0 && target > 0;
            const IconComponent = getGoalIcon(g.name);

            return (
              <div
                key={g.id}
                className="bg-white dark:bg-slate-900 dk-bg-slate-800 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 dk-border-slate-700 shadow-xs relative space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                {/* Top Section: Icon, Title, Target Subtitle, Percentage Badge & 3-Dots Menu */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-base text-slate-900 dark:text-white truncate">
                        {g.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Target: {formatMoney(target)}
                      </p>
                      {g.note && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-normal">
                          {g.note}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold tabular-nums border ${
                        isDone
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40'
                      }`}
                    >
                      {pct.toFixed(1)}%
                    </span>

                    {/* 3-dots action menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === g.id ? null : g.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="More actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === g.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-30 animate-fade-in-up"
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(g)}
                            className="w-full px-3 py-1.5 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit Goal</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteWithUndo(goals, setGoals, g.id, 'savings goal');
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Goal</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDone ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Metrics Row: Saved, Remaining / Goal reached, Target date */}
                <div className="flex items-center justify-between text-xs font-semibold gap-2 pt-0.5">
                  <span className="text-blue-600 dark:text-blue-400 font-bold tabular-nums">
                    {formatMoney(current)} saved
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium tabular-nums">
                    {isDone ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Goal reached
                      </span>
                    ) : (
                      `${formatMoney(remaining)} left`
                    )}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-normal flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{g.targetDate ? `Target: ${formatGoalDate(g.targetDate)}` : 'No deadline'}</span>
                  </span>
                </div>

                {/* Quick Add / Remove Contribution Bar */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                      <CurrencyIcon className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={goalInputs[g.id] || ''}
                      onChange={e => setGoalInputs({ ...goalInputs, [g.id]: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addGoalContribution(g.id, 1);
                        }
                      }}
                      placeholder="Add amount..."
                      className="w-full h-9 pl-9 pr-3 bg-slate-50/70 dark:bg-slate-800/50 dk-bg-slate-900 border border-slate-200 dark:border-slate-700/80 dk-border-slate-600 rounded-xl text-xs sm:text-sm font-semibold tabular-nums text-slate-900 dark:text-white dk-text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => addGoalContribution(g.id, -1)}
                    title="Remove amount from goal"
                    className="h-9 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm transition-colors cursor-pointer shrink-0"
                  >
                    &minus;
                  </button>
                  <button
                    type="button"
                    onClick={() => addGoalContribution(g.id, 1)}
                    className="h-9 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[80] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 dk-bg-slate-900 rounded-3xl w-full max-w-md p-6 relative shadow-2xl animate-fade-in-up border border-slate-200/90 dark:border-slate-800 dk-border-slate-800">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white dk-text-white">
                    Edit Goal
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 dk-text-slate-400 font-medium">
                    Update savings goal target, name, or timeline
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
              {/* Goal Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Goal Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Bookmark className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={e => setEditFormData(p => ({ ...p, name: e.target.value }))}
                    required
                    className="w-full h-10 pl-9.5 pr-3 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-medium outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Target Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Amount
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                    <CurrencyIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={editFormData.target}
                    onChange={e => setEditFormData(p => ({ ...p, target: e.target.value }))}
                    required
                    className="w-full h-10 pl-9.5 pr-3 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-bold tabular-nums outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Saved Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Already Saved
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                    <CurrencyIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max={editFormData.target || undefined}
                    value={editFormData.current}
                    onChange={e => setEditFormData(p => ({ ...p, current: e.target.value }))}
                    className="w-full h-10 pl-9.5 pr-3 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-bold tabular-nums outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Target Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Date (Optional)
                </label>
                <DatePicker
                  value={editFormData.targetDate}
                  onChange={e => setEditFormData(p => ({ ...p, targetDate: e.target.value }))}
                  name="targetDate"
                  placeholder="dd-mm-yyyy"
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
                    placeholder="e.g. For college, travel, or emergency"
                    className="w-full h-10 pl-9.5 pr-3 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-medium outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Action Buttons */}
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
