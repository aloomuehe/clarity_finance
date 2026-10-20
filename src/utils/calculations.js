import { getMonthString, getTodayStr, monthLabel, sanitizeDate, shiftDate, shiftMonth } from './dates.js';
import { loadLS } from './storage.js';

export const DEFAULT_HEATMAP_THRESHOLDS = { green: 50, yellow: 150, orange: 300 };

export const isValidHeatmapThresholds = (value) => {
  if (!value || typeof value !== 'object') return false;
  const values = [value.green, value.yellow, value.orange].map(Number);
  return values.every(Number.isFinite) && values.every(item => item >= 0) && values[0] < values[1] && values[1] < values[2];
};

export const loadHeatmapThresholds = () => {
  const saved = loadLS('heatmap_thresholds', DEFAULT_HEATMAP_THRESHOLDS);
  if (!saved || typeof saved !== 'object') return DEFAULT_HEATMAP_THRESHOLDS;
  const values = [saved.green, saved.yellow, saved.orange].map(Number);
  if (isValidHeatmapThresholds(saved)) {
    return { green: values[0], yellow: values[1], orange: values[2] };
  }
  return DEFAULT_HEATMAP_THRESHOLDS;
};

const emptyMonthData = () => ({ income: 0, expense: 0, savings: 0, categorySpending: {} });

export const aggregateMonthlyData = (transactions) => {
  const dataByMonth = {};
  (transactions || []).forEach(t => {
    if (!t) return;
    const month = typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(t.date)
      ? t.date.slice(0, 7)
      : getMonthString(t.date);
    if (!month) return;
    if (!dataByMonth[month]) dataByMonth[month] = emptyMonthData();
    const amount = Math.abs(Number(t.amount) || 0);
    if (t.type === 'income') {
      dataByMonth[month].income += amount;
    } else if (t.type === 'expense') {
      dataByMonth[month].expense += amount;
      if (t.category) {
        dataByMonth[month].categorySpending[t.category] = (dataByMonth[month].categorySpending[t.category] || 0) + amount;
      }
    }
    const rawSavings = dataByMonth[month].income - dataByMonth[month].expense;
    dataByMonth[month].savings = rawSavings === 0 ? 0 : rawSavings;
    if (dataByMonth[month].expense === 0) dataByMonth[month].expense = 0;
    if (dataByMonth[month].income === 0) dataByMonth[month].income = 0;
  });
  return dataByMonth;
};

export const getMonthData = (monthlyData, selectedMonth) => {
  const current = monthlyData[selectedMonth] || emptyMonthData();
  const previous = monthlyData[shiftMonth(selectedMonth, -1)] || emptyMonthData();
  let maxSavings = -Infinity;
  let bestMonth = null;
  Object.entries(monthlyData).forEach(([month, data]) => {
    if (data.savings > maxSavings) { maxSavings = data.savings; bestMonth = month; }
  });
  return { currentMonthData: current, previousMonthData: previous, highestSavingsMonth: bestMonth ? { month: bestMonth, savings: maxSavings } : null };
};

export const getAvailableBalance = (transactions, excludeIds = null) => {
  const excludeSet = excludeIds
    ? (excludeIds instanceof Set ? excludeIds : new Set(Array.isArray(excludeIds) ? excludeIds : [excludeIds]))
    : null;

  return (transactions || []).reduce((acc, t) => {
    if (!t || (excludeSet && excludeSet.has(t.id))) return acc;
    const amt = Math.abs(Number(t.amount) || 0);
    if (t.type === 'income') return acc + amt;
    if (t.type === 'expense') return acc - amt;
    return acc;
  }, 0);
};

export const calculateBalance = (transactions) => (transactions || []).reduce((acc, curr) => {
  if (!curr) return acc;
  const amount = Math.abs(Number(curr.amount) || 0);
  if (curr.type === 'income') {
    acc.totalIncome += amount;
    acc.balance += amount;
  } else if (curr.type === 'expense') {
    acc.totalExpense += amount;
    acc.balance -= amount;
  }
  return acc;
}, { totalIncome: 0, totalExpense: 0, balance: 0 });

