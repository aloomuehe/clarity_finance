import { getAvailableBalance } from './calculations.js';
import { MAX_MONEY_AMOUNT } from '../constants/finance.js';
import { getTodayStr } from './dates.js';

const cleanStr = (s) => (typeof s === 'string' ? s.trim().toLowerCase().replace(/[^a-z0-9]/g, '') : '');

/**
 * Creates an empty draft row for manual bulk entry.
 */
export const createEmptyBulkRow = (fallbackDate) => ({
  id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  date: fallbackDate || getTodayStr(),
  note: '',
  amount: '',
  type: 'expense',
  category: 'food',
  paymentMethod: 'upi',
  selected: true,
});

/**
 * Compares candidates against existing transactions and against earlier items
 * in the same batch to detect duplicates (e.g. overlapping screenshots).
 * When isReceipt is true, legitimate multiple items on the same receipt
 * are not flagged as duplicates of each other.
 */
export function detectDuplicates(candidateRows, existingTransactions = [], { isReceipt = false } = {}) {
  if (!Array.isArray(candidateRows)) return [];

  const results = [];

  for (let i = 0; i < candidateRows.length; i++) {
    const candidate = candidateRows[i];
    const candAmt = Math.abs(Number(candidate.amount) || 0);
    const candDate = candidate.date || '';
    const candType = candidate.type || 'expense';
    const candNoteClean = cleanStr(candidate.note);
    const candCategory = candidate.category || '';

    let isDuplicate = false;
    let duplicateReason = '';
    let duplicateSource = null;

    // Check against existing saved transactions
    if (candAmt > 0 && candDate) {
      for (const existing of existingTransactions) {
        if (!existing) continue;
        const exAmt = Math.abs(Number(existing.amount) || 0);
        const exDate = existing.date || '';
        const exType = existing.type || 'expense';
        const exNoteClean = cleanStr(existing.note);
        const exCategory = existing.category || '';

        const sameDate = candDate === exDate;
        const sameType = candType === exType;
        const sameAmount = Math.abs(candAmt - exAmt) < 0.01;

        if (sameDate && sameType && sameAmount) {
          const hasCandNote = Boolean(candNoteClean);
          const hasExNote = Boolean(exNoteClean);

          let isMatch = false;
          if (hasCandNote && hasExNote) {
            isMatch = candNoteClean === exNoteClean || candNoteClean.includes(exNoteClean) || exNoteClean.includes(candNoteClean);
          } else if (!hasCandNote && !hasExNote) {
            isMatch = Boolean(candCategory && exCategory && candCategory === exCategory);
          }

          if (isMatch) {
            isDuplicate = true;
            duplicateReason = `Matches existing: ${exDate} · ${existing.note || existing.category || 'Expense'} · ₹${exAmt}`;
            duplicateSource = 'existing';
            break;
          }
        }
      }
    }

    // Check against prior items in this current batch (e.g. overlapping screenshots)
    // On a single itemized receipt, multiple items of the same product/price are legitimate purchases
    if (!isReceipt && !isDuplicate && candAmt > 0 && candDate) {
      for (let j = 0; j < i; j++) {
        const prev = candidateRows[j];
        if (!prev) continue;
        const prevAmt = Math.abs(Number(prev.amount) || 0);
        const prevDate = prev.date || '';
        const prevType = prev.type || 'expense';
        const prevNoteClean = cleanStr(prev.note);
        const prevCategory = prev.category || '';

        const sameDate = candDate === prevDate;
        const sameType = candType === prevType;
        const sameAmount = Math.abs(candAmt - prevAmt) < 0.01;

        if (sameDate && sameType && sameAmount) {
          const hasCandNote = Boolean(candNoteClean);
          const hasPrevNote = Boolean(prevNoteClean);

          let isMatch = false;
          if (hasCandNote && hasPrevNote) {
            isMatch = candNoteClean === prevNoteClean || candNoteClean.includes(prevNoteClean) || prevNoteClean.includes(candNoteClean);
          } else if (!hasCandNote && !hasPrevNote) {
            isMatch = Boolean(candCategory && prevCategory && candCategory === prevCategory);
          }

          if (isMatch) {
            isDuplicate = true;
            duplicateReason = `Duplicate of row #${j + 1} in this batch (${prev.note || prev.category})`;
            duplicateSource = 'batch';
            break;
          }
        }
      }
    }

    results.push({
      ...candidate,
      isDuplicate,
      duplicateReason,
      duplicateSource,
      // If candidate is a duplicate, default to unselected to avoid accidental duplicate import,
      // but retain user's explicit selection if already specified.
      selected: typeof candidate.selected === 'boolean'
        ? candidate.selected
        : !isDuplicate,
    });
  }

  return results;
}

