import { callGeminiJSON } from './gemini';
import { getMonthString } from '../utils/dates';

export const buildMonthSummary = ({
  transactions,
  selectedMonth,
  currentMonthData,
  previousMonthData,
  currency,
  monthlyTarget,
  dailyAverage,
  categoryTargets,
  recurring,
  loans,
  goals,
  financialHealth,
  expenseCategories,
  paymentMethods,
}) => {
  const monthTx = transactions.filter(t => (
    typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(t.date)
      ? t.date.slice(0, 7) === selectedMonth
      : getMonthString(t.date) === selectedMonth
  ));
  const monthExpenses = monthTx.filter(t => t.type === 'expense');

  const byCategory = {};
  monthExpenses.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + t.amount; });
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([id, amount]) => ({
      category: expenseCategories.find(c => c.id === id)?.label || id,
      amount: Math.round(amount),
      share: currentMonthData.expense > 0 ? Math.round((amount / currentMonthData.expense) * 1000) / 10 : 0,
    }));

  const byPayment = {};
  monthExpenses.forEach(t => {
    const label = paymentMethods.find(p => p.id === t.paymentMethod)?.label || 'Other';
    byPayment[label] = (byPayment[label] || 0) + t.amount;
  });

  const largest = [...monthExpenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(t => ({
      note: t.note || (expenseCategories.find(c => c.id === t.category)?.label || t.category),
      amount: Math.round(t.amount),
      date: t.date,
    }));

  const budgets = Object.entries(categoryTargets || {})
    .filter(([, limit]) => Number(limit) > 0)
    .map(([id, limit]) => ({
      category: expenseCategories.find(c => c.id === id)?.label || id,
      limit: Number(limit),
      spent: Math.round(currentMonthData.categorySpending[id] || 0),
    }));

  return {
    currency,
    month: selectedMonth,
    transactionCount: monthTx.length,
    income: Math.round(currentMonthData.income),
    expense: Math.round(currentMonthData.expense),
    savings: Math.round(currentMonthData.savings),
    savingsRatePct: currentMonthData.income > 0
      ? Math.round((currentMonthData.savings / currentMonthData.income) * 1000) / 10
      : 0,
    previousMonth: {
      income: Math.round(previousMonthData.income),
      expense: Math.round(previousMonthData.expense),
      savings: Math.round(previousMonthData.savings),
    },
    monthlyExpenseTarget: Number(monthlyTarget) || 0,
    averageDailySpend: Math.round(dailyAverage),
    topCategories,
    largestExpenses: largest,
    paymentMix: Object.entries(byPayment).map(([method, amount]) => ({ method, amount: Math.round(amount) })),
    categoryBudgets: budgets,
    recurringMonthlyTotal: Math.round(recurring.reduce((s, r) => s + r.amount, 0)),
    outstandingBorrowed: Math.round(loans.filter(l => l.type === 'borrowed').reduce((s, l) => s + (l.amount - l.amountPaid), 0)),
    outstandingLent: Math.round(loans.filter(l => l.type === 'lent').reduce((s, l) => s + (l.amount - l.amountPaid), 0)),
    goals: goals.map(g => ({ name: g.name, target: g.target, saved: g.current })),
    healthScore: financialHealth.score,
  };
};

export const buildLocalInsights = (s, formatMoney) => {
  const top = s.topCategories[0];
  const prevDelta = s.expense - s.previousMonth.expense;

  const highlights = [];
  if (top) highlights.push(`${top.category} is your biggest category at ${formatMoney(top.amount)} (${top.share}% of spending).`);
  if (s.previousMonth.expense > 0) {
    highlights.push(prevDelta >= 0
      ? `You spent ${formatMoney(Math.abs(prevDelta))} more than last month.`
      : `You spent ${formatMoney(Math.abs(prevDelta))} less than last month.`);
  }
  if (s.monthlyExpenseTarget > 0) {
    highlights.push(s.expense > s.monthlyExpenseTarget
      ? `Over your ${formatMoney(s.monthlyExpenseTarget)} target by ${formatMoney(s.expense - s.monthlyExpenseTarget)}.`
      : `${formatMoney(s.monthlyExpenseTarget - s.expense)} still left in your monthly target.`);
  }
  if (s.largestExpenses[0]) highlights.push(`Largest single expense: ${s.largestExpenses[0].note} at ${formatMoney(s.largestExpenses[0].amount)}.`);
  if (s.outstandingBorrowed > 0) highlights.push(`You still owe ${formatMoney(s.outstandingBorrowed)} across borrowed loans.`);

  const observation = s.transactionCount === 0
    ? `No transactions recorded for ${s.month} yet, so there is nothing to analyse.`
    : `You logged ${s.transactionCount} transactions in ${s.month}: ${formatMoney(s.income)} in, ${formatMoney(s.expense)} out, leaving ${formatMoney(s.savings)} (${s.savingsRatePct}% savings rate).`;

  const suggestion = top
    ? `Trim ${top.category} by about 15% (roughly ${formatMoney(Math.round(top.amount * 0.15))}) and set that as a category budget - it is the single fastest way to lift your savings rate.`
    : 'Start by setting a monthly expense target so future reports can measure you against it.';

  return { observation, suggestion, highlights };
};

export const generateMonthlyReport = async ({
  apiKey,
  formatMoney,
  transactions,
  selectedMonth,
  currentMonthData,
  previousMonthData,
  currency,
  monthlyTarget,
  dailyAverage,
  categoryTargets,
  recurring,
  loans,
  goals,
  financialHealth,
  expenseCategories,
  paymentMethods,
}) => {
  const summary = buildMonthSummary({
    transactions,
    selectedMonth,
    currentMonthData,
    previousMonthData,
    currency,
    monthlyTarget,
    dailyAverage,
    categoryTargets,
    recurring,
    loans,
    goals,
    financialHealth,
    expenseCategories,
    paymentMethods,
  });
  const fallback = buildLocalInsights(summary, formatMoney);

  if (!apiKey) {
    return {
      insights: fallback,
      error: 'No API key saved, so this is an automatic (non-AI) analysis. Add a Gemini key to get written insights.',
    };
  }

  const instruction = [
    'You are a concise personal finance analyst. Analyse ONLY the JSON data below - never invent numbers.',
    `All amounts are in ${summary.currency}.`,
    'Write specific, data-referencing insights for this exact month. Mention real category names and real amounts from the data.',
    'Return ONLY JSON with this shape:',
    '{"observation": string (2-3 sentences on what actually happened this month),',
    ' "suggestion": string (2-3 sentences of concrete, quantified advice),',
    ' "highlights": string[] (3-5 short bullet points, each with a real number),',
    ' "watchOut": string (one risk or leak to watch)}',
    '',
    'DATA:',
    JSON.stringify(summary),
  ].join('\n');

  const ai = await callGeminiJSON(apiKey, [{ text: instruction }]);

  if (ai.ok && ai.data && (ai.data.observation || ai.data.suggestion)) {
    return {
      insights: {
        observation: ai.data.observation || fallback.observation,
        suggestion: ai.data.suggestion || fallback.suggestion,
        highlights: Array.isArray(ai.data.highlights) ? ai.data.highlights.filter(Boolean) : fallback.highlights,
        watchOut: typeof ai.data.watchOut === 'string' ? ai.data.watchOut : null,
      },
      error: null,
    };
  }

  return {
    insights: fallback,
    error: `AI insights unavailable (${ai.error || 'unexpected response'}). Showing an automatic analysis instead.`,
  };
};
