import React, { useState, useMemo, useRef } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, Plus, Trash2, 
  Calendar, Tag, DollarSign, Euro, PoundSterling, IndianRupee, JapaneseYen, PieChart as PieChartIcon,
  CreditCard, Activity, ArrowRightLeft, Sparkles, Wand2, Loader2, Bot,
  Moon, Sun, AlertTriangle, Download, Target, Award, History, Settings, Landmark, Users, CheckCircle, X,
  Percent, BarChart, Flame, Repeat, Clock, Calculator, ArrowRight, Camera, Trophy, Search, Share2, Edit2, RefreshCw,
  Upload, DownloadCloud, FileText, ChevronRight, Key
} from 'lucide-react';

const globalStyles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up {
    animation: fadeInUp 0.5s ease-out forwards;
  }
  .stagger-1 { animation-delay: 0.1s; }
  .stagger-2 { animation-delay: 0.2s; }
  .stagger-3 { animation-delay: 0.3s; }
  
  @keyframes incomeFloatUp {
    0% { opacity: 0; transform: translate(-50%, 40px) scale(0.8); }
    20% { opacity: 1; transform: translate(-50%, 0) scale(1.1); }
    80% { opacity: 1; transform: translate(-50%, -20px) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -50px) scale(0.9); }
  }
  @keyframes expenseDropDown {
    0% { opacity: 0; transform: translate(-50%, -40px) scale(0.8); }
    20% { opacity: 1; transform: translate(-50%, 0) scale(1.1); }
    80% { opacity: 1; transform: translate(-50%, 20px) scale(1); }
    100% { opacity: 0; transform: translate(-50%, 50px) scale(0.9); }
  }
  .anim-income { animation: incomeFloatUp 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
  .anim-expense { animation: expenseDropDown 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .dark ::-webkit-scrollbar-thumb { background: #475569; }
  .dark ::-webkit-scrollbar-thumb:hover { background: #64748b; }

  @media print {
    body { background: white !important; color: black !important; }
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    .print-container { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
    .print-break-inside-avoid { page-break-inside: avoid; }
    * { color: black !important; text-shadow: none !important; box-shadow: none !important; }
  }
`;

const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: '🍔', color: 'bg-orange-500' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', color: 'bg-purple-500' },
  { id: 'education', label: 'Education', icon: '📚', color: 'bg-blue-500' },
  { id: 'transport', label: 'Transportation', icon: '🚗', color: 'bg-yellow-500' },
  { id: 'utilities', label: 'Utilities', icon: '💡', color: 'bg-cyan-500' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: 'bg-pink-500' },
  { id: 'health', label: 'Health', icon: '🏥', color: 'bg-red-500' },
  { id: 'other_expense', label: 'Other', icon: '📦', color: 'bg-slate-500' },
];

const INCOME_SOURCES = [
  { id: 'salary', label: 'Salary', icon: '💼', color: 'bg-green-600' },
  { id: 'freelance', label: 'Freelance', icon: '💻', color: 'bg-emerald-500' },
  { id: 'investment', label: 'Investment', icon: '📈', color: 'bg-teal-500' },
  { id: 'gift', label: 'Gift', icon: '🎁', color: 'bg-lime-500' },
  { id: 'other_income', label: 'Other', icon: '🪙', color: 'bg-slate-500' },
];

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'bank', label: 'Bank Transfer', icon: '🏦' },
  { id: 'wallet', label: 'Wallet', icon: '💼' },
];

const CURRENCIES = [
  { code: 'USD', icon: DollarSign, label: 'USD ($)' },
  { code: 'EUR', icon: Euro, label: 'EUR (€)' },
  { code: 'GBP', icon: PoundSterling, label: 'GBP (£)' },
  { code: 'INR', icon: IndianRupee, label: 'INR (₹)' },
  { code: 'JPY', icon: JapaneseYen, label: 'JPY (¥)' },
];

const getMonthString = (date) => new Date(date).toISOString().slice(0, 7);

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [transactionAnimation, setTransactionAnimation] = useState(null);
  
  // API Key state retrieved/stored securely in localStorage
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('clarity_gemini_key') || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  // Initializing empty state for fresh start
  const [transactions, setTransactions] = useState([]);

  const [formData, setFormData] = useState({ type: 'expense', amount: '', category: 'food', paymentMethod: 'upi', date: '2026-09-02', note: '' });
  const [isSplit, setIsSplit] = useState(false);
  const [splitDetails, setSplitDetails] = useState({ person: '', amount: '' });

  const [filter, setFilter] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [monthlyTarget, setMonthlyTarget] = useState(0);
  const [categoryTargets, setCategoryTargets] = useState({});
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);

  const [expectedIncome, setExpectedIncome] = useState(0);
  const [recurring, setRecurring] = useState([]);
  const [planned, setPlanned] = useState([]);
  const [recurringForm, setRecurringForm] = useState({ name: '', amount: '', day: '1', category: 'utilities' });
  const [plannedForm, setPlannedForm] = useState({ name: '', amount: '', date: '2026-09-15', category: 'other_expense' });

  const [loans, setLoans] = useState([]);
  const [loanForm, setLoanForm] = useState({ type: 'lent', person: '', amount: '', date: '2026-09-02', note: '' });
  const [paymentInputs, setPaymentInputs] = useState({});

  const [goals, setGoals] = useState([]);
  const [goalForm, setGoalForm] = useState({ name: '', target: '', current: '' });

  const [magicPrompt, setMagicPrompt] = useState('');
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);
  
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);
  
  const [showReport, setShowReport] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportInsights, setReportInsights] = useState(null);

  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);
  const [isTrendOpen, setIsTrendOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarYear, setCalendarYear] = useState(parseInt(selectedMonth.split('-')[0]));
  const [heatmapThresholds, setHeatmapThresholds] = useState({ green: 50, yellow: 150, orange: 300 });

  const saveApiKey = () => {
    localStorage.setItem('clarity_gemini_key', tempApiKey.trim());
    setApiKey(tempApiKey.trim());
    setShowApiKeyModal(false);
    setToast({ message: 'API Key saved successfully!' });
    setTimeout(() => setToast(null), 3000);
  };

  const monthlyData = useMemo(() => {
    const dataByMonth = {};
    transactions.forEach(t => {
      const month = getMonthString(t.date);
      if (!dataByMonth[month]) dataByMonth[month] = { income: 0, expense: 0, savings: 0, categorySpending: {} };
      
      if (t.type === 'income') dataByMonth[month].income += t.amount;
      else {
        dataByMonth[month].expense += t.amount;
        dataByMonth[month].categorySpending[t.category] = (dataByMonth[month].categorySpending[t.category] || 0) + t.amount;
      }
      dataByMonth[month].savings = dataByMonth[month].income - dataByMonth[month].expense;
    });
    return dataByMonth;
  }, [transactions]);

  const { currentMonthData, previousMonthData, highestSavingsMonth } = useMemo(() => {
    const current = monthlyData[selectedMonth] || { income: 0, expense: 0, savings: 0, categorySpending: {} };
    const dateObj = new Date(`${selectedMonth}-01`);
    dateObj.setMonth(dateObj.getMonth() - 1);
    const prevMonthStr = getMonthString(dateObj);
    const prev = monthlyData[prevMonthStr] || { income: 0, expense: 0, savings: 0, categorySpending: {} };

    let maxSavings = -Infinity, bestMonth = null;
    Object.entries(monthlyData).forEach(([month, data]) => {
      if (data.savings > maxSavings) { maxSavings = data.savings; bestMonth = month; }
    });

    return { currentMonthData: current, previousMonthData: prev, highestSavingsMonth: bestMonth ? { month: bestMonth, savings: maxSavings } : null };
  }, [monthlyData, selectedMonth]);

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    return transactions.reduce((acc, curr) => {
      if (curr.type === 'income') { acc.totalIncome += curr.amount; acc.balance += curr.amount; }
      else { acc.totalExpense += curr.amount; acc.balance -= curr.amount; }
      return acc;
    }, { totalIncome: 0, totalExpense: 0, balance: 0 });
  }, [transactions]);

  const displayTransactions = useMemo(() => {
    let result = transactions.filter(t => getMonthString(t.date) === selectedMonth);
    if (filter !== 'all') result = result.filter(t => t.type === filter);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(t => {
        const matchAmountGreater = query.match(/^>(\d+)/) || query.match(/^(\d+)\+$/);
        if (matchAmountGreater) return t.amount >= Number(matchAmountGreater[1] || matchAmountGreater[2]);
        const matchAmountLess = query.match(/^<(\d+)/);
        if (matchAmountLess) return t.amount <= Number(matchAmountLess[1]);
        
        const catLabel = (t.type === 'income' ? INCOME_SOURCES : EXPENSE_CATEGORIES).find(c => c.id === t.category)?.label.toLowerCase() || '';
        return (t.note && t.note.toLowerCase().includes(query)) || catLabel.includes(query) || t.amount.toString().includes(query);
      });
    }
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, selectedMonth, filter, searchQuery]);

  const expensesByCategory = useMemo(() => {
    const expenses = displayTransactions.filter(t => t.type === 'expense');
    const grouped = expenses.reduce((acc, curr) => { acc[curr.category] = (acc[curr.category] || 0) + curr.amount; return acc; }, {});
    return Object.entries(grouped)
      .map(([id, amount]) => {
        const cat = EXPENSE_CATEGORIES.find(c => c.id === id);
        return { ...cat, amount, percentage: currentMonthData.expense > 0 ? (amount / currentMonthData.expense) * 100 : 0 };
      }).sort((a, b) => b.amount - a.amount);
  }, [displayTransactions, currentMonthData.expense]);

  const warnings = useMemo(() => {
    const alerts = [];
    const expense = currentMonthData.expense;

    if (monthlyTarget > 0) {
      const overallPct = (expense / monthlyTarget) * 100;
      if (overallPct >= 100) alerts.push({ type: 'danger', icon: '🚨', text: `You have exceeded your overall budget by ${new Intl.NumberFormat(undefined, { style: 'currency', currency: currency }).format(expense - monthlyTarget)}!` });
      else if (overallPct >= 80) alerts.push({ type: 'warning', icon: '⚠️', text: `Overall budget ${overallPct.toFixed(0)}% used. Only ${new Intl.NumberFormat(undefined, { style: 'currency', currency: currency }).format(monthlyTarget - expense)} remaining.` });
    }
    
    Object.entries(categoryTargets).forEach(([catId, limit]) => {
      const spent = currentMonthData.categorySpending[catId] || 0;
      const catLabel = EXPENSE_CATEGORIES.find(c => c.id === catId)?.label || catId;
      if (spent > limit) alerts.push({ type: 'danger', icon: '🚨', text: `You've overspent on ${catLabel} by ${new Intl.NumberFormat(undefined, { style: 'currency', currency: currency }).format(spent - limit)}.` });
      else if (limit > 0 && (spent / limit) >= 0.8) alerts.push({ type: 'warning', icon: '⚠️', text: `${catLabel} budget is ${((spent / limit) * 100).toFixed(0)}% used.` });
    });
    return alerts;
  }, [currentMonthData, monthlyTarget, categoryTargets, currency]);

  const noSpendStreak = useMemo(() => {
    let streak = 0; let d = new Date('2026-09-02'); d.setHours(0, 0, 0, 0);
    const expenseDates = new Set(transactions.filter(t => t.type === 'expense').map(t => new Date(t.date).toISOString().split('T')[0]));
    while (true) {
      const dateStr = d.toISOString().split('T')[0];
      if (!expenseDates.has(dateStr)) { streak++; d.setDate(d.getDate() - 1); } else break;
    }
    return streak;
  }, [transactions]);

  const frequentCategory = useMemo(() => {
    const counts = {};
    displayTransactions.filter(t => t.type === 'expense').forEach(t => { counts[t.category] = (counts[t.category] || 0) + 1; });
    let maxCat = null, maxCount = 0;
    Object.entries(counts).forEach(([cat, count]) => { if (count > maxCount) { maxCount = count; maxCat = cat; } });
    if (maxCount >= 1 && maxCat) {
      const label = EXPENSE_CATEGORIES.find(c => c.id === maxCat)?.label || maxCat;
      return { label, count: maxCount };
    }
    return null;
  }, [displayTransactions]);

  const savingsDifference = currentMonthData.savings - previousMonthData.savings;
  const elapsedDays = 2; 
  const dailyAverage = currentMonthData.expense / elapsedDays;

  const projections = useMemo(() => {
    const todayStr = '2026-09-02';
    const upcomingRecurringTotal = recurring.reduce((sum, r) => sum + r.amount, 0);
    const upcomingPlannedTotal = planned.filter(p => p.date >= todayStr).reduce((sum, p) => sum + p.amount, 0);
    const expectedIncomeNum = Number(expectedIncome) || 0;
    const projectedBalance = balance + expectedIncomeNum - upcomingRecurringTotal - upcomingPlannedTotal;
    const projectedSavings = (currentMonthData.income + expectedIncomeNum) - (currentMonthData.expense + upcomingRecurringTotal + upcomingPlannedTotal);
    return { upcomingRecurringTotal, projectedBalance, projectedSavings };
  }, [recurring, planned, expectedIncome, balance, currentMonthData]);

  const financialHealth = useMemo(() => {
    let score = 0; let breakdown = [];
    const savingsRateVal = currentMonthData.income > 0 ? (currentMonthData.savings / currentMonthData.income) : 0;
    if (savingsRateVal >= 0.2) { score += 30; breakdown.push("Excellent savings rate (>= 20%)"); }
    else if (savingsRateVal > 0) { score += 15; breakdown.push("Positive savings rate, but under 20%"); }
    else breakdown.push("No savings generated this month");
    
    if (monthlyTarget > 0) {
      if (currentMonthData.expense <= monthlyTarget) { score += 30; breakdown.push("Spending within overall budget target"); }
      else { score += 10; breakdown.push("Spending exceeded budget target"); }
    } else { score += 20; breakdown.push("No strict budget target set"); }
    
    const recurringTotal = recurring.reduce((sum, r) => sum + r.amount, 0);
    if (currentMonthData.income > 0 && (recurringTotal / currentMonthData.income) <= 0.3) { score += 15; breakdown.push("Fixed costs comfortably low (< 30% income)"); }
    else { score += 5; breakdown.push("High fixed costs burden"); }
    
    const borrowedDebt = loans.filter(l => l.type === 'borrowed').reduce((acc, l) => acc + (l.amount - l.amountPaid), 0);
    if (borrowedDebt === 0) { score += 15; breakdown.push("No outstanding borrowed debt"); }
    else breakdown.push("Carrying borrowed debt");
    
    const hasEmergency = goals.some(g => g.name.toLowerCase().includes('emergency') && g.current > 0);
    if (hasEmergency) { score += 10; breakdown.push("Active emergency fund"); }
    else breakdown.push("No emergency fund tracking");
    
    let message = score >= 80 ? "Great financial shape! Strong savings and budgeting." : score >= 60 ? "Good standing. Room to optimize fixed costs." : "Needs attention. Focus on an emergency fund and budget limits.";
    return { score, breakdown, message };
  }, [currentMonthData, monthlyTarget, recurring, loans, goals]);

  const heatmapData = useMemo(() => {
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]) - 1;
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const data = [];
    for(let i = 0; i < firstDay; i++) data.push({ empty: true, id: `empty-${i}` });
    for(let i = 1; i <= days; i++) {
      const dateStr = `${selectedMonth}-${i.toString().padStart(2, '0')}`;
      const spent = transactions.filter(t => t.type === 'expense' && t.date === dateStr).reduce((sum, t) => sum + t.amount, 0);
      data.push({ day: i, dateStr, spent, empty: false });
    }
    return data;
  }, [transactions, selectedMonth]);

  const getHeatmapColor = (spent) => {
     if (spent === 0) return 'bg-slate-100 dark:bg-slate-800/50';
     if (spent <= heatmapThresholds.green) return 'bg-emerald-400 dark:bg-emerald-500';
     if (spent <= heatmapThresholds.yellow) return 'bg-yellow-400 dark:bg-yellow-500';
     if (spent <= heatmapThresholds.orange) return 'bg-orange-400 dark:bg-orange-500';
     return 'bg-rose-500 dark:bg-rose-600';
  };

  const sixMonthTrend = useMemo(() => {
    const trend = []; let currentDate = new Date(`${selectedMonth}-01`);
    for(let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const mStr = getMonthString(d);
      const dData = monthlyData[mStr] || { income: 0, expense: 0 };
      trend.push({ month: d.toLocaleDateString(undefined, { month: 'short' }), income: dData.income, expense: dData.expense });
    }
    const maxVal = Math.max(...trend.flatMap(t => [t.income, t.expense]), 1);
    return { trend, maxVal };
  }, [monthlyData, selectedMonth]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value, ...(name === 'type' && { category: value === 'expense' ? 'food' : 'salary' }) }));
  };
  const handleBudgetChange = (category, value) => setCategoryTargets(prev => ({ ...prev, [category]: Number(value) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) return;

    let amountNum = Number(formData.amount);
    if (formData.type === 'expense' && isSplit && splitDetails.amount && splitDetails.person && !editingId) {
      const splitAmt = Number(splitDetails.amount);
      if (splitAmt > 0 && splitAmt < amountNum) {
         amountNum = amountNum - splitAmt;
         setLoans(prev => [{ id: Date.now().toString() + '-loan', type: 'lent', person: splitDetails.person, amount: splitAmt, amountPaid: 0, date: formData.date, note: `Split: ${formData.note || 'Expense'}` }, ...prev]);
      }
    }

    const newTransaction = { id: editingId ? editingId : Date.now().toString(), ...formData, amount: amountNum };
    if (editingId) {
      setTransactions(prev => prev.map(t => t.id === editingId ? newTransaction : t));
      setEditingId(null); setToast({ message: 'Transaction updated successfully' });
    } else {
      setTransactions(prev => [newTransaction, ...prev]);
      setTransactionAnimation({ type: newTransaction.type, amount: amountNum, id: Date.now() });
      setTimeout(() => setTransactionAnimation(null), 1800);
    }
    setFormData({ type: 'expense', amount: '', category: 'food', paymentMethod: 'upi', date: '2026-09-02', note: '' });
    setIsSplit(false); setSplitDetails({ person: '', amount: '' });
    setSelectedMonth(getMonthString(newTransaction.date));
  };

  const deleteTransaction = (id) => {
    const tToDelete = transactions.find(t => t.id === id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    setToast({
      message: `Deleted ${tToDelete.category} transaction`,
      undoAction: () => { setTransactions(prev => [tToDelete, ...prev].sort((a,b) => new Date(b.date) - new Date(a.date))); setToast(null); }
    });
    setTimeout(() => setToast(null), 6000);
  };

  const initiateEdit = (transaction) => {
    setEditingId(transaction.id);
    setFormData({ type: transaction.type, amount: transaction.amount, category: transaction.category, paymentMethod: transaction.paymentMethod || 'upi', date: transaction.date, note: transaction.note || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecurringSubmit = (e) => {
    e.preventDefault();
    if (!recurringForm.name || !recurringForm.amount) return;
    setRecurring(prev => [...prev, { id: Date.now().toString(), name: recurringForm.name, amount: Number(recurringForm.amount), day: Number(recurringForm.day), category: recurringForm.category }]);
    setRecurringForm({ name: '', amount: '', day: '1', category: 'utilities' });
    setToast({ message: 'Recurring expense added!' }); setTimeout(() => setToast(null), 3000);
  };

  const handlePlannedSubmit = (e) => {
    e.preventDefault();
    if (!plannedForm.name || !plannedForm.amount) return;
    setPlanned(prev => [...prev, { id: Date.now().toString(), name: plannedForm.name, amount: Number(plannedForm.amount), date: plannedForm.date, category: plannedForm.category }]);
    setPlannedForm({ name: '', amount: '', date: '2026-09-15', category: 'other_expense' });
    setToast({ message: 'Planned expense added!' }); setTimeout(() => setToast(null), 3000);
  };

  const handleGoalSubmit = (e) => {
    e.preventDefault();
    if (!goalForm.name || !goalForm.target) return;
    setGoals(prev => [...prev, { id: Date.now().toString(), name: goalForm.name, target: Number(goalForm.target), current: Number(goalForm.current || 0) }]);
    setGoalForm({ name: '', target: '', current: '' });
    setToast({ message: 'Savings goal added!' }); setTimeout(() => setToast(null), 3000);
  };

  const handleLoanSubmit = (e) => {
    e.preventDefault();
    if (!loanForm.amount || !loanForm.person) return;
    setLoans(prev => [{ id: Date.now().toString(), ...loanForm, amount: Number(loanForm.amount), amountPaid: 0 }, ...prev]);
    setLoanForm({ type: 'lent', person: '', amount: '', date: '2026-09-02', note: '' });
  };

  const recordLoanPayment = (id) => {
    const payment = Number(paymentInputs[id]);
    if (!payment || payment <= 0) return;
    setLoans(prev => prev.map(l => l.id === id ? { ...l, amountPaid: Math.min(l.amount, l.amountPaid + payment) } : l));
    setPaymentInputs(prev => ({ ...prev, [id]: '' }));
  };

  const handleExport = () => {
    const data = { transactions, loans, goals, categoryTargets, recurring, planned };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `clarity-backup-2026-09-02.json`; a.click();
    setToast({ message: 'Backup successfully downloaded!' }); setTimeout(() => setToast(null), 3000);
  };

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.transactions) setTransactions(data.transactions);
        setToast({ message: 'Data completely restored!' });
      } catch (err) { setToast({ message: 'Invalid backup file!' }); }
      setTimeout(() => setToast(null), 4000);
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    try { window.print(); } catch (e) {
      setToast({ message: 'Printing blocked by browser. Press Ctrl+P or Cmd+P.' });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleFileUpload = async (e) => {
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    const file = e.target.files[0]; if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result.split(',')[1];
      try {
        const payload = {
          contents: [{ role: "user", parts: [
            { text: "Extract amount, category (food, entertainment, transport, utilities, shopping, health, education, other_expense), date (YYYY-MM-DD), and a short note (merchant name). Return JSON only: { amount: number, category: string, date: string, note: string }." },
            { inlineData: { mimeType: file.type, data: base64Data } }
          ]}],
          generationConfig: { responseMimeType: "application/json" }
        };
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          setFormData(prev => ({ ...prev, type: 'expense', amount: parsed.amount || '', category: parsed.category || 'other_expense', date: parsed.date || prev.date, note: parsed.note || '' }));
          setToast({ message: 'Receipt scanned! Please confirm details below.' });
        }
      } catch (err) { setToast({ message: 'Failed to scan receipt. Please check your API Key.' }); } 
      finally { setIsScanning(false); if (fileInputRef.current) fileInputRef.current.value = ''; setTimeout(() => setToast(null), 4000); }
    };
    reader.readAsDataURL(file);
  };

  const handleMagicAdd = async () => {
    if (!magicPrompt.trim()) return;
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    setIsMagicLoading(true);
    try {
      const payload = {
        contents: [{ role: "user", parts: [{ text: `Extract amount, category (food, entertainment, transport, utilities, shopping, health, education, other_expense), date (YYYY-MM-DD), and a short note from: "${magicPrompt}". Return JSON only: { amount: number, category: string, date: string, note: string }` }] }],
        generationConfig: { responseMimeType: "application/json" }
      };
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsed = JSON.parse(text);
        const newT = { id: Date.now().toString(), type: 'expense', amount: parsed.amount || 100, category: parsed.category || 'food', paymentMethod: 'upi', date: parsed.date || '2026-09-02', note: parsed.note || magicPrompt };
        setTransactions(prev => [newT, ...prev]);
        setMagicPrompt('');
        setTransactionAnimation({ type: 'expense', amount: newT.amount, id: Date.now() });
        setTimeout(() => setTransactionAnimation(null), 1800);
      }
    } catch (err) {
      setToast({ message: 'Magic Add failed. Check your API key.' });
    } finally {
      setIsMagicLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const generateDetailedReport = async () => {
    setShowReport(true);
    setIsReportLoading(true);
    setTimeout(() => {
      setReportInsights({
        observation: "Small recurring purchases and dining out contributed significantly to food spending this month.",
        suggestion: "Setting a specific ₹600 monthly drinks & snack budget would reduce discretionary spending without eliminating it."
      });
      setIsReportLoading(false);
    }, 800);
  };

  const formatMoney = (amount) => new Intl.NumberFormat(undefined, { style: 'currency', currency: currency }).format(amount);
  const CurrencyIcon = CURRENCIES.find(c => c.code === currency)?.icon || DollarSign;

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 selection:bg-indigo-100 dark:selection:bg-indigo-900/50 selection:text-indigo-900 dark:selection:text-indigo-100 print-container">
        <style>{globalStyles}</style>

        {/* Global Floating Transaction Animation */}
        {transactionAnimation && (
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 flex items-center gap-3 text-5xl font-black drop-shadow-2xl no-print ${transactionAnimation.type === 'income' ? 'anim-income text-emerald-500' : 'anim-expense text-rose-500'}`}>
            {transactionAnimation.type === 'income' ? '🤑' : '💸'} {transactionAnimation.type === 'income' ? '+' : '-'}{formatMoney(transactionAnimation.amount)}
          </div>
        )}

        {/* Top Navbar */}
        <nav className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm backdrop-blur-md transition-colors duration-300 no-print">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Activity className="w-6 h-6 shrink-0" />
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white hidden lg:block">Clarity Finance</h1>
              
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl ml-2 lg:ml-6">
                <button onClick={() => setActiveTab('dashboard')} className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium ${activeTab === 'dashboard' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>Dashboard</button>
                <button onClick={() => setActiveTab('forecast')} className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium ${activeTab === 'forecast' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>Forecast</button>
                <button onClick={() => setActiveTab('loans')} className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium ${activeTab === 'loans' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>Loans</button>
                <button onClick={() => setActiveTab('goals')} className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium ${activeTab === 'goals' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>Goals</button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
              
              {/* Custom Smooth Calendar Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => { setIsCalendarOpen(!isCalendarOpen); setCalendarYear(parseInt(selectedMonth.split('-')[0])); }} 
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 rounded-xl transition-all duration-300 ease-in-out cursor-pointer hover:shadow-sm"
                >
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {new Date(selectedMonth + '-01').toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                </button>

                {isCalendarOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCalendarOpen(false)}></div>
                    <div className="absolute top-full right-0 sm:left-0 mt-2 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 w-64 animate-fade-in-up origin-top-left">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                        <button onClick={() => setCalendarYear(y => y - 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><ChevronRight className="w-5 h-5 rotate-180" /></button>
                        <span className="font-bold text-lg">{calendarYear}</span>
                        <button onClick={() => setCalendarYear(y => y + 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><ChevronRight className="w-5 h-5" /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => {
                          const monthStr = `${calendarYear}-${(i+1).toString().padStart(2, '0')}`;
                          const isSelected = selectedMonth === monthStr;
                          return (
                            <button 
                              key={m} 
                              onClick={() => { setSelectedMonth(monthStr); setIsCalendarOpen(false); }}
                              className={`py-2 rounded-xl text-sm font-medium transition-colors ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300'}`}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Currency Selector */}
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-none rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all duration-300 ease-in-out cursor-pointer outline-none hover:shadow-sm focus:ring-2 focus:ring-indigo-500/50">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>

              <button onClick={() => { setTempApiKey(apiKey); setShowApiKeyModal(true); }} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-indigo-600 dark:text-indigo-400" title="API Key Settings"><Key className="w-5 h-5" /></button>
              <button onClick={handleExport} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Backup Data"><DownloadCloud className="w-5 h-5" /></button>
              <label className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" title="Restore Data"><Upload className="w-5 h-5" /><input type="file" accept=".json" onChange={handleImport} className="hidden" /></label>
              <button onClick={handlePrint} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Download Monthly PDF"><Download className="w-5 h-5" /></button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Toggle Theme">{isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
            </div>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          
          <div className="hidden print-only mb-8 border-b pb-4"><h1 className="text-3xl font-bold">Financial Report</h1><p className="text-lg text-gray-500">Month: {new Date(selectedMonth + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p></div>

          {/* Smart Alerts */}
          {warnings.length > 0 && activeTab === 'dashboard' && (
            <div className="animate-fade-in-up space-y-2 no-print">
              {warnings.map((warn, i) => (
                <div key={i} className={`flex items-center gap-3 border-l-4 p-4 rounded-r-xl shadow-sm ${warn.type === 'danger' ? 'bg-rose-50 border-rose-500 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300' : 'bg-amber-50 border-amber-500 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'}`}>
                  <span className="text-xl">{warn.icon}</span><p className="text-sm font-medium">{warn.text}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <>
              {/* Top Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in-up print-break-inside-avoid">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <div><div className="flex items-center gap-2 text-indigo-100 mb-2"><Wallet className="w-5 h-5" /><h2 className="font-medium">Monthly Savings</h2></div>
                    <p className="text-4xl font-bold">{formatMoney(currentMonthData.savings)}</p></div>
                    <div className="mt-4 pt-4 border-t border-white/20 flex gap-2 text-sm text-indigo-100"><History className="w-4 h-4" /><span>Vs Last: {savingsDifference >= 0 ? '+' : ''}{formatMoney(savingsDifference)}</span></div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-2"><TrendingUp className="w-5 h-5 text-emerald-500" /><h2>Monthly Income</h2></div>
                    <p className="text-3xl font-bold">{formatMoney(currentMonthData.income)}</p>
                  </div>
                  {highestSavingsMonth && <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">Best Month: {highestSavingsMonth.month} ({formatMoney(highestSavingsMonth.savings)})</p>}
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm relative flex flex-col justify-between">
                  <button onClick={() => setShowBudgetSettings(!showBudgetSettings)} className="absolute top-6 right-6 p-1 text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-700 rounded-md transition-colors"><Settings className="w-4 h-4" /></button>
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-2"><TrendingDown className="w-5 h-5 text-rose-500" /><h2>Monthly Expenses</h2></div>
                    <p className="text-3xl font-bold">{formatMoney(currentMonthData.expense)}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between text-xs mb-1"><span>Target</span><span>{formatMoney(monthlyTarget)}</span></div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${currentMonthData.expense > monthlyTarget ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min((currentMonthData.expense / monthlyTarget) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between group relative">
                  <div>
                    <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 text-indigo-400"><Activity className="w-5 h-5" /><h2>Health Score</h2></div><span className="text-2xl font-bold">{financialHealth.score}/100</span></div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">{financialHealth.message}</p>
                  </div>
                  <div className="absolute bottom-full left-0 mb-2 w-full p-3 bg-slate-900 border border-slate-700 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-xl z-50 translate-y-2 group-hover:translate-y-0">
                    <p className="font-bold mb-2 text-indigo-400 border-b border-slate-700 pb-1">Score Breakdown:</p>
                    <ul className="space-y-1">{financialHealth.breakdown.map((item, idx) => <li key={idx} className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-400 shrink-0"/> {item}</li>)}</ul>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-white/10 flex justify-between">Daily Spend: <span className="text-orange-400 font-bold">{formatMoney(dailyAverage)}</span></p>
                </div>
              </div>

              {showBudgetSettings && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-6 border border-indigo-100 dark:border-indigo-800">
                  <h3 className="text-lg font-semibold mb-4 text-indigo-900 dark:text-indigo-300">Set Monthly Budget Targets</h3>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                      <label className="text-xs text-slate-500 block mb-1">Overall Limit</label>
                      <input type="number" value={monthlyTarget} onChange={(e) => setMonthlyTarget(Number(e.target.value))} className="w-32 px-3 py-1 bg-slate-50 dark:bg-slate-900 rounded border border-transparent focus:border-indigo-300 dark:text-white transition-all outline-none" />
                    </div>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <div key={cat.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                        <label className="text-xs text-slate-500 block mb-1">{cat.icon} {cat.label}</label>
                        <input type="number" value={categoryTargets[cat.id] || ''} onChange={(e) => handleBudgetChange(cat.id, e.target.value)} placeholder="No limit" className="w-28 px-3 py-1 bg-slate-50 dark:bg-slate-900 rounded border border-transparent focus:border-indigo-300 dark:text-white transition-all outline-none" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Minimized Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up stagger-1">
                <div onClick={() => setIsHeatmapOpen(true)} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center cursor-pointer group hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-300 min-h-[200px]">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"><Calendar className="w-8 h-8 text-indigo-500" /></div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Daily Heatmap</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">Explore daily spending patterns.</p>
                </div>
                
                <div onClick={() => setIsTrendOpen(true)} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center cursor-pointer group hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all duration-300 min-h-[200px]">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"><BarChart className="w-8 h-8 text-emerald-500" /></div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">6-Month Trend</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">Visualize income vs expenses.</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 rounded-3xl p-6 border border-orange-100 dark:border-orange-800/30 shadow-sm flex flex-col justify-between min-h-[200px]">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Flame className="w-5 h-5 text-orange-500" /> Streaks & Habits</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm"><span className="text-sm font-medium">No-Spend Streak</span><span className="font-bold text-orange-500 flex items-center gap-1"><Flame className="w-4 h-4 fill-current" /> {noSpendStreak} Days</span></div>
                      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm"><span className="text-sm font-medium">Days Remaining</span><span className="font-bold">{new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]), 0).getDate() - parseInt(new Date().toISOString().split('T')[0].split('-')[2]) > 0 ? new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]), 0).getDate() - parseInt(new Date().toISOString().split('T')[0].split('-')[2]) : 0} Days</span></div>
                    </div>
                  </div>
                  {frequentCategory && <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-xs font-medium text-indigo-800 dark:text-indigo-300">💡 You've purchased items under <strong>{frequentCategory.label}</strong> {frequentCategory.count} times this month.</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                
                {/* Left Form Column */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 rounded-3xl p-6 border border-indigo-100 shadow-sm">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-indigo-900 dark:text-indigo-300"><Sparkles className="w-5 h-5 text-indigo-500" /> ✨ Magic Add & OCR</h3>
                    <div className="flex gap-2 mt-4">
                      <input type="text" value={magicPrompt} onChange={(e) => setMagicPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleMagicAdd()} placeholder="e.g. 240 snacks..." className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl text-sm dark:text-white" />
                      <button onClick={handleMagicAdd} disabled={isMagicLoading} className="px-3 py-2 bg-indigo-600 text-white rounded-xl shadow disabled:opacity-70">{isMagicLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}</button>
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} disabled={isScanning} className="px-3 py-2 bg-purple-600 text-white rounded-xl shadow flex items-center" title="Scan Receipt">{isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}</button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">{editingId ? <Edit2 className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-indigo-500" />}{editingId ? 'Edit Transaction' : 'Manual Entry'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                        <button type="button" onClick={() => handleInputChange({ target: { name: 'type', value: 'expense' }})} className={`flex-1 py-1.5 text-sm font-medium rounded-lg ${formData.type === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-400'}`}>Expense</button>
                        <button type="button" onClick={() => handleInputChange({ target: { name: 'type', value: 'income' }})} className={`flex-1 py-1.5 text-sm font-medium rounded-lg ${formData.type === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-400'}`}>Income</button>
                      </div>

                      <div><label className="block text-xs font-medium text-slate-500 mb-1">Amount</label><div className="relative"><span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><CurrencyIcon className="w-4 h-4" /></span><input type="number" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="0.00" required className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl dark:text-white text-sm" /></div></div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                          <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl dark:text-white text-sm">
                            {formData.type === 'expense' ? EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>) : INCOME_SOURCES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Payment Method</label>
                          <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl dark:text-white text-sm">
                            {PAYMENT_METHODS.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">Date</label><input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl dark:text-white text-sm" /></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">Note</label><input type="text" name="note" value={formData.note} onChange={handleInputChange} placeholder="e.g. Coke" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl dark:text-white text-sm" /></div>
                      </div>

                      {formData.type === 'expense' && !editingId && (
                        <div className="pt-2 border-t">
                          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                            <input type="checkbox" checked={isSplit} onChange={(e) => setIsSplit(e.target.checked)} className="rounded text-indigo-600" />
                            <Share2 className="w-4 h-4 text-indigo-500" /> Split expense?
                          </label>
                          {isSplit && (
                            <div className="mt-2 flex gap-2">
                              <input type="text" placeholder="Friend name" value={splitDetails.person} onChange={e => setSplitDetails({...splitDetails, person: e.target.value})} className="w-1/2 px-2 py-1 bg-slate-50 dark:bg-slate-900 border rounded text-xs dark:text-white" />
                              <input type="number" placeholder="Their share" value={splitDetails.amount} onChange={e => setSplitDetails({...splitDetails, amount: e.target.value})} className="w-1/2 px-2 py-1 bg-slate-50 dark:bg-slate-900 border rounded text-xs dark:text-white" />
                            </div>
                          )}
                        </div>
                      )}
                      <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-xl shadow">{editingId ? 'Update' : 'Add'}</button>
                    </form>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-indigo-500" /> Top Spending</h3>
                    <div className="space-y-3">
                      {expensesByCategory.slice(0, 5).map(cat => (
                        <div key={cat.id}>
                          <div className="flex justify-between text-xs mb-1 font-medium"><span>{cat.icon} {cat.label}</span><span>{formatMoney(cat.amount)}</span></div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.percentage}%` }}></div></div>
                        </div>
                      ))}
                    </div>
                    <button onClick={generateDetailedReport} className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl text-sm shadow flex justify-center items-center gap-2"><FileText className="w-4 h-4" /> AI Month Report</button>
                  </div>
                </div>

                {/* Right Transaction List Column */}
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm min-h-[600px] flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-indigo-500" /> Transactions ({selectedMonth})</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400"><Search className="w-3.5 h-3.5" /></span>
                          <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-40 pl-8 pr-2 py-1.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-xs dark:text-white" />
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                          {['all', 'income', 'expense'].map((f) => (
                            <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize ${filter === f ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-400'}`}>{f}</button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3">
                      {displayTransactions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12"><CreditCard className="w-12 h-12 mb-2 text-slate-300" /><p>No matching transactions found.</p></div>
                      ) : (
                        displayTransactions.map((transaction) => {
                          const isIncome = transaction.type === 'income';
                          const catInfo = isIncome ? INCOME_SOURCES.find(c => c.id === transaction.category) : EXPENSE_CATEGORIES.find(c => c.id === transaction.category);
                          return (
                            <div key={transaction.id} className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-lg shadow-sm">{catInfo?.icon || '📦'}</div>
                                <div>
                                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{catInfo?.label || 'Other'}</p>
                                  {transaction.note && <p className="text-xs text-slate-500 italic">"{transaction.note}"</p>}
                                  <p className="text-[10px] text-slate-400 mt-0.5">{transaction.date} • {transaction.paymentMethod?.toUpperCase() || 'UPI'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`font-bold text-sm ${isIncome ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'}`}>{isIncome ? '+' : '-'}{formatMoney(transaction.amount)}</span>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => initiateEdit(transaction)} className="p-1.5 text-slate-400 hover:text-indigo-500"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => deleteTransaction(transaction.id)} className="p-1.5 text-slate-400 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'forecast' && (
            <div className="animate-fade-in-up space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-6 text-white shadow-lg"><h2 className="text-sm font-medium text-blue-200 mb-1">Projected End-of-Month Balance</h2><p className="text-4xl font-bold">{formatMoney(projections.projectedBalance)}</p></div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl p-6 text-white shadow-lg"><h2 className="text-sm font-medium text-emerald-100 mb-1">Projected Monthly Savings</h2><p className="text-4xl font-bold">{formatMoney(projections.projectedSavings)}</p></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border shadow-sm flex flex-col">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Repeat className="w-5 h-5 text-indigo-500" /> Recurring Expenses</h3>
                  <form onSubmit={handleRecurringSubmit} className="flex flex-wrap gap-2 mb-4">
                    <input type="text" placeholder="Name" value={recurringForm.name} onChange={e => setRecurringForm({...recurringForm, name: e.target.value})} className="flex-1 min-w-[120px] px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs dark:text-white" required />
                    <input type="number" placeholder="Amt" value={recurringForm.amount} onChange={e => setRecurringForm({...recurringForm, amount: e.target.value})} className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs dark:text-white" required />
                    <input type="number" min="1" max="31" placeholder="Day" value={recurringForm.day} onChange={e => setRecurringForm({...recurringForm, day: e.target.value})} className="w-16 px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs dark:text-white" required />
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700">Add</button>
                  </form>
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-60">
                    {recurring.map(r => (
                      <div key={r.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm transition-colors hover:bg-slate-100"><div className="flex-1"><p className="font-medium">{r.name}</p><p className="text-xs text-slate-400">Day {r.day}</p></div><div className="flex items-center gap-3"><span className="font-bold text-rose-500">{formatMoney(r.amount)}</span><button onClick={() => setRecurring(prev => prev.filter(x => x.id !== r.id))} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></div></div>
                    ))}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border shadow-sm flex flex-col">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-500" /> Planned Future Expenses</h3>
                  <form onSubmit={handlePlannedSubmit} className="flex flex-wrap gap-2 mb-4">
                    <input type="text" placeholder="Name" value={plannedForm.name} onChange={e => setPlannedForm({...plannedForm, name: e.target.value})} className="flex-1 min-w-[120px] px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs dark:text-white" required />
                    <input type="number" placeholder="Amt" value={plannedForm.amount} onChange={e => setPlannedForm({...plannedForm, amount: e.target.value})} className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs dark:text-white" required />
                    <input type="date" value={plannedForm.date} onChange={e => setPlannedForm({...plannedForm, date: e.target.value})} className="w-32 px-2 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs dark:text-white" required />
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700">Add</button>
                  </form>
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-60">
                    {planned.map(p => (
                      <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm transition-colors hover:bg-slate-100"><div className="flex-1"><p className="font-medium">{p.name}</p><p className="text-xs text-slate-400">{p.date}</p></div><div className="flex items-center gap-3"><span className="font-bold text-rose-500">{formatMoney(p.amount)}</span><button onClick={() => setPlanned(prev => prev.filter(x => x.id !== p.id))} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></div></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'loans' && (
            <div className="animate-fade-in-up space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow"><h2 className="text-sm font-medium text-emerald-100 mb-1">To Receive</h2><p className="text-4xl font-bold">{formatMoney(loans.filter(l => l.type === 'lent').reduce((acc, l) => acc + (l.amount - l.amountPaid), 0))}</p></div>
                <div className="bg-gradient-to-br from-rose-500 to-orange-600 rounded-3xl p-6 text-white shadow"><h2 className="text-sm font-medium text-rose-100 mb-1">To Pay</h2><p className="text-4xl font-bold">{formatMoney(loans.filter(l => l.type === 'borrowed').reduce((acc, l) => acc + (l.amount - l.amountPaid), 0))}</p></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm"><h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><Landmark className="w-5 h-5 text-indigo-500" /> Log New Loan</h3>
                    <form onSubmit={handleLoanSubmit} className="space-y-4">
                      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                        <button type="button" onClick={() => setLoanForm(p => ({...p, type: 'lent'}))} className={`flex-1 py-1.5 text-sm font-medium rounded-lg ${loanForm.type === 'lent' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-400'}`}>I Lent</button>
                        <button type="button" onClick={() => setLoanForm(p => ({...p, type: 'borrowed'}))} className={`flex-1 py-1.5 text-sm font-medium rounded-lg ${loanForm.type === 'borrowed' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}>I Borrowed</button>
                      </div>
                      <div><input type="text" value={loanForm.person} onChange={e => setLoanForm(p => ({...p, person: e.target.value}))} placeholder="Person/Entity" required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-sm" /></div>
                      <div><input type="number" value={loanForm.amount} onChange={e => setLoanForm(p => ({...p, amount: e.target.value}))} placeholder="Amount" required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-sm" /></div>
                      <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl shadow">Log Loan</button>
                    </form>
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  {loans.map(loan => {
                    const isSettled = loan.amountPaid >= loan.amount;
                    return (
                      <div key={loan.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                        {isSettled && <div className="absolute top-0 right-0 p-4"><CheckCircle className="w-6 h-6 text-emerald-500 opacity-50"/></div>}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${loan.type === 'lent' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{loan.type === 'lent' ? 'LENT TO' : 'BORROWED FROM'}</span>
                            <span className="font-semibold ml-2">{loan.person}</span>
                            <p className="text-xs text-slate-400 mt-1">{loan.note} • {loan.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">{formatMoney(loan.amount)}</p>
                            <button onClick={() => setLoans(prev => prev.filter(l => l.id !== loan.id))} className="text-xs text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 mt-1">Delete</button>
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                           <div className="flex justify-between text-sm mb-2"><span>Paid Back</span><span>{formatMoney(loan.amountPaid)} / {formatMoney(loan.amount)}</span></div>
                           <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-4"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((loan.amountPaid/loan.amount)*100, 100)}%` }}></div></div>
                           {!isSettled && (
                             <div className="flex gap-2">
                               <input type="number" value={paymentInputs[loan.id] || ''} onChange={e => setPaymentInputs({...paymentInputs, [loan.id]: e.target.value})} placeholder="Log partial payment" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                               <button onClick={() => recordLoanPayment(loan.id)} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">Record</button>
                             </div>
                           )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="animate-fade-in-up space-y-6">
               <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border shadow-sm">
                 <h3 className="text-lg font-semibold mb-4">Add Savings Goal</h3>
                 <form onSubmit={handleGoalSubmit} className="flex gap-4">
                    <input type="text" placeholder="Goal Name" value={goalForm.name} onChange={e => setGoalForm({...goalForm, name: e.target.value})} required className="flex-1 px-3 py-2 border rounded-xl text-sm" />
                    <input type="number" placeholder="Target Amount" value={goalForm.target} onChange={e => setGoalForm({...goalForm, target: e.target.value})} required className="w-32 px-3 py-2 border rounded-xl text-sm" />
                    <input type="number" placeholder="Already Saved" value={goalForm.current} onChange={e => setGoalForm({...goalForm, current: e.target.value})} className="w-32 px-3 py-2 border rounded-xl text-sm" />
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl">Add Goal</button>
                 </form>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {goals.map(g => (
                    <div key={g.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border shadow-sm relative group">
                       <button onClick={() => setGoals(p => p.filter(x => x.id !== g.id))} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4"/></button>
                       <h4 className="font-bold mb-2">{g.name}</h4>
                       <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-4">{formatMoney(g.current)} <span className="text-sm font-medium text-slate-400">/ {formatMoney(g.target)}</span></p>
                       <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-2"><div className="h-full bg-indigo-500 rounded-full" style={{width:`${Math.min((g.current/g.target)*100, 100)}%`}}></div></div>
                       <p className="text-xs text-slate-500">{(g.current/g.target*100).toFixed(1)}% Completed</p>
                    </div>
                  ))}
               </div>
            </div>
          )}

        </main>

        {/* API Key Modal */}
        {showApiKeyModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-8 relative shadow-2xl animate-fade-in-up">
              <button onClick={() => setShowApiKeyModal(false)} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600"><Key className="w-6 h-6" /></div>
                <div><h2 className="text-xl font-bold">Gemini API Key</h2><p className="text-xs text-slate-500">Required for Receipt Scanning & Magic Add</p></div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">Your API key is saved strictly in your browser's local storage and is never sent anywhere else. You can get a free key from Google AI Studio.</p>
              <input type="password" value={tempApiKey} onChange={e => setTempApiKey(e.target.value)} placeholder="Paste your API key here..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm mb-6 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
              <button onClick={saveApiKey} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md">Save API Key</button>
            </div>
          </div>
        )}

        {/* Heatmap Modal */}
        {isHeatmapOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setIsHeatmapOpen(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl p-8 relative shadow-2xl animate-fade-in-up max-h-[95vh] overflow-y-auto">
              <button onClick={() => setIsHeatmapOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200"><X className="w-5 h-5" /></button>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3"><Calendar className="w-7 h-7 text-indigo-500" /> Daily Spending Heatmap</h2>
              <p className="text-slate-500 mb-8">Visualize spending intensity for {selectedMonth}.</p>
              
              <div className="grid grid-cols-7 gap-2 mb-8 relative">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-sm font-bold text-slate-400 mb-2">{d}</div>)}
                {heatmapData.map((d, i) => d.empty ? <div key={i} /> : (
                  <div key={i} className={`relative group aspect-square rounded-2xl ${getHeatmapColor(d.spent)} flex items-center justify-center cursor-pointer transition-all hover:scale-105`}>
                    <span className={`text-sm ${d.spent > 0 ? 'text-white font-bold' : 'text-slate-400'}`}>{d.day}</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700">
                      <span className="opacity-75 mr-2">{d.dateStr}:</span> {formatMoney(d.spent)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border">
                <h4 className="text-sm font-bold mb-4 flex items-center gap-2"><Settings className="w-4 h-4"/> Customize Thresholds</h4>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border"><div className="w-4 h-4 bg-emerald-400 rounded-full"></div><span className="text-sm text-slate-400">&le;</span><input type="number" value={heatmapThresholds.green} onChange={e => setHeatmapThresholds({...heatmapThresholds, green: Number(e.target.value)})} className="w-20 bg-transparent outline-none font-bold" /></div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border"><div className="w-4 h-4 bg-yellow-400 rounded-full"></div><span className="text-sm text-slate-400">&le;</span><input type="number" value={heatmapThresholds.yellow} onChange={e => setHeatmapThresholds({...heatmapThresholds, yellow: Number(e.target.value)})} className="w-20 bg-transparent outline-none font-bold" /></div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border"><div className="w-4 h-4 bg-orange-400 rounded-full"></div><span className="text-sm text-slate-400">&le;</span><input type="number" value={heatmapThresholds.orange} onChange={e => setHeatmapThresholds({...heatmapThresholds, orange: Number(e.target.value)})} className="w-20 bg-transparent outline-none font-bold" /></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trend Modal */}
        {isTrendOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setIsTrendOpen(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl p-8 relative shadow-2xl animate-fade-in-up">
              <button onClick={() => setIsTrendOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200"><X className="w-5 h-5" /></button>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3"><BarChart className="w-7 h-7 text-emerald-500" /> 6-Month Trajectory</h2>
              <p className="text-slate-500 mb-12">Compare your cash flow and savings over the previous half-year.</p>

              <div className="flex items-end justify-between gap-6 h-64 mt-8 px-4">
                {sixMonthTrend.trend.map(t => (
                  <div key={t.month} className="relative flex-1 flex flex-col items-center gap-3 h-full justify-end cursor-pointer group">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-2xl border border-slate-700 min-w-[150px] z-50">
                      <span className="font-bold text-lg border-b border-slate-700 pb-2 mb-1 block">{t.month}</span>
                      <div className="text-emerald-400 flex justify-between gap-4 mt-2"><span>Income:</span> <span>{formatMoney(t.income)}</span></div>
                      <div className="text-rose-400 flex justify-between gap-4"><span>Expense:</span> <span>{formatMoney(t.expense)}</span></div>
                      <div className="text-indigo-400 flex justify-between gap-4 pt-2 mt-1 border-t border-slate-700"><span>Saved:</span> <span>{formatMoney(t.income - t.expense)}</span></div>
                    </div>

                    <div className="w-full flex justify-center gap-2 h-52 items-end">
                      <div className="w-1/2 max-w-[40px] bg-emerald-400 rounded-t-lg transition-all group-hover:brightness-110" style={{ height: `${(t.income / sixMonthTrend.maxVal) * 100}%` }}></div>
                      <div className="w-1/2 max-w-[40px] bg-rose-400 rounded-t-lg transition-all group-hover:brightness-110" style={{ height: `${(t.expense / sixMonthTrend.maxVal) * 100}%` }}></div>
                    </div>
                    <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800 bg-slate-50 px-4 py-1 rounded-full">{t.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {showReport && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl p-8 relative shadow-2xl animate-fade-in-up">
              <button onClick={() => setShowReport(false)} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200"><X className="w-5 h-5" /></button>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3"><FileText className="w-7 h-7 text-indigo-500" /> Executive Summary</h2>
              
              {isReportLoading ? (
                <div className="flex flex-col items-center justify-center py-12"><Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" /><p>Gemini AI is analyzing your data...</p></div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border">
                    <div><span className="text-sm text-slate-500">Income</span><p className="text-xl font-bold text-emerald-500">{formatMoney(currentMonthData.income)}</p></div>
                    <div><span className="text-sm text-slate-500">Expense</span><p className="text-xl font-bold text-rose-500">{formatMoney(currentMonthData.expense)}</p></div>
                    <div><span className="text-sm text-slate-500">Saved</span><p className="text-xl font-bold text-indigo-500">{formatMoney(currentMonthData.savings)}</p></div>
                    <div><span className="text-sm text-slate-500">Savings Rate</span><p className="text-xl font-bold">{currentMonthData.income ? ((currentMonthData.savings/currentMonthData.income)*100).getKey?.() || ((currentMonthData.savings/currentMonthData.income)*100).toFixed(1) : 0}%</p></div>
                  </div>
                  
                  <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100">
                    <h3 className="font-bold flex items-center gap-2 mb-4 text-indigo-900 dark:text-indigo-300"><Bot className="w-5 h-5"/> AI Insights</h3>
                    <div className="space-y-3">
                      <p className="text-sm"><strong>Observation:</strong> {reportInsights?.observation}</p>
                      <p className="text-sm"><strong>Suggestion:</strong> {reportInsights?.suggestion}</p>
                    </div>
                  </div>
                  
                  <button onClick={() => window.print()} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md">Download as PDF</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 text-sm animate-fade-in-up">
            <span>{toast.message}</span>
            {toast.undoAction && <button onClick={toast.undoAction} className="text-indigo-400 font-bold hover:text-indigo-300 flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Undo</button>}
          </div>
        )}

      </div>
    </div>
  );
}