/**
 * Validates selected candidate rows in chronological sequence against the
 * current available cash balance.
 */
export function validateBulkBatch(candidateRows = [], currentTransactions = [], formatMoney = (n) => String(n)) {
  const startingBalance = getAvailableBalance(currentTransactions);

  const errorsByRowId = {};
  const selectedRows = candidateRows.filter(r => r.selected !== false);
  const excludedCount = candidateRows.length - selectedRows.length;
  const duplicateCount = candidateRows.filter(r => r.isDuplicate).length;

  // Stable chronological sort by date (empty dates sort last)
  const sortedSelected = [...selectedRows].sort((a, b) => {
    const da = a.date || '9999-99-99';
    const db = b.date || '9999-99-99';
    const cmp = da.localeCompare(db);
    if (cmp !== 0) return cmp;
    // On the same date, cash inflows (income) are processed before outflows (expenses)
    // so valid same-day income funds same-day expenses.
    if (a.type === 'income' && b.type !== 'income') return -1;
    if (a.type !== 'income' && b.type === 'income') return 1;
    return 0;
  });

  let runningBalance = startingBalance;
  let totalIncome = 0;
  let totalExpense = 0;

  for (const row of sortedSelected) {
    const rowErrors = [];

    // 1. Amount validation
    const amtNum = Number(row.amount);
    const isAmountValid = row.amount !== '' && row.amount !== null && row.amount !== undefined && Number.isFinite(amtNum) && amtNum > 0;
    if (!isAmountValid) {
      rowErrors.push('Enter a positive amount > 0');
    } else if (amtNum > MAX_MONEY_AMOUNT) {
      rowErrors.push(`Amount exceeds maximum limit (${formatMoney(MAX_MONEY_AMOUNT)})`);
    }

    // 2. Date validation
    if (!row.date || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
      rowErrors.push('Valid date required (YYYY-MM-DD)');
    }

    // 3. Balance simulation (chronological)
    if (isAmountValid && amtNum <= MAX_MONEY_AMOUNT) {
      const gross = Math.abs(amtNum);
      if (row.type === 'income') {
        runningBalance += gross;
        totalIncome += gross;
      } else if (row.type === 'expense') {
        if (gross > runningBalance) {
          rowErrors.push(`Insufficient balance. Needed ${formatMoney(gross)}, available ${formatMoney(Math.max(0, runningBalance))}`);
        } else {
          runningBalance -= gross;
          totalExpense += gross;
        }
      }
    }

    if (rowErrors.length > 0) {
      errorsByRowId[row.id] = rowErrors.join('; ');
    }
  }

  const errorCount = Object.keys(errorsByRowId).length;
  const readyCount = selectedRows.length - errorCount;
  const isValid = selectedRows.length > 0 && errorCount === 0;

  return {
    isValid,
    startingBalance,
    finalBalance: runningBalance,
    totalIncome,
    totalExpense,
    netSavings: totalIncome - totalExpense,
    errorsByRowId,
    selectedCount: selectedRows.length,
    readyCount,
    errorCount,
    excludedCount,
    duplicateCount,
  };
}