export const filterTransactions = (transactions, selectedMonth, filter, searchQuery, incomeSources, expenseCategories) => {
  let result = transactions.filter(t => (
    typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(t.date)
      ? t.date.slice(0, 7) === selectedMonth
      : getMonthString(t.date) === selectedMonth
  ));
  if (filter !== 'all') result = result.filter(t => t.type === filter);
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    result = result.filter(t => {
      const matchAmountGreater = query.match(/^>(\d+)/) || query.match(/^(\d+)\+$/);
      if (matchAmountGreater) return t.amount >= Number(matchAmountGreater[1] || matchAmountGreater[2]);
      const matchAmountLess = query.match(/^<(\d+)/);
      if (matchAmountLess) return t.amount <= Number(matchAmountLess[1]);
      const catLabel = (t.type === 'income' ? incomeSources : expenseCategories).find(c => c.id === t.category)?.label.toLowerCase() || '';
      return (t.note && t.note.toLowerCase().includes(query)) || catLabel.includes(query) || t.amount.toString().includes(query);
    });
  }
  return result.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const calculateExpensesByCategory = (displayTransactions, currentExpense, expenseCategories) => {
  const grouped = (displayTransactions || []).filter(t => t && t.type === 'expense').reduce((acc, curr) => {
    const amount = Math.abs(Number(curr.amount) || 0);
    acc[curr.category] = (acc[curr.category] || 0) + amount;
    return acc;
  }, {});
  return Object.entries(grouped).map(([id, amount]) => {
    const cat = (expenseCategories || []).find(c => c.id === id);
    return { ...cat, amount, percentage: currentExpense > 0 ? (amount / currentExpense) * 100 : 0 };
  }).sort((a, b) => b.amount - a.amount);
};

export const generateHeatmapData = (transactions, selectedMonth) => {
  const year = parseInt(selectedMonth.split('-')[0], 10);
  const month = parseInt(selectedMonth.split('-')[1], 10) - 1;
  const days = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const data = [];
  for (let i = 0; i < firstDay; i++) data.push({ empty: true, id: `empty-${i}` });
  for (let i = 1; i <= days; i++) {
    const dateStr = `${selectedMonth}-${i.toString().padStart(2, '0')}`;
    const spent = (transactions || [])
      .filter(t => t && t.type === 'expense' && getMonthString(t.date) === selectedMonth && String(t.date).slice(8, 10) === String(i).padStart(2, '0'))
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
    data.push({ day: i, dateStr, spent: spent === 0 ? 0 : spent, empty: false });
  }
  return data;
};

export const calculateSixMonthTrend = (monthlyData, selectedMonth) => {
  const liveMonth = getTodayStr().slice(0, 7);
  const knownMonths = Object.keys(monthlyData).sort();
  const closingBalanceAt = (month) => knownMonths.filter(item => item <= month).reduce((sum, item) => sum + monthlyData[item].savings, 0);
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const month = shiftMonth(selectedMonth, -i);
    const data = monthlyData[month] || emptyMonthData();
    const closing = closingBalanceAt(month);
    trend.push({ month: monthLabel(month, { month: 'short' }), key: month, income: data.income, expense: data.expense, saved: data.income - data.expense, openingBalance: closing - (data.income - data.expense), closingBalance: closing, isLive: month === liveMonth });
  }
  const maxVal = Math.max(...trend.flatMap(t => [t.income, t.expense]), 1);
  const toPoints = key => trend.map((t, i) => `${((i + 0.5) / trend.length) * 100},${100 - (t[key] / maxVal) * 100}`).join(' ');
  return { trend, maxVal, incomeLine: toPoints('income'), expenseLine: toPoints('expense'), axisTicks: [1, 0.75, 0.5, 0.25, 0].map(f => maxVal * f) };
};

