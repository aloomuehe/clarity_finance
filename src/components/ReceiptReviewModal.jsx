import { useState, useMemo } from 'react';
import {
  Receipt,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Trash2,
  Plus,
  X,
  Store,
  Calendar,
  Layers,
} from 'lucide-react';
import { detectDuplicates } from '../utils/bulkValidation.js';
import { getTodayStr } from '../utils/dates.js';

function ReceiptReviewModalContent({
  onClose,
  receiptData,
  onCommit,
  expenseCategories = [],
  paymentMethods = [],
  formatMoney = (n) => String(n),
  existingTransactions = [],
  availableBalance = Infinity,
}) {
  const [items, setItems] = useState(() => {
    if (receiptData?.items && Array.isArray(receiptData.items)) {
      return receiptData.items.map(it => ({
        ...it,
        selected: it.selected ?? true,
      }));
    }
    return [];
  });

  const receiptTotal = receiptData.receiptTotal != null ? Number(receiptData.receiptTotal) : null;
  const tax = receiptData.tax != null ? Number(receiptData.tax) : null;
  const discount = receiptData.discount != null ? Number(receiptData.discount) : null;
  const merchant = receiptData.merchant || '';
  const receiptDate = receiptData.date || getTodayStr();

  // Run duplicate detection with isReceipt: true to allow legitimate repeated products on the same receipt
  const itemsWithDuplicates = useMemo(() => {
    return detectDuplicates(items, existingTransactions, { isReceipt: true });
  }, [items, existingTransactions]);

  // Selected items
  const selectedItems = itemsWithDuplicates.filter(it => it.selected);
  const selectedCount = selectedItems.length;

  // Extracted total from selected items (derived calculation)
  const extractedTotal = useMemo(() => {
    return selectedItems.reduce((sum, it) => {
      const val = Number(it.amount);
      return sum + (Number.isFinite(val) && val > 0 ? val : 0);
    }, 0);
  }, [selectedItems]);

  // Total verification: only applicable when receipt has an explicit printed total
  const totalDifference = receiptTotal !== null
    ? Math.round((receiptTotal - extractedTotal) * 100) / 100
    : null;
  const isExactTotalVerified = totalDifference !== null && Math.abs(totalDifference) < 0.01;
  const isTaxVerified = receiptTotal !== null && tax !== null && Math.abs((extractedTotal + tax - (discount || 0)) - receiptTotal) < 0.01;
  const isTotalVerified = isExactTotalVerified || isTaxVerified;

  // Balance check
  const isBalanceExceeded = Number.isFinite(availableBalance) && extractedTotal > availableBalance;

  // Has validation errors
  const hasInvalidSelectedRows = selectedItems.some(it => {
    const amt = Number(it.amount);
    return !Number.isFinite(amt) || amt <= 0 || !it.date;
  });

  const canCommit = selectedCount > 0 && !hasInvalidSelectedRows && !isBalanceExceeded;

  // Row operations
  const updateItem = (id, updates) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...updates } : it)));
  };

  const deleteItem = (id) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const toggleSelectAll = () => {
    const allSelected = items.length > 0 && items.every(it => it.selected);
    setItems(prev => prev.map(it => ({ ...it, selected: !allSelected })));
  };

  const handleAddNewItem = () => {
    const newItem = {
      id: `receipt-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'expense',
      amount: '',
      category: expenseCategories[0]?.id || 'food',
      date: receiptDate,
      paymentMethod: receiptData.paymentMethod || 'upi',
      note: '',
      selected: true,
      needsReview: true,
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleConfirmAdd = () => {
    if (!canCommit) return;
    onCommit(selectedItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 modal-spring">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-inner shrink-0">
              <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 truncate">
                Receipt Scanned
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {items.length} line item{items.length === 1 ? '' : 's'} detected
                </span>
                {merchant && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 truncate">
                      <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {merchant}
                    </span>
                  </>
                )}
                {receiptDate && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {receiptDate}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">

          {/* Verification Banner */}
          {receiptTotal !== null ? (
            <div className={`p-4 rounded-2xl border transition-all ${
              isTotalVerified
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                : totalDifference > 0
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300'
                  : 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-300'
            }`}>
              <div className="flex items-start gap-3">
                {isTotalVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 text-sm min-w-0">
                  <div className="font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span>
                      {isExactTotalVerified
                        ? 'Receipt total verified'
                        : isTaxVerified
                          ? 'Total verified (items + tax match receipt total)'
                          : totalDifference > 0
                            ? `Difference: ${formatMoney(totalDifference)}`
                            : `Difference: ${formatMoney(Math.abs(totalDifference))}`}
                    </span>
                    <span className="text-xs font-mono font-bold">
                      Extracted item total: {formatMoney(extractedTotal)} / Receipt total: {formatMoney(receiptTotal)}
                    </span>
                  </div>
                  <p className="text-xs opacity-85 mt-1">
                    {isExactTotalVerified
                      ? `All ${selectedCount} extracted items sum exactly to the receipt total of ${formatMoney(receiptTotal)}.`
                      : isTaxVerified
                        ? `Items subtotal (${formatMoney(extractedTotal)}) + visible tax (${formatMoney(tax)})${discount ? ` - discount (${formatMoney(discount)})` : ''} equals the receipt total of ${formatMoney(receiptTotal)}.`
                        : totalDifference > 0
                          ? `Extracted items sum to ${formatMoney(extractedTotal)}, while receipt total is ${formatMoney(receiptTotal)}. The difference (${formatMoney(totalDifference)}) may be due to unitemized taxes, delivery, or fees.`
                          : `Extracted items sum to ${formatMoney(extractedTotal)}, which exceeds the receipt total (${formatMoney(receiptTotal)}) by ${formatMoney(Math.abs(totalDifference))}. Please review item amounts.`}
                  </p>
                  <p className="text-[11px] opacity-75 mt-1.5 font-medium italic">
                    ℹ The grand total is used for review verification only and will NOT be added as an extra transaction.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Extracted item total</span>
                    <strong className="font-mono text-sm text-purple-600 dark:text-purple-400 font-bold">{formatMoney(extractedTotal)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Receipt total</span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium italic">Not provided</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/70 dark:border-slate-700/70 italic">
                    ℹ The receipt does not show an explicit total. The amount above is calculated from the extracted items.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Insufficient Balance Alert */}
          {isBalanceExceeded && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-2xl flex items-center gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                <strong>Insufficient available balance:</strong> These items total {formatMoney(extractedTotal)}, but your available balance is {formatMoney(availableBalance)}.
              </span>
            </div>
          )}

          {/* Line items table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[50vh]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={items.length > 0 && items.every(it => it.selected)}
                        onChange={toggleSelectAll}
                        className="rounded accent-purple-600 cursor-pointer"
                        title="Select/Deselect All"
                      />
                    </th>
                    <th className="p-3 min-w-[200px]">Item Description</th>
                    <th className="p-3 w-28">Amount</th>
                    <th className="p-3 w-40">Category</th>
                    <th className="p-3 w-32">Date</th>
                    <th className="p-3 w-28">Payment</th>
                    <th className="p-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        No line items found. Click &quot;+ Add Line Item&quot; to enter items manually.
                      </td>
                    </tr>
                  ) : (
                    itemsWithDuplicates.map((item, idx) => {
                      const amtNum = Number(item.amount);
                      const isAmtInvalid = !Number.isFinite(amtNum) || amtNum <= 0;
                      const hasDuplicate = item.isDuplicate;

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                            !item.selected ? 'opacity-50 bg-slate-50/40 dark:bg-slate-900/40' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(item.selected)}
                              onChange={(e) => updateItem(item.id, { selected: e.target.checked })}
                              className="rounded accent-purple-600 cursor-pointer"
                            />
                          </td>

                          {/* Description */}
                          <td className="p-3">
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={item.note || ''}
                                onChange={(e) => updateItem(item.id, { note: e.target.value })}
                                placeholder={`Item ${idx + 1}`}
                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
                              />
                              {hasDuplicate ? (
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>{item.duplicateReason || 'Matches existing transaction'}</span>
                                </div>
                              ) : item.uncertainReason ? (
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                                  <AlertCircle className="w-3 h-3 shrink-0" />
                                  <span>{item.uncertainReason}</span>
                                </div>
                              ) : null}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="p-3">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={item.amount ?? ''}
                              onChange={(e) => updateItem(item.id, { amount: e.target.value })}
                              placeholder="0.00"
                              className={`w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono font-semibold text-slate-900 dark:text-white outline-none focus:ring-1 ${
                                isAmtInvalid
                                  ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/50'
                                  : 'border-slate-200 dark:border-slate-700 focus:ring-purple-500'
                              }`}
                            />
                          </td>

                          {/* Category */}
                          <td className="p-3">
                            <select
                              value={item.category || 'other_expense'}
                              onChange={(e) => updateItem(item.id, { category: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                            >
                              {expenseCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.label || cat.id}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Date */}
                          <td className="p-3">
                            <input
                              type="date"
                              value={item.date || receiptDate}
                              onChange={(e) => updateItem(item.id, { date: e.target.value })}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </td>

                          {/* Payment Method */}
                          <td className="p-3">
                            <select
                              value={item.paymentMethod || 'upi'}
                              onChange={(e) => updateItem(item.id, { paymentMethod: e.target.value })}
                              className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                            >
                              {paymentMethods.map(pm => (
                                <option key={pm.id} value={pm.id}>
                                  {pm.label || pm.id}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Delete */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => deleteItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Add row bar */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddNewItem}
                className="px-3 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Line Item</span>
              </button>

              <span className="text-[11px] text-slate-500 dark:text-slate-400 pr-2">
                {selectedCount} of {items.length} item{items.length === 1 ? '' : 's'} selected
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-5 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Extracted item total: </span>
              <strong className="text-slate-900 dark:text-white font-mono text-sm">{formatMoney(extractedTotal)}</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Receipt total: </span>
              {receiptTotal !== null ? (
                <strong className="text-slate-900 dark:text-white font-mono text-sm">{formatMoney(receiptTotal)}</strong>
              ) : (
                <span className="text-slate-500 dark:text-slate-400 font-medium italic">Not provided</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmAdd}
              disabled={!canCommit}
              className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Add {selectedCount} Transaction{selectedCount === 1 ? '' : 's'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function ReceiptReviewModal({ isOpen, receiptData, ...props }) {
  if (!isOpen || !receiptData) return null;
  return <ReceiptReviewModalContent receiptData={receiptData} {...props} />;
}
