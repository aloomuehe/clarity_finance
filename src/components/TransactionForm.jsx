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
    <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-6 flex-wrap">
        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dk-text-white">
          {editingId ? <Edit2 className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-indigo-500" />}
          {editingId ? 'Edit Transaction' : 'Manual Entry'}
        </h3>
        {!editingId && (
          <button
            type="button"
            onClick={onBulkAdd}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dk-bg-slate-700 dk-hover-bg-slate-600 text-slate-700 hover:text-slate-900 dk-text-slate-200 dk-hover-text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500 dk-text-indigo-400" />
            <span>Bulk Add</span>
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex bg-slate-100 dk-bg-slate-900 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleInputChange({ target: { name: 'type', value: 'expense' } })}
            className={`flex-1 py-1.5 text-sm font-bold rounded-lg ${formData.type === 'expense' ? 'bg-white dk-bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-500 dk-text-slate-400'}`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleInputChange({ target: { name: 'type', value: 'income' } })}
            className={`flex-1 py-1.5 text-sm font-bold rounded-lg ${formData.type === 'income' ? 'bg-white dk-bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-500 dk-text-slate-400'}`}
          >
            Income
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 dk-text-slate-300 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
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
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-slate-900 dk-text-white text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 dk-text-slate-300 mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-slate-900 dk-text-white text-sm font-medium outline-none"
            >
              {formData.type === 'expense'
                ? expenseCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.label}
                    </option>
                  ))
                : incomeSources.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.label}
                    </option>
                  ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dk-text-slate-300 mb-1">Payment Method</label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-slate-900 dk-text-white text-sm font-medium outline-none"
            >
              {paymentMethods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 dk-text-slate-300 mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-slate-900 dk-text-white text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dk-text-slate-300 mb-1">Note</label>
            <input
              type="text"
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              placeholder="e.g. Coffee"
              className="w-full px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-slate-900 dk-text-white text-sm outline-none"
            />
          </div>
        </div>

        {formData.type === 'expense' && !editingId && (
          <div className="pt-2 border-t border-slate-100 dk-border-slate-700">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dk-text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isSplit}
                onChange={(e) => setIsSplit(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <Share2 className="w-4 h-4 text-indigo-500" /> Split expense?
            </label>
            {isSplit && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Friend name"
                  value={splitDetails.person}
                  onChange={e => setSplitDetails({ ...splitDetails, person: e.target.value })}
                  className="w-1/2 px-2 py-1.5 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-lg text-xs text-slate-900 dk-text-white"
                />
                <input
                  type="number"
                  placeholder="Their share"
                  value={splitDetails.amount}
                  onChange={e => setSplitDetails({ ...splitDetails, amount: e.target.value })}
                  className="w-1/2 px-2 py-1.5 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-lg text-xs text-slate-900 dk-text-white"
                />
              </div>
            )}
          </div>
        )}
        <button
          type="submit"
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition-colors"
        >
          {editingId ? 'Update' : 'Add'}
        </button>
      </form>
    </div>
  );
}