export const calculateDailyTrend = (transactions, baseDate = getTodayStr(), daysCount = 7) => {
  const liveDate = getTodayStr();
  const sortedTxs = [...(transactions || [])].filter(t => t && t.date);
  const closingBalanceAtDate = (dateStr) => {
    return sortedTxs
      .filter(t => t.date <= dateStr)
      .reduce((sum, t) => sum + (t.type === 'income' ? (Number(t.amount) || 0) : -(Number(t.amount) || 0)), 0);
  };

  const trend = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const dateStr = shiftDate(baseDate, -i);
    const dayTxs = sortedTxs.filter(t => t.date === dateStr);
    const income = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const expense = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const parts = dateStr.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const label = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const closing = closingBalanceAtDate(dateStr);

    trend.push({
      month: label,
      key: dateStr,
      income,
      expense,
      saved: income - expense,
      openingBalance: closing - (income - expense),
      closingBalance: closing,
      isLive: dateStr === liveDate,
    });
  }
  const maxVal = Math.max(...trend.flatMap(t => [t.income, t.expense]), 1);
  return { trend, maxVal, axisTicks: [1, 0.75, 0.5, 0.25, 0].map(f => maxVal * f) };
};

export const calculateWeeklyTrend = (transactions, baseDate = getTodayStr(), weeksCount = 6) => {
  const liveDate = getTodayStr();
  const sortedTxs = [...(transactions || [])].filter(t => t && t.date);
  const closingBalanceAtDate = (dateStr) => {
    return sortedTxs
      .filter(t => t.date <= dateStr)
      .reduce((sum, t) => sum + (t.type === 'income' ? (Number(t.amount) || 0) : -(Number(t.amount) || 0)), 0);
  };

  const trend = [];
  for (let i = weeksCount - 1; i >= 0; i--) {
    const endDaysAgo = i * 7;
    const weekEndDate = shiftDate(baseDate, -endDaysAgo);
    const weekStartDate = shiftDate(weekEndDate, -6);

    const weekTxs = sortedTxs.filter(t => t.date >= weekStartDate && t.date <= weekEndDate);
    const income = weekTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const expense = weekTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const parts = weekStartDate.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const label = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const closing = closingBalanceAtDate(weekEndDate);

    trend.push({
      month: label,
      key: `${weekStartDate}_${weekEndDate}`,
      rangeLabel: `${weekStartDate} - ${weekEndDate}`,
      income,
      expense,
      saved: income - expense,
      openingBalance: closing - (income - expense),
      closingBalance: closing,
      isLive: liveDate >= weekStartDate && liveDate <= weekEndDate,
    });
  }
  const maxVal = Math.max(...trend.flatMap(t => [t.income, t.expense]), 1);
  return { trend, maxVal, axisTicks: [1, 0.75, 0.5, 0.25, 0].map(f => maxVal * f) };
};

export const calculateFinancialHealth = (currentMonthData, monthlyTarget, recurring, loans, goals) => {
  let score = 0;
  const breakdown = [];
  const savingsRateVal = currentMonthData.income > 0 ? (currentMonthData.savings / currentMonthData.income) : 0;
  if (savingsRateVal >= 0.2) { score += 30; breakdown.push("Excellent savings rate (>= 20%)"); }
  else if (savingsRateVal > 0) { score += 15; breakdown.push("Positive savings rate, but under 20%"); }
  else breakdown.push("No savings generated this month");
  if (monthlyTarget > 0) {
    if (currentMonthData.savings >= monthlyTarget) { score += 30; breakdown.push("Monthly savings target achieved"); }
    else { score += 10; breakdown.push("Behind monthly savings target"); }
  } else { score += 20; breakdown.push("No monthly savings target set"); }
  const recurringTotal = recurring.reduce((sum, r) => sum + r.amount, 0);
  if (currentMonthData.income > 0 && (recurringTotal / currentMonthData.income) <= 0.3) { score += 15; breakdown.push("Fixed costs comfortably low (< 30% income)"); }
  else { score += 5; breakdown.push("High fixed costs burden"); }
  const borrowedDebt = loans.filter(l => l.type === 'borrowed').reduce((acc, l) => acc + (l.amount - l.amountPaid), 0);
  if (borrowedDebt === 0) { score += 15; breakdown.push("No outstanding borrowed debt"); }
  else breakdown.push("Carrying borrowed debt");
  const hasEmergency = goals.some(g => g.name.toLowerCase().includes('emergency') && g.current > 0);
  if (hasEmergency) { score += 10; breakdown.push("Active emergency fund"); }
  else breakdown.push("No emergency fund tracking");
  const message = score >= 80 ? "Great financial shape! Strong savings performance." : score >= 60 ? "Good standing. Room to optimize savings and fixed costs." : "Needs attention. Focus on building savings and an emergency fund.";
  return { score, breakdown, message };
};

