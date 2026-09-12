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
} from 'lucide-react';
import TransactionForm from './TransactionForm';
import Transactions from './Transactions';

export default function Dashboard({
  currentMonthData,
  savingsDifference,
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
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in-up print-break-inside-avoid relative z-20">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 text-indigo-100 mb-2">
                <Wallet className="w-5 h-5" />
                <h2 className="font-semibold">Monthly Savings</h2>
              </div>
              <p className="text-4xl font-extrabold text-white">{formatMoney(currentMonthData.savings)}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20 space-y-2 text-sm text-indigo-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 shrink-0" />
                <span>
                  Vs Last: {savingsDifference >= 0 ? '+' : ''}
                  {formatMoney(savingsDifference)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 shrink-0" /> Total Balance
                </span>
                <span className="font-extrabold text-white">{formatMoney(balance)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 dk-text-slate-400 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <h2 className="font-semibold text-slate-700 dk-text-slate-300">Monthly Income</h2>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dk-text-white">{formatMoney(currentMonthData.income)}</p>
          </div>
          {highestSavingsMonth && (
            <p className="text-xs text-slate-500 dk-text-slate-400 mt-4 pt-4 border-t border-slate-100 dk-border-slate-700 font-medium">
              Best Month: {highestSavingsMonth.month} ({formatMoney(highestSavingsMonth.savings)})
            </p>
          )}
        </div>

        <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm relative flex flex-col justify-between">
          <button
            onClick={() => setShowBudgetSettings(!showBudgetSettings)}
            className="absolute top-6 right-6 p-1 text-slate-400 hover:text-indigo-500 bg-slate-50 dk-bg-slate-700 rounded-md transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-slate-500 dk-text-slate-400 mb-2">
              <TrendingDown className="w-5 h-5 text-rose-500" />
              <h2 className="font-semibold text-slate-700 dk-text-slate-300">Monthly Expenses</h2>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dk-text-white">{formatMoney(currentMonthData.expense)}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dk-border-slate-700">
            <div className="flex justify-between text-xs mb-1 font-semibold text-slate-600 dk-text-slate-300">
              <span>Target</span>
              <span>{formatMoney(monthlyTarget)}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dk-bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${currentMonthData.expense > monthlyTarget ? 'bg-rose-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min((currentMonthData.expense / (monthlyTarget || 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between group relative hover:z-30">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-indigo-400 min-w-0">
                <Activity className="w-5 h-5 shrink-0" />
                <h2 className="font-semibold text-white whitespace-nowrap">Health Score</h2>
              </div>
              <span className="text-xl font-black text-white whitespace-nowrap shrink-0">{financialHealth.score}/100</span>
            </div>
            <p className="text-xs text-slate-200 mt-2 leading-relaxed">{financialHealth.message}</p>
          </div>

          <div className="absolute top-full left-0 mt-3 w-full p-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white text-xs rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-2xl z-50 -translate-y-2 group-hover:translate-y-0">
            <p className="font-bold mb-2 text-indigo-400 border-b border-slate-700 pb-1">Score Breakdown:</p>
            <ul className="space-y-1">
              {financialHealth.breakdown.map((item, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-slate-300 mt-4 pt-4 border-t border-white/10 flex justify-between font-medium">
            Daily Spend: <span className="text-orange-400 font-bold">{formatMoney(dailyAverage)}</span>
          </p>
        </div>
      </div>

      {showBudgetSettings && (
        <div className="bg-indigo-50 dk-bg-indigo-900-20 rounded-3xl p-6 border border-indigo-200 dk-border-indigo-800 relative z-10">
          <h3 className="text-lg font-bold mb-4 text-indigo-950 dk-text-indigo-200">Set Monthly Budget Targets</h3>
          <div className="flex flex-wrap gap-4">
            <div className="dark-card bg-white dk-bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dk-border-slate-700">
              <label className="text-xs font-semibold text-slate-600 dk-text-slate-400 block mb-1">Overall Limit</label>
              <input
                type="number"
                min="0"
                value={monthlyTarget}
                onChange={(e) => handleMonthlyTargetChange(e.target.value)}
                className="w-32 px-3 py-1 bg-slate-50 dk-bg-slate-900 rounded-lg border border-slate-300 dk-border-slate-700 text-slate-900 dk-text-white transition-all outline-none font-bold"
              />
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
          <p className="text-sm text-slate-500 dk-text-slate-400 text-center mt-1">Explore daily spending patterns.</p>
        </div>

        <div
          onClick={() => setIsTrendOpen(true)}
          className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm flex flex-col justify-center items-center cursor-pointer group hover:shadow-md hover:border-emerald-300 dk-hover-border-emerald-700 transition-all duration-300 min-h-[200px]"
        >
          <div className="w-16 h-16 bg-emerald-50 dk-bg-emerald-900-30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <BarChart className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dk-text-white">6-Month Trend</h3>
          <p className="text-sm text-slate-500 dk-text-slate-400 text-center mt-1">Visualize income vs expenses.</p>
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
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl text-sm shadow flex justify-center items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <FileText className="w-4 h-4" /> AI Month Report
            </button>
          </div>
        </div>

        <Transactions
          formatMoney={formatMoney}
          monthLabel={monthLabel}
          selectedMonth={selectedMonth}
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
