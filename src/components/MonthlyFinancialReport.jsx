export default function MonthlyFinancialReport({
  selectedMonth,
  monthLabel,
  currentMonthData = { income: 0, expense: 0, savings: 0 },
  previousMonthData = { income: 0, expense: 0, savings: 0 },
  balance = 0,
  monthlyTarget = 0,
  categoryTargets = {},
  financialHealth = { score: 0, status: 'Needs attention', breakdown: [] },
  dailyAverage = 0,
  noSpendStreak = 0,
  daysRemainingInfo = { daysRemaining: 0, label: '0 days left', isComplete: false },
  frequentCategory = null,
  expensesByCategory = [],
  monthTransactions = [],
  reportInsights = null,
  formatMoney = (val) => String(val),
  currency = 'INR',
  expenseCategories = [],
  incomeSources = [],
  paymentMethods = [],
}) {
  // Financial Overview derivations
  const savingsDiff = currentMonthData.savings - monthlyTarget;
  const healthScoreVal = Math.max(0, Math.min(100, Math.round(financialHealth?.score || 0)));
  const healthRatingLabel = healthScoreVal >= 80 ? 'Great shape' : healthScoreVal >= 60 ? 'Good standing' : 'Needs attention';

  // Month Comparison derivations
  const prevIncome = previousMonthData?.income || 0;
  const incomeDiff = currentMonthData.income - prevIncome;
  const isNewIncome = prevIncome === 0 && currentMonthData.income > 0;
  const incomeGrowthText = prevIncome > 0
    ? `${incomeDiff > 0 ? '+' : ''}${((incomeDiff / prevIncome) * 100).toFixed(1)}%`
    : currentMonthData.income > 0
    ? 'New income'
    : '0.0%';

  const prevExpense = previousMonthData?.expense || 0;
  const expenseDiff = currentMonthData.expense - prevExpense;
  const topCategory = expensesByCategory?.[0];

  // Helper for date formatting
  const formatTxDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return '—';
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
      if (!Number.isNaN(dateObj.getTime())) {
        const day = dateObj.getDate();
        const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });
        return `${day} ${monthShort}`;
      }
    }
    return dateStr;
  };

  const getCategoryLabel = (t) => {
    const isIncome = t.type === 'income';
    const list = isIncome ? incomeSources : expenseCategories;
    const match = list.find((c) => c.id === t.category);
    return match ? match.label : (t.category || 'Other');
  };

  const getPaymentLabel = (pmId) => {
    if (!pmId) return 'UPI';
    const match = paymentMethods.find((p) => p.id === pmId);
    return match ? match.label : pmId.toUpperCase();
  };

  const loanMovementsCount = monthTransactions.filter((t) => Boolean(t.linkedLoanId)).length;

  return (
    <div className="print-document font-sans text-slate-900 bg-white p-0 m-0 leading-relaxed text-sm">
      {/* ==================================================
          REPORT HEADER
          ================================================== */}
      <header className="border-b-2 border-slate-900 pb-3 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              Clarity Finance
            </h1>
            <p className="text-sm font-bold text-indigo-700 mt-0.5">
              Monthly Financial Report
            </p>
            <p className="text-lg font-extrabold text-slate-800 mt-0.5">
              {monthLabel ? monthLabel(selectedMonth) : selectedMonth}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 space-y-0.5">
            <p className="font-semibold text-slate-700">Official Monthly Statement</p>
            <p>Period: <span className="font-mono font-bold text-slate-800">{selectedMonth}</span></p>
            <p>Currency: <span className="font-bold text-slate-800">{currency}</span></p>
            <p>Generated: <span className="font-mono text-slate-600">{new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
          </div>
        </div>
      </header>

      {/* ==================================================
          1. FINANCIAL OVERVIEW
          ================================================== */}
      <section className="mb-4 report-avoid-break">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 border-b border-slate-300 pb-0.5">
            1. Financial Overview
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {/* Monthly Income */}
          <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50">
            <span className="text-[10px] font-bold text-slate-600 block uppercase">Monthly Income</span>
            <p className="text-lg font-black text-emerald-700 mt-0.5">
              {formatMoney(currentMonthData.income)}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {currentMonthData.income > 0 ? 'Total received' : 'No income recorded'}
            </p>
          </div>

          {/* Monthly Expenses */}
          <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50">
            <span className="text-[10px] font-bold text-slate-600 block uppercase">Monthly Expenses</span>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              {formatMoney(currentMonthData.expense)}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Avg: {formatMoney(dailyAverage)} / day
            </p>
          </div>

          {/* Monthly Savings */}
          <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50">
            <span className="text-[10px] font-bold text-slate-600 block uppercase">Monthly Savings</span>
            <p className={`text-lg font-black mt-0.5 ${currentMonthData.savings >= 0 ? 'text-indigo-800' : 'text-rose-700'}`}>
              {formatMoney(currentMonthData.savings)}
            </p>
            <p className="text-[10px] font-medium text-slate-600 mt-0.5">
              {monthlyTarget > 0 ? (
                <>
                  Goal: {formatMoney(monthlyTarget)} (
                  <span className={currentMonthData.savings >= monthlyTarget ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                    {currentMonthData.savings > monthlyTarget
                      ? `+${formatMoney(savingsDiff)} ahead`
                      : currentMonthData.savings === monthlyTarget
                      ? 'Goal achieved'
                      : `-${formatMoney(Math.abs(savingsDiff))} behind`}
                  </span>
                  )
                </>
              ) : (
                'Savings Goal: Not set'
              )}
            </p>
          </div>

          {/* Total Balance & Health */}
          <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50">
            <span className="text-[10px] font-bold text-slate-600 block uppercase">Total Balance</span>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              {formatMoney(balance)}
            </p>
            <div className="flex items-center justify-between text-[10px] mt-0.5 text-slate-600">
              <span>Health Score:</span>
              <span className="font-extrabold text-slate-800">
                {healthScoreVal}/100 ({healthRatingLabel})
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          2. MONTH COMPARISON
          ================================================== */}
      <section className="mb-4 report-avoid-break">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 border-b border-slate-300 pb-0.5 mb-1.5">
          2. Month Comparison (vs Previous Month)
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Income Comparison */}
          <div className="border border-slate-300 rounded-lg p-2.5">
            <div className="flex justify-between items-center text-xs mb-1 pb-1 border-b border-slate-200">
              <span className="font-bold text-slate-800">Income Change</span>
              <span className={`font-black ${incomeDiff > 0 ? 'text-emerald-700' : incomeDiff < 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                {incomeDiff > 0 ? `+${formatMoney(incomeDiff)}` : incomeDiff < 0 ? `-${formatMoney(Math.abs(incomeDiff))}` : formatMoney(0)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div>Previous Month Income: <strong className="text-slate-800">{formatMoney(prevIncome)}</strong></div>
              <div>Income Growth: <strong className={incomeDiff > 0 || isNewIncome ? 'text-emerald-700' : incomeDiff < 0 ? 'text-rose-700' : 'text-slate-800'}>{incomeGrowthText}</strong></div>
            </div>
          </div>

          {/* Expense Comparison */}
          <div className="border border-slate-300 rounded-lg p-2.5">
            <div className="flex justify-between items-center text-xs mb-1 pb-1 border-b border-slate-200">
              <span className="font-bold text-slate-800">Expense Change</span>
              <span className={`font-black ${expenseDiff > 0 ? 'text-rose-700' : expenseDiff < 0 ? 'text-emerald-700' : 'text-slate-700'}`}>
                {expenseDiff > 0 ? `+${formatMoney(expenseDiff)}` : expenseDiff < 0 ? `-${formatMoney(Math.abs(expenseDiff))}` : formatMoney(0)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div>Previous Month Expenses: <strong className="text-slate-800">{formatMoney(prevExpense)}</strong></div>
              <div>Top Spending Category: <strong className="text-slate-800">{topCategory?.amount > 0 ? `${topCategory.label || 'Other'} (${formatMoney(topCategory.amount)})` : '—'}</strong></div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          3. SPENDING BREAKDOWN & 4. HABITS / INSIGHTS
          ================================================== */}
      <div className="grid grid-cols-2 gap-3 mb-4 report-avoid-break">
        {/* Spending Breakdown */}
        <section className="border border-slate-300 rounded-lg p-2.5 bg-white">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 border-b border-slate-300 pb-0.5 mb-1.5">
            3. Spending Breakdown by Category
          </h2>
          {expensesByCategory.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-1.5">No expenses recorded for this month.</p>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                  <th className="py-1">Category</th>
                  <th className="py-1 text-right">Amount</th>
                  <th className="py-1 text-right">Share</th>
                  <th className="py-1 text-right">Budget Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expensesByCategory.map((cat) => {
                  const target = categoryTargets[cat.id];
                  const hasTarget = target !== undefined && target !== '' && Number(target) > 0;
                  return (
                    <tr key={cat.id} className="py-0.5">
                      <td className="py-1 pr-2 font-semibold text-slate-800 whitespace-nowrap">
                        {cat.label}
                      </td>
                      <td className="py-1 px-2 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatMoney(cat.amount)}
                      </td>
                      <td className="py-1 px-2 text-right text-slate-600 whitespace-nowrap">
                        {cat.percentage ? `${cat.percentage.toFixed(1)}%` : '0.0%'}
                      </td>
                      <td className="py-1 pl-2 text-right text-[10px] text-slate-500 whitespace-nowrap">
                        {hasTarget ? (
                          <span className={cat.amount > Number(target) ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                            Limit: {formatMoney(Number(target))}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Habits & Monthly Insights */}
        <section className="border border-slate-300 rounded-lg p-2.5 bg-white">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 border-b border-slate-300 pb-0.5 mb-1.5">
            4. Habits & Monthly Insights
          </h2>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
              <span className="font-semibold text-slate-700">No-Spend Streak</span>
              <span className="font-bold text-slate-900">{noSpendStreak} Days</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Days Remaining</span>
              <span className="font-bold text-slate-900">{daysRemainingInfo?.label || '0 days left'}</span>
            </div>
            {frequentCategory && (
              <div className="py-0.5 border-b border-slate-100 text-[11px] text-slate-700">
                <span className="font-semibold">Frequent Category: </span>
                <span>{frequentCategory.label} ({frequentCategory.count} purchases)</span>
              </div>
            )}
            {Array.isArray(financialHealth?.breakdown) && financialHealth.breakdown.length > 0 && (
              <div className="pt-0.5">
                <span className="font-bold text-[10px] text-slate-500 uppercase block mb-0.5">Health Score Highlights:</span>
                <ul className="space-y-0.5 text-[11px] text-slate-700 list-disc list-inside">
                  {financialHealth.breakdown.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="truncate">{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {reportInsights?.observation && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-200 text-[11px] text-slate-700">
                <p><strong>AI Insight:</strong> {reportInsights.observation}</p>
                {reportInsights.suggestion && (
                  <p className="mt-0.5 text-slate-600 italic">Suggestion: {reportInsights.suggestion}</p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ==================================================
          5. TRANSACTION HISTORY
          ================================================== */}
      <section className="mb-6">
        <div className="flex justify-between items-end border-b border-slate-300 pb-1 mb-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-600">
            5. Transaction History ({monthTransactions.length} records)
          </h2>
          {loanMovementsCount > 0 && (
            <span className="text-[10px] font-bold text-indigo-700">
              Includes {loanMovementsCount} linked loan movement{loanMovementsCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {monthTransactions.length === 0 ? (
          <div className="border border-slate-200 rounded-lg p-6 text-center text-slate-500 text-xs italic">
            No transactions recorded for this month.
          </div>
        ) : (
          <table className="report-table w-full text-xs text-left border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 text-[10px] uppercase font-bold">
                <th className="py-2 px-2.5 border-r border-slate-200 w-16">Date</th>
                <th className="py-2 px-2.5 border-r border-slate-200">Description</th>
                <th className="py-2 px-2.5 border-r border-slate-200 w-36">Category</th>
                <th className="py-2 px-2.5 border-r border-slate-200 w-20">Payment</th>
                <th className="py-2 px-2.5 border-r border-slate-200 w-16 text-center">Type</th>
                <th className="py-2 px-2.5 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {monthTransactions.map((tx, idx) => {
                const isIncome = tx.type === 'income';
                const isLoanMovement = Boolean(tx.linkedLoanId);
                const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70';

                return (
                  <tr
                    key={tx.id || idx}
                    className={`border-b border-slate-200 ${rowBg} text-slate-800`}
                    style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                  >
                    {/* Date */}
                    <td className="py-1.5 px-2.5 border-r border-slate-200 font-mono text-[11px] whitespace-nowrap text-slate-700">
                      {formatTxDate(tx.date)}
                    </td>

                    {/* Description */}
                    <td className="py-1.5 px-2.5 border-r border-slate-200 font-medium break-words">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span>{tx.note || '—'}</span>
                        {isLoanMovement && (
                          <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded tracking-wide">
                            Linked loan movement
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-1.5 px-2.5 border-r border-slate-200 text-slate-700 whitespace-nowrap">
                      {getCategoryLabel(tx)}
                    </td>

                    {/* Payment Method */}
                    <td className="py-1.5 px-2.5 border-r border-slate-200 text-slate-600 text-[11px] whitespace-nowrap">
                      {getPaymentLabel(tx.paymentMethod)}
                    </td>

                    {/* Type */}
                    <td className="py-1.5 px-2.5 border-r border-slate-200 text-center whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isIncome ? 'Income' : 'Expense'}
                      </span>
                    </td>

                    {/* Amount */}
                    <td
                      className={`py-1.5 px-2.5 text-right font-mono font-bold whitespace-nowrap ${
                        isIncome ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatMoney(tx.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* ==================================================
          6. LOANS NOTE (If loans exist in this month)
          ================================================== */}
      {loanMovementsCount > 0 && (
        <section className="mb-6 report-avoid-break">
          <div className="border border-indigo-200 bg-indigo-50/50 rounded-lg p-3 text-xs text-indigo-950">
            <h3 className="font-bold text-indigo-900 mb-1">6. Loans & Repayments Summary</h3>
            <p className="leading-relaxed">
              This month includes <strong>{loanMovementsCount}</strong> linked loan transaction{loanMovementsCount > 1 ? 's' : ''}.
              Loan movements are categorized above and reflected in the total cash flow according to the existing loan movement ledger.
            </p>
          </div>
        </section>
      )}

      {/* ==================================================
          7. FINAL MONTH SUMMARY
          ================================================== */}
      <section className="report-avoid-break mt-6 pt-4 border-t-2 border-slate-900">
        <div className="flex justify-between items-end mb-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-600">
            7. Final Month Summary
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">
            Clarity Finance Statement • {selectedMonth}
          </span>
        </div>

        <div className="border border-slate-300 rounded-lg bg-slate-50 p-3">
          <div className="grid grid-cols-4 gap-2 text-center divide-x divide-slate-200">
            <div className="px-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Total Income</span>
              <span className="text-sm font-black text-emerald-700 block">
                {formatMoney(currentMonthData.income)}
              </span>
            </div>
            <div className="px-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Total Expenses</span>
              <span className="text-sm font-black text-slate-900 block">
                {formatMoney(currentMonthData.expense)}
              </span>
            </div>
            <div className="px-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Net Monthly Savings</span>
              <span className={`text-sm font-black block ${currentMonthData.savings >= 0 ? 'text-indigo-800' : 'text-rose-700'}`}>
                {formatMoney(currentMonthData.savings)}
              </span>
            </div>
            <div className="px-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Closing Balance</span>
              <span className="text-sm font-black text-slate-900 block">
                {formatMoney(balance)}
              </span>
            </div>
          </div>
        </div>

        <footer className="text-center text-[10px] text-slate-400 mt-4 pb-2">
          End of Report • Clarity Finance
        </footer>
      </section>
    </div>
  );
}
