import { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart as PieChartIcon,
  Activity,
  Sparkles,
  Wand2,
  Loader2,
  History,
  Settings,
  Landmark,
  CheckCircle,
  BarChart,
  Flame,
  Camera,
  FileText,
  Info,
} from 'lucide-react';
import TransactionForm from './TransactionForm';
import Transactions from './Transactions';

export default function Dashboard({
  currentMonthData,
  previousMonthData = { income: 0, expense: 0, savings: 0 },
  balance,
  highestSavingsMonth,
  monthlyTarget,
  handleMonthlyTargetChange,
  showBudgetSettings,
  setShowBudgetSettings,
  categoryTargets,
  handleBudgetChange,
  financialHealth,
  dailyAverage,
  formatMoney,
  openHeatmap,
  setIsTrendOpen,
  noSpendStreak,
  daysRemainingInfo,
  frequentCategory,
  magicPrompt,
  setMagicPrompt,
  handleMagicAdd,
  isMagicLoading,
  fileInputRef,
  handleFileUpload,
  isScanning,
  formData,
  handleInputChange,
  handleSubmit,
  editingId,
  isSplit,
  setIsSplit,
  splitDetails,
  setSplitDetails,
  CurrencyIcon,
  expensesByCategory,
  generateDetailedReport,
  monthLabel,
  selectedMonth,
  onSelectMonth,
  displayTransactions,
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
  initiateEdit,
  deleteTransaction,
  expenseCategories,
  incomeSources,
  paymentMethods,
  onBulkAdd,
}) {
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  const totalCategoryBudget = Object.values(categoryTargets || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);

  const prevIncome = previousMonthData?.income || 0;
  const incomeDiff = currentMonthData.income - prevIncome;
  const isNewIncome = prevIncome === 0 && currentMonthData.income > 0;
  const incomeGrowthText = prevIncome > 0
    ? `${incomeDiff > 0 ? '+' : ''}${((incomeDiff / prevIncome) * 100).toFixed(1)}%`
    : currentMonthData.income > 0
    ? 'New income'
    : '0.0%';

  const prevExpense = previousMonthData?.expense || 0;
  const expenseDiff = currentMonthData.expense - prevExpense;
  const topCategory = expensesByCategory?.[0];

  const healthScoreVal = Math.max(0, Math.min(100, Math.round(financialHealth?.score || 0)));
  const healthRatingLabel = healthScoreVal >= 80 ? 'Great shape' : healthScoreVal >= 60 ? 'Good standing' : 'Needs attention';
  const healthRatingColor = healthScoreVal >= 80 ? 'text-emerald-600 dk-text-emerald-400' : healthScoreVal >= 60 ? 'text-indigo-600 dk-text-indigo-400' : 'text-rose-600 dk-text-rose-400';
  const healthRatingBadge = healthScoreVal >= 80
    ? 'bg-emerald-50 dk-bg-emerald-900-30 text-emerald-700 dk-text-emerald-300 border-emerald-200 dk-border-emerald-800'
    : healthScoreVal >= 60
    ? 'bg-indigo-50 dk-bg-indigo-900-30 text-indigo-700 dk-text-indigo-300 border-indigo-200 dk-border-indigo-800'
    : 'bg-rose-50 dk-bg-rose-900-30 text-rose-700 dk-text-rose-300 border-rose-200 dk-border-rose-800';

  // Semicircular needle geometry (needle length 42, center at 80, 75)
  const needleAngleRad = (Math.PI * (100 - healthScoreVal)) / 100;
  const needleX = Number((80 + 42 * Math.cos(needleAngleRad)).toFixed(2));
  const needleY = Number((75 - 42 * Math.sin(needleAngleRad)).toFixed(2));

  const savingsDiff = currentMonthData.savings - monthlyTarget;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in-up print-break-inside-avoid relative z-20">
        {/* 1. Monthly Savings Card */}
        <div className="card-savings-gradient bg-indigo-600 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <button
            onClick={() => setShowBudgetSettings(!showBudgetSettings)}
            className="absolute top-6 right-6 p-1 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors z-20"
            title="Set Monthly Savings Goal"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 text-white/90 mb-2">
                <Wallet className="w-5 h-5 text-white" />
                <h2 className="font-semibold text-white">Monthly Savings</h2>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">{formatMoney(currentMonthData.savings)}</p>

              {monthlyTarget > 0 ? (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="flex justify-between text-xs mb-1 font-semibold text-white/90">
                    <span>Savings Goal</span>
                    <span>{formatMoney(monthlyTarget)}</span>
                  </div>
                  <div className="h-2 w-full bg-black/25 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        currentMonthData.savings >= monthlyTarget
                          ? 'bg-emerald-300'
                          : currentMonthData.savings > 0
                          ? 'bg-white'
                          : 'bg-rose-300'
                      }`}
                      style={{
                        width: `${Math.max(0, Math.min((currentMonthData.savings / monthlyTarget) * 100, 100))}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-medium text-white/80 mt-1">
                    <span>
                      {currentMonthData.savings > monthlyTarget
                        ? 'Ahead of goal'
                        : currentMonthData.savings === monthlyTarget
                        ? 'Goal achieved'
                        : 'Behind goal'}
                    </span>
                    <span className="font-bold text-white">
                      {currentMonthData.savings > monthlyTarget
                        ? `+${formatMoney(savingsDiff)}`
                        : currentMonthData.savings === monthlyTarget
                        ? formatMoney(monthlyTarget)
                        : `-${formatMoney(Math.abs(savingsDiff))}`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-white/20 flex justify-between items-center text-xs text-white/80">
                  <span className="font-medium">Savings Goal</span>
                  <button
                    type="button"
                    onClick={() => setShowBudgetSettings(true)}
                    className="text-[11px] font-bold underline hover:text-white transition-colors"
                  >
                    Set goal
                  </button>
                </div>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-white/25 space-y-1.5 text-xs text-white/90">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-white/80 font-medium">
                  <Landmark className="w-3.5 h-3.5 shrink-0 text-white/80" /> Total Balance
                </span>
                <span className="font-extrabold text-white">{formatMoney(balance)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-white/80 font-medium">
                  <History className="w-3.5 h-3.5 shrink-0 text-white/80" /> Best Month
                </span>
                <span className="font-bold text-white">
                  {highestSavingsMonth ? `${highestSavingsMonth.month} (${formatMoney(highestSavingsMonth.savings)})` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Monthly Income Card */}
        <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-600 dk-text-slate-400 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-600 dk-text-emerald-400" />
              <h2 className="font-semibold text-slate-800 dk-text-slate-200">Monthly Income</h2>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dk-text-white">{formatMoney(currentMonthData.income)}</p>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-200 dk-border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dk-text-slate-400 font-medium">Vs Last Month</span>
              <span className={`font-bold ${incomeDiff > 0 ? 'text-emerald-600 dk-text-emerald-400' : incomeDiff < 0 ? 'text-rose-600 dk-text-rose-400' : 'text-slate-800 dk-text-slate-200'}`}>
                {incomeDiff > 0 ? `+${formatMoney(incomeDiff)}` : incomeDiff < 0 ? `-${formatMoney(Math.abs(incomeDiff))}` : formatMoney(0)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dk-text-slate-400 font-medium">Growth</span>
              <span className={`font-bold ${incomeDiff > 0 || isNewIncome ? 'text-emerald-600 dk-text-emerald-400' : incomeDiff < 0 ? 'text-rose-600 dk-text-rose-400' : 'text-slate-800 dk-text-slate-200'}`}>
                {incomeGrowthText}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowBudgetSettings(!showBudgetSettings)}
              className="w-full mt-2 py-2 px-3 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dk-bg-slate-700 dk-hover-bg-slate-600 text-slate-700 hover:text-slate-900 dk-text-slate-200 dk-hover-text-white font-bold rounded-xl transition-colors shadow-sm text-xs"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500 dk-text-slate-400" />
              <span>Manage Budget</span>
            </button>
          </div>
        </div>

        {/* 3. Monthly Expenses Card */}
        <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-600 dk-text-slate-400 mb-2">
              <TrendingDown className="w-5 h-5 text-rose-600 dk-text-rose-400" />
              <h2 className="font-semibold text-slate-800 dk-text-slate-200">Monthly Expenses</h2>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dk-text-white">{formatMoney(currentMonthData.expense)}</p>

            {totalCategoryBudget > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dk-border-slate-700">
                <div className="flex justify-between text-xs mb-1 font-semibold text-slate-700 dk-text-slate-300">
                  <span>Category Limits</span>
                  <span>{formatMoney(totalCategoryBudget)}</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dk-bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${currentMonthData.expense > totalCategoryBudget ? 'bg-rose-500' : 'bg-indigo-500'}`}
                    style={{ width: `${Math.min((currentMonthData.expense / totalCategoryBudget) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-200 dk-border-slate-700 space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dk-text-slate-400 font-medium">Daily Average</span>
              <span className="font-bold text-slate-800 dk-text-slate-200">{formatMoney(dailyAverage)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dk-text-slate-400 font-medium">Vs Last Month</span>
              <span className={`font-bold ${expenseDiff > 0 ? 'text-rose-600 dk-text-rose-400' : expenseDiff < 0 ? 'text-emerald-600 dk-text-emerald-400' : 'text-slate-800 dk-text-slate-200'}`}>
                {expenseDiff > 0 ? `+${formatMoney(expenseDiff)}` : expenseDiff < 0 ? `-${formatMoney(Math.abs(expenseDiff))}` : formatMoney(0)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dk-text-slate-400 font-medium">Top Category</span>
              <span className="font-bold text-slate-800 dk-text-slate-200 truncate max-w-[130px] text-right" title={topCategory?.amount > 0 ? `${topCategory.label || 'Other'}: ${formatMoney(topCategory.amount)}` : 'No expenses'}>
                {topCategory?.amount > 0 ? `${topCategory.label || 'Other'} (${formatMoney(topCategory.amount)})` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Health Score Card */}
        <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm flex flex-col justify-between group relative hover:z-30">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-slate-600 dk-text-slate-400 min-w-0">
                <Activity className="w-5 h-5 shrink-0 text-indigo-600 dk-text-indigo-400" />
                <h2 className="font-semibold text-slate-800 dk-text-slate-200 whitespace-nowrap">Health Score</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                className="p-1 text-slate-400 hover:text-indigo-600 dk-text-slate-400 dk-hover-text-indigo-400 bg-slate-100 dk-bg-slate-700 rounded-md transition-colors"
                title={showScoreBreakdown ? 'Hide score breakdown' : 'Show score breakdown'}
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Semicircular Gauge */}
            <div className="flex flex-col items-center my-1">
              <svg viewBox="0 0 160 85" className="w-36 h-auto overflow-visible" aria-label={`Health score gauge: ${healthScoreVal} out of 100`}>
                <defs>
                  <linearGradient id="healthScoreGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                {/* Background Track */}
                <path
                  d="M 24 75 A 56 56 0 0 1 136 75"
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-200 dk-text-slate-700"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Foreground Colored Track */}
                <path
                  d="M 24 75 A 56 56 0 0 1 136 75"
                  fill="none"
                  stroke="url(#healthScoreGaugeGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="176"
                  strokeDashoffset={176 * (1 - healthScoreVal / 100)}
                  className="transition-all duration-700 ease-out"
                />
                {/* Needle Pointer */}
                <line
                  x1="80"
                  y1="75"
                  x2={needleX}
                  y2={needleY}
                  stroke="currentColor"
                  className="text-slate-800 dk-text-white transition-all duration-700 ease-out"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Needle Pivot */}
                <circle cx="80" cy="75" r="5" fill="currentColor" className="text-slate-800 dk-text-white" />
                <circle cx="80" cy="75" r="2" fill="white" className="dk-fill-slate-900" />
                {/* Scale Limits */}
                <text x="18" y="83" fontSize="8" fontWeight="700" textAnchor="middle" fill="currentColor" className="text-slate-400 dk-text-slate-500">0</text>
                <text x="142" y="83" fontSize="8" fontWeight="700" textAnchor="middle" fill="currentColor" className="text-slate-400 dk-text-slate-500">100</text>
              </svg>
              <div className="flex items-baseline gap-1 -mt-1">
                <span className="text-2xl font-black text-slate-900 dk-text-white">{healthScoreVal}</span>
                <span className="text-[11px] font-bold text-slate-400 dk-text-slate-500">/ 100</span>
              </div>
              <div className="mt-1">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${healthRatingBadge}`}>
                  {healthRatingLabel}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 dk-text-slate-400 mt-1 leading-relaxed text-center font-medium">{financialHealth?.message}</p>
          </div>

          <div
            className={`absolute top-full left-0 mt-3 w-full p-4 bg-white dk-bg-slate-900 border border-slate-200 dk-border-slate-700 text-slate-800 dk-text-white text-xs rounded-2xl shadow-2xl z-50 transition-all duration-300 ${
              showScoreBreakdown
                ? 'opacity-100 pointer-events-auto translate-y-0'
                : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto -translate-y-2 group-hover:translate-y-0'
            }`}
          >
            <div className="flex items-center justify-between mb-2 border-b border-slate-200 dk-border-slate-700 pb-1">
              <p className="font-bold text-indigo-600 dk-text-indigo-400">Score Breakdown:</p>
              {showScoreBreakdown && (
                <button
                  type="button"
                  onClick={() => setShowScoreBreakdown(false)}
                  className="text-slate-400 hover:text-slate-600 dk-hover-text-slate-200 text-[10px] font-bold"
                >
                  Close
                </button>
              )}
            </div>
            <ul className="space-y-1.5">
              {(financialHealth?.breakdown || []).map((item, idx) => (
                <li key={idx} className="flex items-center gap-1.5 text-slate-700 dk-text-slate-300 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 dk-text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-200 dk-border-slate-700 flex justify-between items-center text-xs font-medium text-slate-600 dk-text-slate-400">
            <span>Interpretation</span>
            <span className={`font-bold ${healthRatingColor}`}>{healthRatingLabel}</span>
          </div>
        </div>
      </div>

      {showBudgetSettings && (
        <div className="bg-indigo-50 dk-bg-indigo-900-20 rounded-3xl p-6 border border-indigo-200 dk-border-indigo-800 relative z-10">
          <h3 className="text-lg font-bold mb-4 text-indigo-950 dk-text-indigo-200">Set Monthly Targets</h3>
          <div className="flex flex-wrap gap-4">
            <div className="dark-card bg-white dk-bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dk-border-slate-700">
              <label className="text-xs font-semibold text-slate-600 dk-text-slate-400 block mb-1">Monthly Savings Target</label>
              <input
                type="number"
                min="0"
                value={monthlyTarget}
                onChange={(e) => handleMonthlyTargetChange(e.target.value)}
                placeholder="e.g. 3000"
                className="w-36 px-3 py-1 bg-slate-50 dk-bg-slate-900 rounded-lg border border-slate-300 dk-border-slate-700 text-slate-900 dk-text-white transition-all outline-none font-bold"
              />
              <span className="text-[10px] text-slate-500 dk-text-slate-400 block mt-1">Amount to save this month</span>
            </div>
            {expenseCategories.map(cat => (
              <div key={cat.id} className="dark-card bg-white dk-bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dk-border-slate-700">
                <label className="text-xs font-semibold text-slate-600 dk-text-slate-400 block mb-1">
                  {cat.icon} {cat.label}
                </label>
                <input
                  type="number"
                  min="0"
                  value={categoryTargets[cat.id] || ''}
                  onChange={(e) => handleBudgetChange(cat.id, e.target.value)}
                  placeholder="No limit"
                  className="w-28 px-3 py-1 bg-slate-50 dk-bg-slate-900 rounded-lg border border-slate-300 dk-border-slate-700 text-slate-900 dk-text-white transition-all outline-none font-bold"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up stagger-1 relative z-0">
        <div
          onClick={openHeatmap}
          className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm flex flex-col justify-center items-center cursor-pointer group hover:shadow-md hover:border-indigo-300 dk-hover-border-indigo-700 transition-all duration-300 min-h-[200px]"
        >
          <div className="w-16 h-16 bg-indigo-50 dk-bg-indigo-900-30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Calendar className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dk-text-white">Daily Heatmap</h3>
          <p className="text-sm text-slate-600 dk-text-slate-400 text-center mt-1">Explore daily spending patterns.</p>
        </div>

        <div
          onClick={() => setIsTrendOpen(true)}
          className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm flex flex-col justify-center items-center cursor-pointer group hover:shadow-md hover:border-emerald-300 dk-hover-border-emerald-700 transition-all duration-300 min-h-[200px]"
        >
          <div className="w-16 h-16 bg-emerald-50 dk-bg-emerald-900-30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <BarChart className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dk-text-white">6-Month Trend</h3>
          <p className="text-sm text-slate-600 dk-text-slate-400 text-center mt-1">Visualize income vs expenses.</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dk-from-orange-900-10 rounded-3xl p-6 border border-orange-200 dk-border-orange-800-30 shadow-sm flex flex-col justify-between min-h-[200px]">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dk-text-white flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-500" /> Streaks & Habits
            </h3>
            <div className="space-y-3">
              <div className="dark-card flex justify-between items-center bg-white dk-bg-slate-800 p-3 rounded-xl shadow-sm border border-orange-100 dk-border-slate-700">
                <span className="text-sm font-semibold text-slate-700 dk-text-slate-300">No-Spend Streak</span>
                <span className="font-extrabold text-orange-500 flex items-center gap-1">
                  <Flame className="w-4 h-4 fill-current" /> {noSpendStreak} Days
                </span>
              </div>
              <div className="dark-card flex justify-between items-center bg-white dk-bg-slate-800 p-3 rounded-xl shadow-sm border border-orange-100 dk-border-slate-700">
                <span className="text-sm font-semibold text-slate-700 dk-text-slate-300">Days Remaining</span>
                <span className="font-extrabold text-slate-800 dk-text-slate-100">{daysRemainingInfo.label}</span>
              </div>
            </div>
          </div>
          {frequentCategory && (
            <div className="mt-4 p-3 bg-indigo-50 dk-bg-indigo-900-30 rounded-xl text-xs font-semibold text-indigo-900 dk-text-indigo-300">
              💡 You've purchased items under <strong>{frequentCategory.label}</strong> {frequentCategory.count} times this month.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dk-from-indigo-900-20 rounded-3xl p-6 border border-indigo-200 dk-border-indigo-800-50 shadow-sm">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-indigo-950 dk-text-indigo-200">
              <Sparkles className="w-5 h-5 text-indigo-500" /> Magic Add & Receipt Scan
            </h3>
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                value={magicPrompt}
                onChange={(e) => setMagicPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMagicAdd()}
                placeholder="e.g. 240 snacks or 1000 salary"
                className="flex-1 px-3 py-2 bg-white dk-bg-slate-800 border border-slate-300 dk-border-slate-700 rounded-xl text-sm text-slate-900 dk-text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleMagicAdd}
                disabled={isMagicLoading}
                className="px-3 py-2 bg-indigo-600 text-white rounded-xl shadow disabled:opacity-70 hover:bg-indigo-700"
              >
                {isMagicLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              </button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="px-3 py-2 bg-purple-600 text-white rounded-xl shadow flex items-center hover:bg-purple-700"
                title="Scan Receipt"
              >
                {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <TransactionForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            editingId={editingId}
            isSplit={isSplit}
            setIsSplit={setIsSplit}
            splitDetails={splitDetails}
            setSplitDetails={setSplitDetails}
            expenseCategories={expenseCategories}
            incomeSources={incomeSources}
            paymentMethods={paymentMethods}
            CurrencyIcon={CurrencyIcon}
            onBulkAdd={onBulkAdd}
          />

          <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dk-text-white flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-500" /> Top Spending
            </h3>
            <div className="space-y-3">
              {expensesByCategory.slice(0, 5).map(cat => (
                <div key={cat.id}>
                  <div className="flex justify-between text-xs mb-1 font-bold text-slate-700 dk-text-slate-300">
                    <span>
                      {cat.icon} {cat.label}
                    </span>
                    <span>{formatMoney(cat.amount)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dk-bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.color} rounded-full`}
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={generateDetailedReport}
              className="w-full py-2.5 bg-indigo-600 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl text-sm shadow flex justify-center items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <FileText className="w-4 h-4" /> AI Month Report
            </button>
          </div>
        </div>

        <Transactions
          formatMoney={formatMoney}
          monthLabel={monthLabel}
          selectedMonth={selectedMonth}
          onSelectMonth={onSelectMonth}
          displayTransactions={displayTransactions}
          currentMonthData={currentMonthData}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filter={filter}
          setFilter={setFilter}
          initiateEdit={initiateEdit}
          deleteTransaction={deleteTransaction}
          expenseCategories={expenseCategories}
          incomeSources={incomeSources}
        />
      </div>
    </>
  );
}
