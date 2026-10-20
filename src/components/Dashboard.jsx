import { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart as PieChartIcon,
  Activity,
  Settings,
  Landmark,
  CheckCircle,
  Flame,
  FileText,
  ArrowRightLeft,
  ArrowUpRight,
  CreditCard,
  Edit2,
} from 'lucide-react';
import CashflowChart from './CashflowChart';
import CategoryIcon from './CategoryIcon';

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
  expensesByCategory,
  generateDetailedReport,
  monthLabel,
  selectedMonth,
  monthTransactions = [],
  onNavigateToTransactions,
  initiateEdit,
  expenseCategories,
  incomeSources,
  sixMonthTrend,
  transactions = [],
  formatCompactMoney = (val) => String(val),
}) {
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  const totalCategoryBudget = Object.values(categoryTargets || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);

  const prevIncome = previousMonthData?.income || 0;
  const incomeDiff = currentMonthData.income - prevIncome;
  const isNewIncome = prevIncome === 0 && currentMonthData.income > 0;
  const incomeGrowthText = prevIncome > 0
    ? `${incomeDiff > 0 ? '+' : ''}${((incomeDiff / prevIncome) * 100).toFixed(1)}%`
    : currentMonthData.income > 0
    ? 'New'
    : '0.0%';

  const prevExpense = previousMonthData?.expense || 0;
  const expenseDiff = currentMonthData.expense - prevExpense;

  const healthScoreVal = Math.max(0, Math.min(100, Math.round(financialHealth?.score || 0)));
  const healthRatingLabel = healthScoreVal >= 80 ? 'Great' : healthScoreVal >= 60 ? 'Good' : 'Review';
  const healthRatingBadge = healthScoreVal >= 80
    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
    : healthScoreVal >= 60
    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';

  const savingsProgressPct = monthlyTarget > 0
    ? Math.max(0, Math.min((currentMonthData.savings / monthlyTarget) * 100, 100))
    : 0;

  const topCategories = expensesByCategory.slice(0, 4);

  // Latest 6 transactions for currently selected month, sorted descending by date
  const recentTransactions = useMemo(() => {
    return [...(monthTransactions || [])]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 6);
  }, [monthTransactions]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header matching Fazztrack */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Overview
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Financial snapshot and performance summary for {monthLabel(selectedMonth)}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Health Score Pill */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${healthRatingBadge}`}
              title="View financial health score"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="tabular-nums font-bold">{healthScoreVal}</span>
              <span className="text-[10px] hidden sm:inline">{healthRatingLabel}</span>
            </button>

            {/* Health Score Popover */}
            <div
              className={`absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-xs rounded-xl shadow-xl z-50 transition-all duration-200 origin-top-right transform ${
                showScoreBreakdown
                  ? 'opacity-100 scale-100 pointer-events-auto'
                  : 'opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto'
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 font-bold">
                <span>Health Score: {healthScoreVal}/100</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${healthRatingBadge}`}>
                  {healthRatingLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                {financialHealth?.message}
              </p>
              <ul className="space-y-1">
                {(financialHealth?.breakdown || []).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowBudgetSettings(!showBudgetSettings)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
              showBudgetSettings
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Budget Targets</span>
          </button>

          <button
            type="button"
            onClick={generateDetailedReport}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 border border-transparent transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>AI Report</span>
          </button>
        </div>
      </div>

      {/* 2. Four Primary Financial Metrics Cards (Fazztrack Reference Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
        {/* Card 1: Total Balance */}
        <div className="card-lift bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Total Balance
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-600 text-xs font-bold">···</span>
          </div>
          <div>
            <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white tabular-nums my-1 truncate">
              {formatMoney(balance)}
            </p>
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                ● Live Cash
              </span>
              <span className="truncate max-w-[120px] text-right" title={highestSavingsMonth ? `Best: ${highestSavingsMonth.month}` : ''}>
                {highestSavingsMonth ? `Best: ${highestSavingsMonth.month}` : 'Ledger active'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Monthly Income */}
        <div className="card-lift bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Monthly Income
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-600 text-xs font-bold">···</span>
          </div>
          <div>
            <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white tabular-nums my-1 truncate">
              {formatMoney(currentMonthData.income)}
            </p>
            <div className="flex items-center justify-between text-[11px] font-medium pt-1">
              <span className={`font-semibold tabular-nums truncate ${
                incomeDiff > 0 || isNewIncome
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : incomeDiff < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {incomeDiff > 0 ? '▲ ' : incomeDiff < 0 ? '▼ ' : '— '}
                {incomeGrowthText} vs last month
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Monthly Expense */}
        <div className="card-lift bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <TrendingDown className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Monthly Expense
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-600 text-xs font-bold">···</span>
          </div>
          <div>
            <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white tabular-nums my-1 truncate">
              {formatMoney(currentMonthData.expense)}
            </p>
            <div className="flex items-center justify-between text-[11px] font-medium pt-1">
              <span className={`font-semibold tabular-nums truncate ${
                expenseDiff > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : expenseDiff < 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {expenseDiff > 0 ? '▲ +' : expenseDiff < 0 ? '▼ -' : '— '}
                {formatMoney(Math.abs(expenseDiff))} vs last month
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Monthly Savings */}
        <div className="card-lift bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Monthly Savings
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-600 text-xs font-bold">···</span>
          </div>
          <div>
            <p className={`text-2xl sm:text-[26px] font-bold tracking-tight tabular-nums my-1 truncate ${
              currentMonthData.savings >= 0
                ? 'text-slate-900 dark:text-white'
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatMoney(currentMonthData.savings)}
            </p>
            <div className="flex items-center justify-between text-[11px] font-medium pt-1 text-slate-500 dark:text-slate-400">
              {monthlyTarget > 0 ? (
                <span className={`font-semibold tabular-nums ${
                  currentMonthData.savings >= monthlyTarget
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {savingsProgressPct.toFixed(0)}% of goal ({currentMonthData.savings >= monthlyTarget ? 'Achieved' : 'Behind'})
                </span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">
                  Daily burn: {formatMoney(dailyAverage)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Collapsible Budget Targets Drawer */}
      {showBudgetSettings && (
        <div className="bg-slate-50/90 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs relative z-10 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Set Monthly Targets & Limits</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure global savings target or per-category limits.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowBudgetSettings(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Done
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Monthly Savings Goal
              </label>
              <input
                type="number"
                min="0"
                value={monthlyTarget}
                onChange={(e) => handleMonthlyTargetChange(e.target.value)}
                placeholder="e.g. 3000"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Target to save this month</span>
            </div>
            {expenseCategories.map(cat => (
              <div key={cat.id} className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1 truncate">
                  <CategoryIcon category={cat.id} className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{cat.label}</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={categoryTargets[cat.id] || ''}
                  onChange={(e) => handleBudgetChange(cat.id, e.target.value)}
                  placeholder="No limit"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">Monthly category cap</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Middle Section: Cashflow Chart (~65%) + Spending Allocations (~35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Cashflow Chart */}
        <div className="lg:col-span-8 flex flex-col">
          <CashflowChart
            sixMonthTrend={sixMonthTrend}
            transactions={transactions.length > 0 ? transactions : monthTransactions}
            selectedMonth={selectedMonth}
            formatMoney={formatMoney}
            formatCompactMoney={formatCompactMoney}
            onOpenModal={() => setIsTrendOpen(true)}
          />
        </div>

        {/* Right: Asset Allocations / Spending Breakdown matching Reference */}
        <div className="card-lift lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Spending Allocations</span>
              </h3>
              <span className="text-xs text-slate-400 font-semibold">monthly</span>
            </div>

            {/* Total Spent Headline */}
            <div className="mb-4">
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {formatMoney(currentMonthData.expense)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {totalCategoryBudget > 0
                  ? `${Math.min(Math.round((currentMonthData.expense / totalCategoryBudget) * 100), 999)}% of category caps`
                  : 'Total monthly outflow'}
              </p>
            </div>

            {/* Proportional Segmented Horizontal Bar */}
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex gap-0.5 mb-4 p-0.5">
              {topCategories.length > 0 ? (
                topCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`h-full rounded-sm progress-smooth ${cat.color || 'bg-blue-500'}`}
                    style={{ width: `${Math.max(cat.percentage, 4)}%` }}
                    title={`${cat.label}: ${cat.percentage}%`}
                  />
                ))
              ) : (
                <div className="h-full w-full bg-slate-200 dark:bg-slate-700 rounded-sm" />
              )}
            </div>

            {/* Category breakdown item rows */}
            <div className="space-y-2.5">
              {topCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${cat.color || 'bg-blue-500'} shrink-0`} />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {cat.label}
                    </span>
                  </div>
                  <div className="tabular-nums font-bold text-slate-900 dark:text-white shrink-0 text-right">
                    <span>{formatMoney(cat.amount)}</span>
                    <span className="text-[10px] font-normal text-slate-400 ml-1.5">
                      ({cat.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
              {topCategories.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-3 text-center">
                  No recorded expenses this month.
                </p>
              )}
            </div>
          </div>

          {/* Quick Insights Footer */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> No-Spend Streak
              </span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                {noSpendStreak} Days
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" /> Days Left
              </span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                {daysRemainingInfo.label}
              </span>
            </div>
            {frequentCategory && (
              <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                Frequent: <strong className="text-slate-700 dark:text-slate-200">{frequentCategory.label}</strong> ({frequentCategory.count} times)
              </div>
            )}
            <button
              type="button"
              onClick={openHeatmap}
              className="w-full mt-2 py-1.5 px-3 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Daily Heatmap</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Simplified Recent Transactions Section */}
      <div className="card-lift bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Recent Transactions</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Latest activity in {monthLabel(selectedMonth)}
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateToTransactions}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-3 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center gap-1"
          >
            <span>View All ({monthTransactions.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recent Transactions List */}
        {recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
            <CreditCard className="w-10 h-10 mb-2 stroke-1 text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-medium">No transactions recorded for {monthLabel(selectedMonth)}.</p>
            <button
              type="button"
              onClick={onNavigateToTransactions}
              className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 transition-colors"
            >
              Go to Transactions to add an entry &rarr;
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80 dark:divide-slate-800/60">
            {recentTransactions.map((transaction) => {
              const isIncome = transaction.type === 'income';
              const catInfo = (isIncome ? incomeSources : expenseCategories).find(
                (c) => c.id === transaction.category
              );

              return (
                <div
                  key={transaction.id}
                  className="py-3 px-1 flex items-center justify-between gap-3 group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 rounded-xl transition-colors"
                >
                  {/* Left: Icon & Description */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xs border border-slate-200/80 dark:border-slate-700 shrink-0">
                      <CategoryIcon category={transaction.category} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {transaction.note ? transaction.note : catInfo?.label || 'Other'}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-600 dark:text-slate-400">
                          {catInfo?.label || 'Other'}
                        </span>
                        <span>•</span>
                        <span className="tabular-nums">{transaction.date}</span>
                        {transaction.paymentMethod && (
                          <>
                            <span>•</span>
                            <span className="uppercase">{transaction.paymentMethod}</span>
                          </>
                        )}
                        {transaction.linkedLoanId && (
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">
                            (Loan)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Quick Edit Link */}
                  <div className="flex items-center gap-2.5 shrink-0 text-right">
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

                    {initiateEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          initiateEdit(transaction);
                          onNavigateToTransactions();
                        }}
                        className="p-1 text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        title="Edit transaction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Link */}
        {recentTransactions.length > 0 && (
          <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Showing latest {recentTransactions.length} of {monthTransactions.length} records</span>
            <button
              type="button"
              onClick={onNavigateToTransactions}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View full ledger</span>
              <span>&rarr;</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
