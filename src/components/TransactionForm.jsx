import { Edit2, Plus, Share2, DollarSign, Layers } from 'lucide-react';

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
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          {editingId ? (
            <Edit2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          ) : (
            <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          )}
          <span>{editingId ? 'Edit Transaction' : 'Manual Entry'}</span>
        </h3>
        {!editingId && (
          <button
            type="button"
            onClick={onBulkAdd}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Bulk Add</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Segmented Type Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleInputChange({ target: { name: 'type', value: 'expense' } })}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              formData.type === 'expense'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleInputChange({ target: { name: 'type', value: 'income' } })}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              formData.type === 'income'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Income
          </button>
        </div>

        {/* Amount Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Amount
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
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
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm font-semibold tabular-nums outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Category & Payment Method */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 truncate">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 truncate">
              Payment Method
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              {paymentMethods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date & Note */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Note
            </label>
            <input
              type="text"
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              placeholder="e.g. Groceries"
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Split Expense Option */}
        {formData.type === 'expense' && !editingId && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSplit}
                onChange={(e) => setIsSplit(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
              />
              <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Split expense with a friend?</span>
            </label>
            {isSplit && (
              <div className="mt-2.5 flex gap-2">
                <input
                  type="text"
                  placeholder="Friend name"
                  value={splitDetails.person}
                  onChange={e => setSplitDetails({ ...splitDetails, person: e.target.value })}
                  className="w-1/2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Their share"
                  value={splitDetails.amount}
                  onChange={e => setSplitDetails({ ...splitDetails, amount: e.target.value })}
                  className="w-1/2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-white tabular-nums outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5"
        >
          {editingId ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{editingId ? 'Update Transaction' : 'Record Transaction'}</span>
        </button>
      </form>
    </div>
  );
}