export const processRecurringExpenses = ({
  recurring = [],
  transactions = [],
  processedRecurring = [],
  todayStr = getTodayStr(),
  availableBalance = 0,
  generateId,
}) => {
  const currentMonth = todayStr.slice(0, 7);
  const currentDay = Number(todayStr.slice(8, 10));
  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const processedSet = new Set(processedRecurring || []);

  (transactions || []).forEach(t => {
    if (t?.recurringId && t?.recurringOccurrence) {
      processedSet.add(`${t.recurringId}:${t.recurringOccurrence}`);
    }
  });

  const newTransactions = [];
  const newProcessedKeys = [];
  const blockedExpenses = [];

  let runningAvailableBalance = availableBalance;

  const sortedRecurring = [...(recurring || [])].sort((a, b) => {
    const dayA = Number(a?.day) || 1;
    const dayB = Number(b?.day) || 1;
    if (dayA !== dayB) return dayA - dayB;
    return String(a?.id || '').localeCompare(String(b?.id || ''));
  });

  for (const item of sortedRecurring) {
    if (!item || !item.id) continue;
    const occurrenceKey = `${item.id}:${currentMonth}`;
    if (processedSet.has(occurrenceKey)) {
      continue;
    }

    const itemDay = Number(item.day) || 1;
    const dueDay = Math.min(Math.max(itemDay, 1), daysInMonth);

    if (dueDay <= currentDay) {
      const amount = Math.abs(Number(item.amount) || 0);
      if (!Number.isFinite(amount) || amount <= 0) continue;

      if (runningAvailableBalance >= amount) {
        runningAvailableBalance -= amount;
        const dueDayStr = String(dueDay).padStart(2, '0');
        const txDate = `${currentMonth}-${dueDayStr}`;
        const newTx = {
          id: generateId ? generateId('recurring-tx') : `recurring-tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: 'expense',
          amount,
          category: item.category || 'utilities',
          paymentMethod: item.paymentMethod || 'bank',
          date: txDate,
          note: item.name ? `${item.name} (Recurring)` : 'Recurring Expense',
          recurringId: item.id,
          recurringOccurrence: currentMonth,
          isRecurring: true,
        };
        newTransactions.push(newTx);
        newProcessedKeys.push(occurrenceKey);
        processedSet.add(occurrenceKey);
      } else {
        blockedExpenses.push({
          recurringId: item.id,
          name: item.name || 'Recurring Expense',
          amount,
          dueDay,
          currentMonth,
          required: amount,
          available: runningAvailableBalance,
        });
      }
    }
  }

  return {
    newTransactions,
    newProcessedKeys,
    blockedExpenses,
  };
};

export const calculateProjections = (recurring, planned, transactions, balance, currentMonthData, selectedMonth) => {
  const todayStr = getTodayStr();
  const currentMonth = todayStr.slice(0, 7);
  const isCurrentForecastMonth = selectedMonth === currentMonth;
  const todayDay = Number(todayStr.slice(8, 10));
  const daysInCurrentMonth = new Date(Number(todayStr.slice(0, 4)), Number(todayStr.slice(5, 7)), 0).getDate();
  const monthEndStr = `${currentMonth}-${String(daysInCurrentMonth).padStart(2, '0')}`;

  const upcomingRecurringTotal = isCurrentForecastMonth ? (recurring || []).reduce((sum, item) => {
    if (!item || !item.id) return sum;
    const hasBeenRecorded = (transactions || []).some(transaction =>
      transaction &&
      transaction.type === 'expense' &&
      transaction.recurringId === item.id &&
      transaction.recurringOccurrence === currentMonth
    );
    if (hasBeenRecorded) return sum;

    const dueDay = Math.min(Math.max(Number(item.day) || 1, 1), daysInCurrentMonth);
    if (dueDay < todayDay) return sum;
    return sum + Number(item.amount);
  }, 0) : 0;
  const upcomingPlannedTotal = isCurrentForecastMonth ? (planned || []).filter(item => item && item.date >= todayStr && item.date <= monthEndStr).reduce((sum, item) => sum + Number(item.amount), 0) : 0;
  return { upcomingRecurringTotal, projectedBalance: balance - upcomingRecurringTotal - upcomingPlannedTotal, projectedSavings: currentMonthData.income - currentMonthData.expense - upcomingRecurringTotal - upcomingPlannedTotal };
};

// --- Offline quick-entry parser (works even with no API key / API failure) ---
const INCOME_KEYWORDS = [
  'income', 'salary', 'paid me', 'payment received', 'received', 'earned', 'earning',
  'credited', 'refund', 'refunded', 'bonus', 'cashback', 'stipend', 'freelance',
  'client', 'invoice', 'dividend', 'profit', 'sold', 'gift', 'pocket money',
];

// Words that mean money LEFT your pocket, even when a normally-incoming word
// like "gift" or "refund" is present ("I gifted 1000 to a friend").
const OUTGOING_VERBS = [
  'gave', 'gifted', 'gifting', 'sent', 'lent', 'loaned', 'donated', 'transferred',
  'spent', 'bought', 'purchased', 'returned', 'paid for', 'paid to', 'repaid',
];

// Words that flip it back to incoming ("she gifted me 1000").
const INCOMING_MARKERS = [
  'received', 'got', 'credited', 'earned', 'from', 'paid me', 'gave me',
  'sent me', 'gifted me', 'refunded me', 'cashback', 'salary',
];

const INCOME_CATEGORY_HINTS = {
  salary: ['salary', 'payday', 'paycheck', 'wages', 'stipend', 'job'],
  freelance: ['freelance', 'client', 'invoice', 'gig', 'project', 'contract', 'side hustle'],
  investment: ['investment', 'dividend', 'interest', 'stocks', 'mutual fund', 'crypto', 'returns', 'profit'],
  gift: ['gift', 'gifted', 'pocket money', 'birthday'],
  other_income: ['refund', 'cashback', 'sold', 'bonus', 'misc'],
};

const EXPENSE_CATEGORY_HINTS = {
  food: ['food', 'snack', 'snacks', 'lunch', 'dinner', 'breakfast', 'restaurant', 'cafe', 'coffee', 'tea',
         'swiggy', 'zomato', 'pizza', 'burger', 'grocery', 'groceries', 'chai', 'juice', 'ice cream', 'meal'],
  entertainment: ['movie', 'cinema', 'netflix', 'spotify', 'game', 'gaming', 'concert', 'party', 'subscription', 'youtube', 'prime'],
  education: ['book', 'books', 'course', 'tuition', 'fees', 'college', 'school', 'exam', 'udemy', 'class', 'coaching'],
  transport: ['uber', 'ola', 'taxi', 'cab', 'bus', 'train', 'metro', 'fuel', 'petrol', 'diesel', 'auto', 'rickshaw', 'flight', 'parking', 'toll'],
  utilities: ['electricity', 'water bill', 'gas', 'internet', 'wifi', 'broadband', 'recharge', 'mobile', 'phone bill', 'rent', 'bill', 'dth'],
  shopping: ['shopping', 'clothes', 'shirt', 'shoes', 'amazon', 'flipkart', 'myntra', 'gadget', 'headphones', 'laptop', 'phone case'],
  health: ['medicine', 'doctor', 'hospital', 'pharmacy', 'gym', 'clinic', 'medical', 'dentist', 'checkup'],
  other_expense: [],
};

const PAYMENT_HINTS = {
  cash: ['cash'],
  card: ['card', 'credit card', 'debit card'],
  bank: ['bank', 'neft', 'imps', 'transfer'],
  wallet: ['wallet'],
  upi: ['upi', 'gpay', 'google pay', 'phonepe', 'paytm', 'bhim'],
};

// Turns "240 snacks" / "1000 income" / "got 5k salary yesterday" into a draft.
export const parseQuickEntry = (input, todayStr = getTodayStr()) => {
  const raw = String(input || '');
  const text = raw.toLowerCase();

  // ---- amount ----
  let amount = null;
  const amountMatch = text.match(/(?:₹|rs\.?|inr|\$)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|lakh|lac|cr)?\b/i);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    const suffix = (amountMatch[2] || '').toLowerCase();
    if (suffix === 'k') amount *= 1000;
    else if (suffix === 'lakh' || suffix === 'lac') amount *= 100000;
    else if (suffix === 'cr') amount *= 10000000;
  }
  if (!Number.isFinite(amount) || amount <= 0) amount = null;

  // ---- type (direction matters: "gifted 1000 to a friend" is money OUT) ----
  const hasOutgoingVerb = OUTGOING_VERBS.some(v => text.includes(v));
  const hasRecipient = /\bto\s+(a|an|my|his|her|their|the|someone|friend|mom|dad|brother|sister|[a-z]+)\b/.test(text);
  const hasIncomingMarker = INCOMING_MARKERS.some(m => text.includes(m));

  let isIncome;
  if (hasOutgoingVerb && (hasRecipient || !hasIncomingMarker)) isIncome = false;
  else isIncome = INCOME_KEYWORDS.some(k => text.includes(k));
  const type = isIncome ? 'income' : 'expense';

  // ---- category ----
  const hints = isIncome ? INCOME_CATEGORY_HINTS : EXPENSE_CATEGORY_HINTS;
  let category = null;
  let bestLen = 0;
  Object.entries(hints).forEach(([catId, words]) => {
    words.forEach(w => {
      if (text.includes(w) && w.length > bestLen) { bestLen = w.length; category = catId; }
    });
  });
  if (!category) category = isIncome ? 'other_income' : 'other_expense';

  // ---- payment method ----
  let paymentMethod = 'upi';
  Object.entries(PAYMENT_HINTS).forEach(([id, words]) => {
    if (words.some(w => text.includes(w))) paymentMethod = id;
  });

  // ---- date ----
  let date = todayStr;
  const explicit = raw.match(/(\d{4}-\d{2}-\d{2})/);
  if (explicit) date = sanitizeDate(explicit[1], todayStr);
  else if (text.includes('day before yesterday')) date = shiftDate(todayStr, -2);
  else if (text.includes('yesterday')) date = shiftDate(todayStr, -1);
  else if (text.includes('tomorrow')) date = shiftDate(todayStr, 1);

  // ---- note ----
  let note = raw
    .replace(/(?:₹|rs\.?|inr|\$)\s*/gi, ' ')
    .replace(/\b\d[\d,]*(?:\.\d+)?\s*(?:k|lakh|lac|cr)?\b/gi, ' ')
    .replace(/\b(on|for|spent|paid|added|add|income|expense|rupees|rupee)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!note) note = isIncome ? 'Income' : 'Expense';
  note = note.charAt(0).toUpperCase() + note.slice(1);

  return { type, amount, category, paymentMethod, date, note };
};

export const calculateWarnings = (currentMonthData, monthlyTarget, categoryTargets, currency, expenseCategories, recurringErrors = []) => {
  const alerts = [];
  const savings = currentMonthData?.savings ?? 0;

  (recurringErrors || []).forEach(err => {
    const formattedReq = new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(err.required);
    const formattedAvail = new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Math.max(0, err.available));
    alerts.push({
      type: 'warning',
      icon: 'warning',
      text: `Recurring expense "${err.name}" (${formattedReq}) could not be recorded due to insufficient balance (${formattedAvail} available).`,
    });
  });

  if (monthlyTarget > 0) {
    if (savings < monthlyTarget) {
      const diff = monthlyTarget - savings;
      const formattedDiff = new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(diff);
      const formattedTarget = new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(monthlyTarget);

      if (savings < 0) {
        alerts.push({
          type: 'danger',
          icon: 'danger',
          text: `You have negative savings and are ${formattedDiff} behind your monthly savings target of ${formattedTarget}!`,
        });
      } else {
        alerts.push({
          type: 'warning',
          icon: 'warning',
          text: `You are ${formattedDiff} behind your monthly savings target of ${formattedTarget}.`,
        });
      }
    }
  }

  Object.entries(categoryTargets || {}).forEach(([catId, limit]) => {
    const spent = currentMonthData?.categorySpending?.[catId] || 0;
    const catLabel = expenseCategories.find(c => c.id === catId)?.label || catId;
    if (spent > limit) {
      alerts.push({
        type: 'danger',
        icon: 'danger',
        text: `You've overspent on ${catLabel} by ${new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(spent - limit)}.`,
      });
    } else if (limit > 0 && (spent / limit) >= 0.8) {
      alerts.push({
        type: 'warning',
        icon: 'warning',
        text: `${catLabel} budget is ${((spent / limit) * 100).toFixed(0)}% used.`,
      });
    }
  });

  return alerts;
};

