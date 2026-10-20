import { Edit2, Plus, Share2, DollarSign, Layers, X } from 'lucide-react';
import DatePicker from './DatePicker';

export default function TransactionForm({
  formData,
  handleInputChange,
  handleSubmit,
  editingId,
  isSplit,
  setIsSplit,
  splitDetails,
  setSplitDetails,
  expenseCategories,
  incomeSources,
  paymentMethods,
  CurrencyIcon = DollarSign,
  onBulkAdd,
  onCancel,
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          {editingId ? (
            <Edit2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          ) : (
            <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          )}
          <span>{editingId ? 'Edit Transaction' : 'Manual Entry'}</span>
        </h3>

        <div className="flex items-center gap-2">
          {!editingId && onBulkAdd && (
            <button
              type="button"
              onClick={onBulkAdd}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Bulk Add</span>
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Close form"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Segmented Type Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => handleInputChange({ target: { name: 'type', value: 'expense' } })}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              formData.type === 'expense'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleInputChange({ target: { name: 'type', value: 'income' } })}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              formData.type === 'income'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Income
          </button>
        </div>

        {/* Amount & Date Grouping */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Amount
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                <CurrencyIcon className="w-4 h-4" />
              </span>
              <input
                type="number"
                name="amount"
                min="0.01"
                step="any"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                required
                className="w-full h-9 pl-9 pr-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm font-bold tabular-nums outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Date
            </label>
            <DatePicker
              value={formData.date}
              onChange={handleInputChange}
              name="date"
              required
            />
          </div>
        </div>

        {/* Category & Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 truncate">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
            >
              {formData.type === 'expense'
                ? expenseCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))
                : incomeSources.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 truncate">
              Payment Method
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
            >
              {paymentMethods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description / Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Description / Note
          </label>
          <input
            type="text"
            name="note"
            value={formData.note}
            onChange={handleInputChange}
            placeholder="e.g. Groceries, Coffee, Salary..."
            className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-slate-400"
          />
        </div>

        {/* Split Expense Option */}
        {formData.type === 'expense' && !editingId && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSplit}
                onChange={(e) => setIsSplit(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
              />
              <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Split expense with a friend?</span>
            </label>
            {isSplit && (
              <div className="mt-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-fade-in-up">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Friend's Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex"
                    value={splitDetails.person}
                    onChange={(e) => setSplitDetails({ ...splitDetails, person: e.target.value })}
                    className="w-full h-8.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Their Share Amount
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={splitDetails.amount}
                    onChange={(e) => setSplitDetails({ ...splitDetails, amount: e.target.value })}
                    className="w-full h-8.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white tabular-nums font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons: Primary & Secondary */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="submit"
            className="flex-1 min-w-[140px] h-9.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {editingId ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{editingId ? 'Update Transaction' : 'Record Transaction'}</span>
          </button>
          {(editingId || onCancel) && (
            <button
              type="button"
              onClick={onCancel}
              className="h-9.5 px-4 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
