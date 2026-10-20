import { useState } from 'react';
import {
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Edit2,
  Sparkles,
  Wand2,
  Loader2,
  Camera,
  Layers,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import TransactionForm from './TransactionForm';
import Transactions from './Transactions';

export default function TransactionsPage({
  displayTransactions,
  currentMonthData,
  selectedMonth,
  onSelectMonth,
  monthLabel,
  formatMoney,
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
  initiateEdit,
  editingId,
  deleteTransaction,
  formData,
  handleInputChange,
  handleSubmit,
  isSplit,
  setIsSplit,
  splitDetails,
  setSplitDetails,
  expenseCategories,
  incomeSources,
  paymentMethods,
  CurrencyIcon,
  onBulkAdd,
  magicPrompt,
  setMagicPrompt,
  handleMagicAdd,
  isMagicLoading,
  fileInputRef,
  handleFileUpload,
  isScanning,
}) {
  const [showManualForm, setShowManualForm] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Page Header with CashSync-inspired Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>All Transactions</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
              {monthLabel(selectedMonth)}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Complete statement history, search, filters, and transaction management
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showManualForm || editingId
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {editingId ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{editingId ? 'Edit Entry' : 'Manual Entry'}</span>
            {showManualForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={onBulkAdd}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 border border-transparent transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Bulk Add</span>
          </button>
        </div>
      </div>

      {/* 2. Top 3 Summary Cards (CashSync Reference Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Net Change This Month */}
        <div className="card-lift bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider truncate">
              Net Change This Month
            </span>
            <p className={`text-xl sm:text-2xl font-bold tracking-tight tabular-nums mt-0.5 truncate ${
              currentMonthData.savings >= 0
                ? 'text-slate-900 dark:text-white'
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {currentMonthData.savings >= 0 ? '+' : ''}{formatMoney(currentMonthData.savings)}
            </p>
          </div>
        </div>

        {/* Card 2: Money In */}
        <div className="card-lift bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider truncate">
              Money In (Income)
            </span>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 truncate">
              +{formatMoney(currentMonthData.income)}
            </p>
          </div>
        </div>

        {/* Card 3: Money Out */}
        <div className="card-lift bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider truncate">
              Money Out (Expenses)
            </span>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums mt-0.5 truncate">
              -{formatMoney(currentMonthData.expense)}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Action Toolbar: Magic Quick Add & Receipt Scanner */}
      <div className="card-lift bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Magic Add Input & Primary Action */}
          <div className="flex-1 flex flex-wrap sm:flex-nowrap items-center gap-2 min-w-0">
            <div className="relative flex-1 min-w-[140px] sm:min-w-[180px]">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={magicPrompt}
                onChange={(e) => setMagicPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMagicAdd()}
                placeholder="Magic Quick Add: '240 snacks' or '5000 freelance'..."
                className="w-full h-9 pl-9 pr-3 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={handleMagicAdd}
              disabled={isMagicLoading}
              className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-2xs disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Add via natural-language parsing"
            >
              {isMagicLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              <span>Add</span>
            </button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="h-9 px-3 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 rounded-xl text-xs font-medium shadow-2xs disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Scan Receipt Photo"
            >
              {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
              <span className="hidden sm:inline">Scan Receipt</span>
            </button>
          </div>

          {/* Secondary Action: Manual Form Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowManualForm(!showManualForm)}
              className={`h-9 px-3 text-xs rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                showManualForm || editingId
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/60 font-semibold'
                  : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 font-medium'
              }`}
            >
              {editingId ? <Edit2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <Plus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
              <span>{editingId ? 'Edit Transaction' : 'Manual Form'}</span>
              {showManualForm ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Collapsible Manual Transaction Form */}
        {(showManualForm || editingId) && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <TransactionForm
              formData={formData}
              handleInputChange={handleInputChange}
              handleSubmit={(e) => {
                handleSubmit(e);
                if (!editingId) setShowManualForm(false);
              }}
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
              onCancel={() => {
                setShowManualForm(false);
                if (editingId && typeof initiateEdit === 'function') {
                  initiateEdit(null);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* 4. Full Ledger Transactions Table */}
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
        initiateEdit={(tx) => {
          initiateEdit(tx);
          setShowManualForm(true);
        }}
        deleteTransaction={deleteTransaction}
        expenseCategories={expenseCategories}
        incomeSources={incomeSources}
        paymentMethods={paymentMethods}
      />
    </div>
  );
}