export const calculateNoSpendStreak = (transactions) => {
  const expenseList = (transactions || []).filter(t => t.type === 'expense' && !Number.isNaN(new Date(t.date).getTime()));
  if (expenseList.length === 0) return 0;
  let streak = 0;
  let d = new Date(getTodayStr());
  d.setHours(0, 0, 0, 0);
  const expenseDates = new Set(expenseList.map(t => new Date(t.date).toISOString().split('T')[0]));
  while (streak < 365) {
    const dateStr = d.toISOString().split('T')[0];
    if (!expenseDates.has(dateStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

export const calculateFrequentCategory = (displayTransactions, expenseCategories) => {
  const counts = {};
  (displayTransactions || []).filter(t => t.type === 'expense').forEach(t => {
    counts[t.category] = (counts[t.category] || 0) + 1;
  });
  let maxCat = null;
  let maxCount = 0;
  Object.entries(counts).forEach(([cat, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxCat = cat;
    }
  });
  if (maxCount >= 1 && maxCat) {
    const label = expenseCategories.find(c => c.id === maxCat)?.label || maxCat;
    return { label, count: maxCount };
  }
  return null;
};

export const calculateElapsedDays = (selectedMonth) => {
  const today = getTodayStr();
  const [year, month] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  if (selectedMonth === today.slice(0, 7)) return Math.max(1, Number(today.slice(8, 10)));
  if (selectedMonth > today.slice(0, 7)) return 1;
  return daysInMonth;
};

export const calculateDaysRemainingInfo = (selectedMonth) => {
  const today = getTodayStr();
  const currentMonth = today.slice(0, 7);
  const [year, month] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  if (selectedMonth === currentMonth) {
    return { label: `${Math.max(0, daysInMonth - Number(today.slice(8, 10)))} Days`, isCurrent: true };
  }
  return { label: selectedMonth > currentMonth ? 'Future Month' : 'Past Month', isCurrent: false };
};

