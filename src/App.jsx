import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, Plus, Trash2, 
  Calendar, DollarSign, Euro, PoundSterling, IndianRupee, JapaneseYen, PieChart as PieChartIcon,
  CreditCard, Activity, ArrowRightLeft, Sparkles, Wand2, Loader2, Bot,
  Moon, Sun, Download, History, Settings, Landmark, CheckCircle, X,
  BarChart, Flame, Repeat, Clock, Camera, Search, Share2, Edit2, RefreshCw,
  Upload, DownloadCloud, FileText, ChevronRight, Key
} from 'lucide-react';
import { getTodayStr, sanitizeDate, getMonthString, monthLabel, shiftMonth } from './utils/dates';
import { loadLS, saveLS } from './utils/storage';
import { formatCompactCurrency, formatCurrency } from './utils/formatting';
import { isValidHeatmapThresholds, loadHeatmapThresholds, parseQuickEntry } from './utils/calculations';

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

  html { color-scheme: light; }
  html.dark { color-scheme: dark; }
  body { background-color: #f8fafc; color: #0f172a; }
  html.dark body { background-color: #0f172a; color: #f1f5f9; }

  html.dark .dk-bg-slate-700 { background-color: #334155; }
  html.dark .dk-bg-slate-800 { background-color: #1e293b; }
  html.dark .dk-bg-slate-800-50 { background-color: rgba(30, 41, 59, 0.5); }
  html.dark .dk-bg-slate-900 { background-color: #0f172a; }
  html.dark .dk-bg-slate-900-50 { background-color: rgba(15, 23, 42, 0.5); }
  html.dark .dk-bg-slate-900-80 { background-color: rgba(15, 23, 42, 0.85); }
  html.dark .dk-bg-indigo-900-20 { background-color: rgba(49, 46, 129, 0.2); }
  html.dark .dk-bg-indigo-900-30 { background-color: rgba(49, 46, 129, 0.3); }
  html.dark .dk-bg-indigo-900-40 { background-color: rgba(49, 46, 129, 0.4); }
  html.dark .dk-bg-emerald-500 { background-color: #10b981; }
  html.dark .dk-bg-emerald-900-30 { background-color: rgba(6, 78, 59, 0.3); }
  html.dark .dk-bg-rose-600 { background-color: #e11d48; }
  html.dark .dk-bg-rose-900-20 { background-color: rgba(136, 19, 55, 0.25); }
  html.dark .dk-bg-amber-900-20 { background-color: rgba(120, 53, 15, 0.25); }
  html.dark .dk-bg-orange-500 { background-color: #f97316; }
  html.dark .dk-bg-yellow-500 { background-color: #eab308; }

  html.dark .dk-border-slate-600 { border-color: #475569; }
  html.dark .dk-border-slate-700 { border-color: #334155; }
  html.dark .dk-border-slate-700-50 { border-color: rgba(51, 65, 85, 0.6); }
  html.dark .dk-border-slate-800 { border-color: #1e293b; }
  html.dark .dk-border-indigo-800 { border-color: #3730a3; }
  html.dark .dk-border-indigo-800-50 { border-color: rgba(55, 48, 163, 0.5); }
  html.dark .dk-border-orange-800-30 { border-color: rgba(154, 52, 18, 0.4); }

  html.dark .dk-text-white { color: #ffffff; }
  html.dark .dk-text-slate-100 { color: #f1f5f9; }
  html.dark .dk-text-slate-200 { color: #e2e8f0; }
  html.dark .dk-text-slate-300 { color: #cbd5e1; }
  html.dark .dk-text-slate-400 { color: #94a3b8; }
  html.dark .dk-text-indigo-200 { color: #c7d2fe; }
  html.dark .dk-text-indigo-300 { color: #a5b4fc; }
  html.dark .dk-text-indigo-400 { color: #818cf8; }
  html.dark .dk-text-amber-300 { color: #fcd34d; }
  html.dark .dk-text-emerald-300 { color: #6ee7b7; }
  html.dark .dk-text-rose-300 { color: #fda4af; }

  html.dark .dk-hover-bg-slate-700:hover { background-color: #334155; }
  html.dark .dk-hover-bg-slate-800:hover { background-color: #1e293b; }
  html.dark .dk-hover-bg-indigo-900-30:hover { background-color: rgba(49, 46, 129, 0.35); }
  html.dark .dk-hover-border-slate-600:hover { border-color: #475569; }
  html.dark .dk-hover-border-indigo-700:hover { border-color: #4338ca; }
  html.dark .dk-hover-border-emerald-700:hover { border-color: #047857; }
  html.dark .dk-hover-text-slate-200:hover { color: #e2e8f0; }

  html.dark .dk-selection-bg-indigo-900-50::selection,
  html.dark .dk-selection-bg-indigo-900-50 *::selection { background-color: rgba(49, 46, 129, 0.6); }
  html.dark .dk-selection-text-indigo-100::selection,
  html.dark .dk-selection-text-indigo-100 *::selection { color: #e0e7ff; }

  html.dark .dk-from-indigo-900-20 {
    background-image: linear-gradient(to bottom right, rgba(49, 46, 129, 0.45), rgba(88, 28, 135, 0.28));
  }
  html.dark .dk-from-orange-900-10 {
    background-image: linear-gradient(to bottom right, rgba(124, 45, 18, 0.35), rgba(120, 53, 15, 0.22));
  }

  input, select, textarea { color-scheme: inherit; }
  ::placeholder { color: #94a3b8; opacity: 1; }
  html.dark ::placeholder { color: #64748b; opacity: 1; }
  html.dark option { background-color: #0f172a; color: #e2e8f0; }
  html.dark input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.7); }
  input:focus-visible, select:focus-visible, textarea:focus-visible, button:focus-visible, a:focus-visible {
    outline: 2px solid #6366f1;
    outline-offset: 2px;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  html.dark ::-webkit-scrollbar-thumb { background: #475569; }
  html.dark ::-webkit-scrollbar-thumb:hover { background: #64748b; }

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

const MAX_MONEY_AMOUNT = 100000000;

// ---------------------------------------------------------------------------
// Shared AI + parsing helpers
// ---------------------------------------------------------------------------

// Tried in order. If one model 404s / is rejected we fall through to the next,
// so the app keeps working when Google rotates model IDs.
const GEMINI_MODELS = [
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
];

const safeJSONParse = (text) => {
  if (!text) return null;
  let cleaned = String(text).trim();
  // strip ```json ... ``` fences the model sometimes adds
  cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through */ }
    }
    return null;
  }
};

// Single place where we talk to Gemini. Returns { ok, data, error }.
const callGeminiJSON = async (apiKey, parts) => {
  if (!apiKey) return { ok: false, error: 'No API key saved' };
  const payload = {
    contents: [{ role: 'user', parts }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
  };
  let lastError = 'Unknown error';

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        lastError = data?.error?.message || `HTTP ${res.status}`;
        // model missing / bad request for this model -> try the next one
        if (res.status === 404 || res.status === 400) continue;
        return { ok: false, error: lastError };
      }

      const text = (data?.candidates?.[0]?.content?.parts || [])
        .map(p => p?.text)
        .filter(Boolean)
        .join('')
        .trim();

      if (!text) {
        lastError = data?.promptFeedback?.blockReason
          ? `Blocked: ${data.promptFeedback.blockReason}`
          : 'Model returned an empty response';
        continue;
      }

      const parsed = safeJSONParse(text);
      if (!parsed) { lastError = 'Could not read the model response as JSON'; continue; }
      return { ok: true, data: parsed, model };
    } catch (err) {
      lastError = err?.message || String(err);
    }
  }
  return { ok: false, error: lastError };
};

const applyTheme = (dark) => {
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('clarity_theme');
    const dark = saved !== null
      ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(dark);
    return dark;
  });

  const [transactionAnimation, setTransactionAnimation] = useState(null);
  
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('clarity_api_key') || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  const [transactions, setTransactions] = useState(() => loadLS('transactions', []));

  const [formData, setFormData] = useState({ type: 'expense', amount: '', category: 'food', paymentMethod: 'upi', date: getTodayStr(), note: '' });
  const [isSplit, setIsSplit] = useState(false);
  const [splitDetails, setSplitDetails] = useState({ person: '', amount: '' });

  const [filter, setFilter] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [currency, setCurrency] = useState(() => loadLS('currency', 'INR'));
  const [selectedMonth, setSelectedMonth] = useState(() => loadLS('selected_month', getTodayStr().slice(0, 7)));
  const [activeTab, setActiveTab] = useState(() => loadLS('active_tab', 'dashboard'));
  
  const [monthlyTarget, setMonthlyTarget] = useState(() => loadLS('monthly_target', 0));
  const [categoryTargets, setCategoryTargets] = useState(() => loadLS('category_targets', {}));
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);

  const [recurring, setRecurring] = useState(() => loadLS('recurring', []));
  const [planned, setPlanned] = useState(() => loadLS('planned', []));
  const [recurringForm, setRecurringForm] = useState({ name: '', amount: '', day: '1', category: 'utilities' });
  const [plannedForm, setPlannedForm] = useState({ name: '', amount: '', date: getTodayStr(), category: 'other_expense' });
  const [editingRecurringId, setEditingRecurringId] = useState(null);
  const [editingPlannedId, setEditingPlannedId] = useState(null);

  const [loans, setLoans] = useState(() => loadLS('loans', []));
  const [loanForm, setLoanForm] = useState({ type: 'lent', person: '', amount: '', date: getTodayStr(), note: '' });
  const [paymentInputs, setPaymentInputs] = useState({});

  const [goals, setGoals] = useState(() => loadLS('goals', []));
  const [goalForm, setGoalForm] = useState({ name: '', target: '', current: '' });
  const [goalInputs, setGoalInputs] = useState({});

  const [magicPrompt, setMagicPrompt] = useState('');
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);
  const magicIdRef = useRef(0);
  const nextId = (prefix) => `${prefix}-${magicIdRef.current += 1}`;
  
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);
  
  const [showReport, setShowReport] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportInsights, setReportInsights] = useState(null);
  const [reportError, setReportError] = useState(null);

  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);
  const [isTrendOpen, setIsTrendOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarYear, setCalendarYear] = useState(parseInt(selectedMonth.split('-')[0], 10));
  const [heatmapThresholds, setHeatmapThresholds] = useState(loadHeatmapThresholds);
  const [heatmapDraft, setHeatmapDraft] = useState(heatmapThresholds);
  const [heatmapValidationError, setHeatmapValidationError] = useState('');

  useEffect(() => {
    applyTheme(isDarkMode);
    localStorage.setItem('clarity_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // --- Auto-save everything locally on change ---
  useEffect(() => { saveLS('transactions', transactions); }, [transactions]);
  useEffect(() => { saveLS('recurring', recurring); }, [recurring]);
  useEffect(() => { saveLS('planned', planned); }, [planned]);
  useEffect(() => { saveLS('loans', loans); }, [loans]);
  useEffect(() => { saveLS('goals', goals); }, [goals]);
  useEffect(() => { saveLS('monthly_target', monthlyTarget); }, [monthlyTarget]);
  useEffect(() => { saveLS('category_targets', categoryTargets); }, [categoryTargets]);
  useEffect(() => { saveLS('heatmap_thresholds', heatmapThresholds); }, [heatmapThresholds]);
  useEffect(() => { saveLS('currency', currency); }, [currency]);
  useEffect(() => { saveLS('selected_month', selectedMonth); }, [selectedMonth]);
  useEffect(() => { saveLS('active_tab', activeTab); }, [activeTab]);

  // Keep the entry form on whatever month you're viewing. Without this, opening
  // August and adding an entry silently used today's date and bounced the view
  // back to the current month.
  useEffect(() => {
    if (editingId) return;
    // This effect keeps the uncontrolled date context aligned with the selected month.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(prev => {
      if (getMonthString(prev.date) === selectedMonth) return prev;
      const today = getTodayStr();
      return { ...prev, date: selectedMonth === today.slice(0, 7) ? today : `${selectedMonth}-01` };
    });
  }, [selectedMonth, editingId]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const saveApiKey = () => {
    const key = tempApiKey.trim();
    localStorage.setItem('clarity_api_key', key);
    setApiKey(key);
    setShowApiKeyModal(false);
    setToast({ message: 'API Key saved successfully!' });
    setTimeout(() => setToast(null), 3000);
  };

  const monthlyData = useMemo(() => {
    const dataByMonth = {};
    transactions.forEach(t => {
      const month = typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(t.date)
        ? t.date.slice(0, 7)
        : getMonthString(t.date);
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
    const prevMonthStr = shiftMonth(selectedMonth, -1);
    const prev = monthlyData[prevMonthStr] || { income: 0, expense: 0, savings: 0, categorySpending: {} };

    let maxSavings = -Infinity;
    let bestMonth = null;
    Object.entries(monthlyData).forEach(([month, data]) => {
      if (data.savings > maxSavings) { maxSavings = data.savings; bestMonth = month; }
    });

    return { currentMonthData: current, previousMonthData: prev, highestSavingsMonth: bestMonth ? { month: bestMonth, savings: maxSavings } : null };
  }, [monthlyData, selectedMonth]);

  const { balance } = useMemo(() => {
    return transactions.reduce((acc, curr) => {
      if (curr.type === 'income') { acc.totalIncome += curr.amount; acc.balance += curr.amount; }
      else { acc.totalExpense += curr.amount; acc.balance -= curr.amount; }
      return acc;
    }, { totalIncome: 0, totalExpense: 0, balance: 0 });
  }, [transactions]);

  const displayTransactions = useMemo(() => {
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
    const expenseList = transactions.filter(t => t.type === 'expense' && !Number.isNaN(new Date(t.date).getTime()));
    if (expenseList.length === 0) return 0;
    let streak = 0; 
    let d = new Date(getTodayStr()); 
    d.setHours(0, 0, 0, 0);
    const expenseDates = new Set(expenseList.map(t => new Date(t.date).toISOString().split('T')[0]));
    while (streak < 365) {
      const dateStr = d.toISOString().split('T')[0];
      if (!expenseDates.has(dateStr)) { streak++; d.setDate(d.getDate() - 1); } else break;
    }
    return streak;
  }, [transactions]);

  const frequentCategory = useMemo(() => {
    const counts = {};
    displayTransactions.filter(t => t.type === 'expense').forEach(t => { counts[t.category] = (counts[t.category] || 0) + 1; });
    let maxCat = null;
    let maxCount = 0;
    Object.entries(counts).forEach(([cat, count]) => { if (count > maxCount) { maxCount = count; maxCat = cat; } });
    if (maxCount >= 1 && maxCat) {
      const label = EXPENSE_CATEGORIES.find(c => c.id === maxCat)?.label || maxCat;
      return { label, count: maxCount };
    }
    return null;
  }, [displayTransactions]);

  const savingsDifference = currentMonthData.savings - previousMonthData.savings;
  // Days elapsed in the selected month (full month length for past months).
  const elapsedDays = useMemo(() => {
    const today = getTodayStr();
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    if (selectedMonth === today.slice(0, 7)) return Math.max(1, Number(today.slice(8, 10)));
    if (selectedMonth > today.slice(0, 7)) return 1;
    return daysInMonth;
  }, [selectedMonth]);
  const dailyAverage = currentMonthData.expense / elapsedDays;

  const daysRemainingInfo = useMemo(() => {
    const today = getTodayStr();
    const currentMonth = today.slice(0, 7);
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    if (selectedMonth === currentMonth) {
      return { label: `${Math.max(0, daysInMonth - Number(today.slice(8, 10)))} Days`, isCurrent: true };
    }
    return { label: selectedMonth > currentMonth ? 'Future Month' : 'Past Month', isCurrent: false };
  }, [selectedMonth]);

  const openHeatmap = () => {
    setHeatmapDraft(heatmapThresholds);
    setHeatmapValidationError('');
    setIsHeatmapOpen(true);
  };

  const updateHeatmapDraft = (name, value) => {
    setHeatmapDraft(prev => ({ ...prev, [name]: value }));
    setHeatmapValidationError('');
  };

  const saveHeatmapThresholds = () => {
    const values = [heatmapDraft.green, heatmapDraft.yellow, heatmapDraft.orange].map(value => Number(value));
    if (values.some(value => !Number.isFinite(value) || value < 0)) {
      setHeatmapValidationError('Enter three non-negative numbers.');
      return;
    }
    if (!(values[0] < values[1] && values[1] < values[2])) {
      setHeatmapValidationError('Thresholds must be in ascending order: green < yellow < orange.');
      return;
    }
    setHeatmapThresholds({ green: values[0], yellow: values[1], orange: values[2] });
    setHeatmapDraft({ green: values[0], yellow: values[1], orange: values[2] });
    setHeatmapValidationError('');
  };

  const projections = useMemo(() => {
    const todayStr = getTodayStr();
    const currentMonth = todayStr.slice(0, 7);
    const isCurrentForecastMonth = selectedMonth === currentMonth;
    const todayDay = Number(todayStr.slice(8, 10));
    const daysInCurrentMonth = new Date(Number(todayStr.slice(0, 4)), Number(todayStr.slice(5, 7)), 0).getDate();
    const monthEndStr = `${currentMonth}-${String(daysInCurrentMonth).padStart(2, '0')}`;
    const matchedRecurringTransactions = new Set();
    const upcomingRecurringTotal = isCurrentForecastMonth ? recurring.reduce((sum, item) => {
      const dueDay = Math.min(Math.max(Number(item.day) || 1, 1), daysInCurrentMonth);
      if (dueDay < todayDay) return sum;
      const recordedTransaction = transactions.find(transaction => !matchedRecurringTransactions.has(transaction.id) && (
        transaction.type === 'expense' &&
        getMonthString(transaction.date) === currentMonth &&
        Number(transaction.date.slice(8, 10)) === dueDay &&
        transaction.category === item.category &&
        Number(transaction.amount) === Number(item.amount)
      ));
      if (recordedTransaction) {
        matchedRecurringTransactions.add(recordedTransaction.id);
        return sum;
      }
      return sum + Number(item.amount);
    }, 0) : 0;
    const upcomingPlannedTotal = isCurrentForecastMonth ? planned
      .filter(item => item.date >= todayStr && item.date <= monthEndStr)
      .reduce((sum, item) => sum + Number(item.amount), 0) : 0;
    const projectedBalance = balance - upcomingRecurringTotal - upcomingPlannedTotal;
    const projectedSavings = currentMonthData.income - currentMonthData.expense - upcomingRecurringTotal - upcomingPlannedTotal;
    return { upcomingRecurringTotal, projectedBalance, projectedSavings };
  }, [recurring, planned, transactions, balance, currentMonthData, selectedMonth]);

  const financialHealth = useMemo(() => {
    let score = 0; 
    let breakdown = [];
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
    const year = parseInt(selectedMonth.split('-')[0], 10);
    const month = parseInt(selectedMonth.split('-')[1], 10) - 1;
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const data = [];
    for(let i = 0; i < firstDay; i++) data.push({ empty: true, id: `empty-${i}` });
    for(let i = 1; i <= days; i++) {
      const dateStr = `${selectedMonth}-${i.toString().padStart(2, '0')}`;
      const spent = transactions.filter(t => t.type === 'expense' && getMonthString(t.date) === selectedMonth && String(t.date).slice(8, 10) === String(i).padStart(2, '0')).reduce((sum, t) => sum + t.amount, 0);
      data.push({ day: i, dateStr, spent, empty: false });
    }
    return data;
  }, [transactions, selectedMonth]);

  const getHeatmapColor = (spent) => {
     if (spent === 0) return 'bg-slate-100 dk-bg-slate-800-50';
     if (spent <= heatmapThresholds.green) return 'bg-emerald-400 dk-bg-emerald-500';
     if (spent <= heatmapThresholds.yellow) return 'bg-yellow-400 dk-bg-yellow-500';
     if (spent <= heatmapThresholds.orange) return 'bg-orange-400 dk-bg-orange-500';
     return 'bg-rose-500 dk-bg-rose-600';
  };

  const sixMonthTrend = useMemo(() => {
    const liveMonth = getTodayStr().slice(0, 7);

    // Running account balance at the end of any month = every month's savings
    // up to and including it. This is what carries August's leftover into
    // September instead of resetting to zero each month.
    const knownMonths = Object.keys(monthlyData).sort();
    const closingBalanceAt = (mStr) => knownMonths
      .filter(m => m <= mStr)
      .reduce((sum, m) => sum + monthlyData[m].savings, 0);

    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const mStr = shiftMonth(selectedMonth, -i);
      const dData = monthlyData[mStr] || { income: 0, expense: 0, savings: 0 };
      const closing = closingBalanceAt(mStr);
      trend.push({
        month: monthLabel(mStr, { month: 'short' }),
        key: mStr,
        income: dData.income,
        expense: dData.expense,
        saved: dData.income - dData.expense,
        openingBalance: closing - (dData.income - dData.expense),
        closingBalance: closing,
        isLive: mStr === liveMonth,
      });
    }
    const maxVal = Math.max(...trend.flatMap(t => [t.income, t.expense]), 1);

    // Points for the overlay lines. Columns are equal width with no gap, so the
    // centre of column i sits at ((i + 0.5) / count) * 100 on a 0-100 viewBox.
    const toPoints = (key) => trend
      .map((t, i) => `${((i + 0.5) / trend.length) * 100},${100 - (t[key] / maxVal) * 100}`)
      .join(' ');

    const axisTicks = [1, 0.75, 0.5, 0.25, 0].map(f => maxVal * f);

    return { trend, maxVal, incomeLine: toPoints('income'), expenseLine: toPoints('expense'), axisTicks };
  }, [monthlyData, selectedMonth]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value, ...(name === 'type' && { category: value === 'expense' ? 'food' : 'salary' }) }));
  };

  const handleBudgetChange = (category, value) => {
    const amount = Number(value);
    setCategoryTargets(prev => ({ ...prev, [category]: Number.isFinite(amount) && amount >= 0 ? amount : 0 }));
  };

  const handleMonthlyTargetChange = (value) => {
    const amount = Number(value);
    setMonthlyTarget(Number.isFinite(amount) && amount >= 0 ? amount : 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !Number.isFinite(Number(formData.amount)) || Number(formData.amount) <= 0 || Number(formData.amount) > MAX_MONEY_AMOUNT) {
      setToast({ message: `Enter a finite amount between 0 and ${formatMoney(MAX_MONEY_AMOUNT)}.` });
      return;
    }

    const grossAmount = Number(formData.amount);
    let amountNum = grossAmount;
    let splitLoan = null;
    if (formData.type === 'expense' && isSplit && splitDetails.amount && splitDetails.person && !editingId) {
      const splitAmt = Number(splitDetails.amount);
      if (Number.isFinite(splitAmt) && splitAmt > 0 && splitAmt < amountNum && splitAmt <= MAX_MONEY_AMOUNT && splitDetails.person.trim()) {
         splitLoan = { id: nextId('split-loan'), type: 'lent', person: splitDetails.person.trim(), amount: splitAmt, amountPaid: 0, date: formData.date, note: `Split: ${formData.note || 'Expense'}` };
      }
    }

    const newTransaction = {
      id: editingId ? editingId : nextId('transaction'),
      ...formData,
      amount: splitLoan ? grossAmount : amountNum,
      ...(splitLoan && { linkedLoanId: splitLoan.id, loanMovement: 'principal' }),
    };
    if (splitLoan) {
      splitLoan.principalTransactionId = newTransaction.id;
      splitLoan.cashTransactionIds = [newTransaction.id];
      splitLoan.repaymentTransactionIds = [];
      setLoans(prev => [splitLoan, ...prev]);
    }
    if (editingId) {
      setTransactions(prev => prev.map(t => t.id === editingId ? newTransaction : t));
      setEditingId(null); 
      setToast({ message: 'Transaction updated successfully' });
    } else {
      setTransactions(prev => [newTransaction, ...prev]);
      setTransactionAnimation({ type: newTransaction.type, amount: amountNum, id: newTransaction.id });
      setTimeout(() => setTransactionAnimation(null), 1800);
    }
    setFormData({ type: 'expense', amount: '', category: 'food', paymentMethod: 'upi', date: newTransaction.date, note: '' });
    setIsSplit(false); 
    setSplitDetails({ person: '', amount: '' });
    setSelectedMonth(getMonthString(newTransaction.date));
  };

  const deleteTransaction = (id) => {
    const tToDelete = transactions.find(t => t.id === id);
    const linkedLoan = tToDelete?.linkedLoanId ? loans.find(loan => loan.id === tToDelete.linkedLoanId) : null;
    if (linkedLoan && tToDelete.loanMovement === 'principal') {
      deleteLoanWithUndo(linkedLoan);
      return;
    }
    if (linkedLoan && tToDelete.loanMovement === 'repayment') {
      const repaymentIds = linkedLoan.repaymentTransactionIds || [];
      setLoans(prev => prev.map(loan => loan.id === linkedLoan.id ? {
        ...loan,
        amountPaid: Math.max(0, loan.amountPaid - tToDelete.amount),
        cashTransactionIds: (loan.cashTransactionIds || []).filter(transactionId => transactionId !== id),
        repaymentTransactionIds: repaymentIds.filter(transactionId => transactionId !== id),
      } : loan));
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
    setToast({
      message: `Deleted ${tToDelete?.category || 'transaction'}`,
      undoAction: () => {
        setTransactions(prev => [tToDelete, ...prev].sort((a,b) => new Date(b.date) - new Date(a.date)));
        if (linkedLoan && tToDelete.loanMovement === 'repayment') {
          setLoans(prev => prev.map(loan => loan.id === linkedLoan.id ? {
            ...loan,
            amountPaid: Math.min(loan.amount, loan.amountPaid + tToDelete.amount),
            cashTransactionIds: [...(loan.cashTransactionIds || []), id],
            repaymentTransactionIds: [...(loan.repaymentTransactionIds || []), id],
          } : loan));
        }
        setToast(null);
      }
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
    const amount = Number(recurringForm.amount);
    const day = Number(recurringForm.day);
    if (!recurringForm.name.trim() || !Number.isFinite(amount) || amount <= 0 || amount > MAX_MONEY_AMOUNT || !Number.isInteger(day) || day < 1 || day > 31) {
      setToast({ message: 'Enter a name, a valid amount, and a day from 1 to 31.' });
      return;
    }
    const item = { name: recurringForm.name.trim(), amount, day, category: recurringForm.category };
    setRecurring(prev => editingRecurringId
      ? prev.map(existing => existing.id === editingRecurringId ? { ...existing, ...item } : existing)
      : [{ id: nextId('recurring'), ...item }, ...prev]);
    setEditingRecurringId(null);
    setRecurringForm({ name: '', amount: '', day: '1', category: 'utilities' });
    setToast({ message: editingRecurringId ? 'Recurring expense updated!' : 'Recurring expense added!' }); 
    setTimeout(() => setToast(null), 3000);
  };

  const deleteWithUndo = (items, setItems, id, label) => {
    const deleted = items.find(item => item.id === id);
    if (!deleted) return;
    setItems(prev => prev.filter(item => item.id !== id));
    setToast({
      message: `Deleted ${label}`,
      undoAction: () => {
        setItems(prev => [deleted, ...prev]);
        setToast(null);
      },
    });
    setTimeout(() => setToast(null), 6000);
  };

  const handlePlannedSubmit = (e) => {
    e.preventDefault();
    const amount = Number(plannedForm.amount);
    if (!plannedForm.name.trim() || !Number.isFinite(amount) || amount <= 0 || amount > MAX_MONEY_AMOUNT || !plannedForm.date) {
      setToast({ message: 'Enter a name, a valid amount, and a date.' });
      return;
    }
    const item = { name: plannedForm.name.trim(), amount, date: plannedForm.date, category: plannedForm.category };
    setPlanned(prev => editingPlannedId
      ? prev.map(existing => existing.id === editingPlannedId ? { ...existing, ...item } : existing)
      : [{ id: nextId('planned'), ...item }, ...prev]);
    setEditingPlannedId(null);
    setPlannedForm({ name: '', amount: '', date: getTodayStr(), category: 'other_expense' });
    setToast({ message: editingPlannedId ? 'Planned expense updated!' : 'Planned expense added!' }); 
    setTimeout(() => setToast(null), 3000);
  };

  const handleGoalSubmit = (e) => {
    e.preventDefault();
    const target = Number(goalForm.target);
    const current = Number(goalForm.current || 0);
    if (!goalForm.name.trim() || !Number.isFinite(target) || target <= 0 || target > MAX_MONEY_AMOUNT || !Number.isFinite(current) || current < 0 || current > target) {
      setToast({ message: 'Enter a positive target and saved amount between zero and the target.' });
      return;
    }
    setGoals(prev => [...prev, { id: nextId('goal'), name: goalForm.name.trim(), target, current }]);
    setGoalForm({ name: '', target: '', current: '' });
    setToast({ message: 'Savings goal added!' }); 
    setTimeout(() => setToast(null), 3000);
  };

  const handleLoanSubmit = (e) => {
    e.preventDefault();
    const amount = Number(loanForm.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_MONEY_AMOUNT || !loanForm.person.trim()) {
      setToast({ message: `Enter a person and a finite amount up to ${formatMoney(MAX_MONEY_AMOUNT)}.` });
      return;
    }
    const loanId = nextId('loan');
    const transactionId = nextId('loan-cash');
    const isLent = loanForm.type === 'lent';
    const cashTransaction = {
      id: transactionId,
      type: isLent ? 'expense' : 'income',
      amount,
      category: isLent ? 'other_expense' : 'other_income',
      paymentMethod: 'bank',
      date: loanForm.date,
      note: `${isLent ? 'Loan to' : 'Loan from'} ${loanForm.person.trim()}`,
      linkedLoanId: loanId,
      loanMovement: 'principal',
    };
    const loan = {
      id: loanId,
      ...loanForm,
      person: loanForm.person.trim(),
      amount,
      amountPaid: 0,
      principalTransactionId: transactionId,
      cashTransactionIds: [transactionId],
      repaymentTransactionIds: [],
    };
    setTransactions(prev => [cashTransaction, ...prev]);
    setLoans(prev => [loan, ...prev]);
    setLoanForm({ type: 'lent', person: '', amount: '', date: getTodayStr(), note: '' });
    setSelectedMonth(getMonthString(loanForm.date));
    setToast({ message: `${isLent ? 'Loan recorded as an expense' : 'Borrowed money recorded as income'}.` });
    setTimeout(() => setToast(null), 3000);
  };

  const deleteLoanWithUndo = (loan) => {
    const linkedIds = new Set(loan.cashTransactionIds || []);
    if (loan.principalTransactionId) linkedIds.add(loan.principalTransactionId);
    (loan.repaymentTransactionIds || []).forEach(id => linkedIds.add(id));
    const linkedTransactions = transactions.filter(transaction => linkedIds.has(transaction.id));
    setLoans(prev => prev.filter(item => item.id !== loan.id));
    setTransactions(prev => prev.filter(transaction => !linkedIds.has(transaction.id)));
    setToast({
      message: 'Deleted loan and linked cash movements',
      undoAction: () => {
        setLoans(prev => [loan, ...prev]);
        setTransactions(prev => [...linkedTransactions, ...prev]);
        setToast(null);
      },
    });
    setTimeout(() => setToast(null), 6000);
  };

  const addGoalContribution = (id, direction = 1) => {
    const raw = Number(goalInputs[id]);
    if (!Number.isFinite(raw) || raw <= 0 || raw > MAX_MONEY_AMOUNT) return;
    const delta = raw * direction;
    const goal = goals.find(item => item.id === id);
    if (!goal) return;
    const nextAmount = Math.max(0, Math.min(goal.target, goal.current + delta));
    const applied = Math.abs(nextAmount - goal.current);
    if (applied === 0) return;
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      return { ...g, current: nextAmount };
    }));
    setGoalInputs(prev => ({ ...prev, [id]: '' }));
    setToast({
      message: direction > 0
        ? `Added ${formatMoney(applied)} to ${goal.name}`
        : `Removed ${formatMoney(applied)} from ${goal.name}`
    });
    setTimeout(() => setToast(null), 3000);
  };

  const recordLoanPayment = (id) => {
    const payment = Number(paymentInputs[id]);
    const loan = loans.find(item => item.id === id);
    if (!loan || !Number.isFinite(payment) || payment <= 0 || payment > loan.amount - loan.amountPaid) {
      setToast({ message: 'Payment must be positive and no greater than the remaining loan balance.' });
      return;
    }
    const transactionId = nextId('loan-repayment');
    const isLent = loan.type === 'lent';
    const repaymentTransaction = {
      id: transactionId,
      type: isLent ? 'income' : 'expense',
      amount: payment,
      category: isLent ? 'other_income' : 'other_expense',
      paymentMethod: 'bank',
      date: getTodayStr(),
      note: `${isLent ? 'Repayment from' : 'Repayment to'} ${loan.person}`,
      linkedLoanId: loan.id,
      loanMovement: 'repayment',
    };
    setTransactions(prev => [repaymentTransaction, ...prev]);
    setLoans(prev => prev.map(l => l.id === id ? {
      ...l,
      amountPaid: l.amountPaid + payment,
      cashTransactionIds: [...(l.cashTransactionIds || []), transactionId],
      repaymentTransactionIds: [...(l.repaymentTransactionIds || []), transactionId],
    } : l));
    setPaymentInputs(prev => ({ ...prev, [id]: '' }));
    setSelectedMonth(getTodayStr().slice(0, 7));
  };

  const handleExport = () => {
    const data = { transactions, loans, goals, categoryTargets, recurring, planned, monthlyTarget, currency, selectedMonth, heatmapThresholds };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = `clarity-backup-${getTodayStr()}.json`; 
    a.click();
    setToast({ message: 'Backup successfully downloaded!' }); 
    setTimeout(() => setToast(null), 3000);
  };

  const handleImport = (e) => {
    const file = e.target.files[0]; 
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data || typeof data !== 'object' || !Array.isArray(data.transactions)) throw new Error('Invalid backup');
        const isStoredDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
        const validTransactions = data.transactions.filter(item => item && (item.type === 'income' || item.type === 'expense') && Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 && Number(item.amount) <= MAX_MONEY_AMOUNT && isStoredDate(item.date));
        if (data.transactions.length > 0 && validTransactions.length === 0) throw new Error('No valid transactions');
        setTransactions(validTransactions.map(item => ({ ...item, amount: Number(item.amount) })));
        if (Array.isArray(data.loans)) setLoans(data.loans.filter(item => item && (item.type === 'lent' || item.type === 'borrowed') && Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 && Number(item.amount) <= MAX_MONEY_AMOUNT).map(item => ({
          ...item,
          amount: Number(item.amount),
          amountPaid: Math.min(Number(item.amount), Math.max(0, Number(item.amountPaid) || 0)),
          cashTransactionIds: Array.isArray(item.cashTransactionIds) ? item.cashTransactionIds.filter(Boolean) : item.cashTransactionIds,
          repaymentTransactionIds: Array.isArray(item.repaymentTransactionIds) ? item.repaymentTransactionIds.filter(Boolean) : item.repaymentTransactionIds,
        })));
        if (Array.isArray(data.goals)) setGoals(data.goals.filter(item => item && typeof item.name === 'string' && Number.isFinite(Number(item.target)) && Number(item.target) > 0 && Number(item.target) <= MAX_MONEY_AMOUNT).map(item => ({ ...item, target: Number(item.target), current: Math.min(Number(item.target), Math.max(0, Number(item.current) || 0)) })));
        if (data.categoryTargets && typeof data.categoryTargets === 'object' && !Array.isArray(data.categoryTargets)) setCategoryTargets(Object.fromEntries(Object.entries(data.categoryTargets).filter(([, value]) => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= MAX_MONEY_AMOUNT).map(([key, value]) => [key, Number(value)])));
        if (Array.isArray(data.recurring)) setRecurring(data.recurring.filter(item => item && typeof item.name === 'string' && Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 && Number(item.amount) <= MAX_MONEY_AMOUNT && Number.isInteger(Number(item.day)) && Number(item.day) >= 1 && Number(item.day) <= 31).map(item => ({ ...item, amount: Number(item.amount), day: Number(item.day) })));
        if (Array.isArray(data.planned)) setPlanned(data.planned.filter(item => item && typeof item.name === 'string' && Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 && Number(item.amount) <= MAX_MONEY_AMOUNT && isStoredDate(item.date)).map(item => ({ ...item, amount: Number(item.amount) })));
        if (Number.isFinite(Number(data.monthlyTarget)) && Number(data.monthlyTarget) >= 0) setMonthlyTarget(Number(data.monthlyTarget));
        if (CURRENCIES.some(item => item.code === data.currency)) setCurrency(data.currency);
        if (typeof data.selectedMonth === 'string' && /^\d{4}-\d{2}$/.test(data.selectedMonth)) setSelectedMonth(data.selectedMonth);
        if (isValidHeatmapThresholds(data.heatmapThresholds)) {
          const restoredThresholds = { green: Number(data.heatmapThresholds.green), yellow: Number(data.heatmapThresholds.yellow), orange: Number(data.heatmapThresholds.orange) };
          setHeatmapThresholds(restoredThresholds);
          setHeatmapDraft(restoredThresholds);
        }
        setToast({ message: 'Backup completely restored!' });
      } catch { 
        setToast({ message: 'Invalid backup file!' }); 
      }
      setTimeout(() => setToast(null), 4000);
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    try { 
      window.print(); 
    } catch {
      setToast({ message: 'Printing blocked by browser. Press Ctrl+P or Cmd+P.' });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleFileUpload = async (e) => {
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    setIsScanning(true);
    const today = getTodayStr();
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result.split(',')[1];
      const instruction = [
        'Read this receipt and extract one transaction.',
        `Today is ${today}. If the receipt has no readable date, use ${today}.`,
        'category must be one of: food, entertainment, education, transport, utilities, shopping, health, other_expense.',
        'Return ONLY JSON: {"amount": number, "category": string, "date": "YYYY-MM-DD", "note": string}',
      ].join('\n');

      const ai = await callGeminiJSON(apiKey, [
        { text: instruction },
        { inlineData: { mimeType: file.type, data: base64Data } },
      ]);

      if (ai.ok && ai.data) {
        const parsed = ai.data;
        const amount = Number(parsed.amount);
        const validCats = EXPENSE_CATEGORIES.map(c => c.id);
        setFormData(prev => ({
          ...prev,
          type: 'expense',
          amount: Number.isFinite(amount) && amount > 0 ? amount : '',
          category: validCats.includes(parsed.category) ? parsed.category : 'other_expense',
          date: sanitizeDate(parsed.date, today),
          note: typeof parsed.note === 'string' ? parsed.note : '',
        }));
        setToast({ message: 'Receipt scanned! Please confirm details below.' });
      } else {
        setToast({ message: `Failed to scan receipt: ${ai.error}` });
      }

      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setToast(null), 4000);
    };
    reader.onerror = () => {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setToast({ message: 'Could not read the receipt image.' });
      setTimeout(() => setToast(null), 4000);
    };
    reader.readAsDataURL(file);
  };

  const handleMagicAdd = async () => {
    const prompt = magicPrompt.trim();
    if (!prompt) return;

    setIsMagicLoading(true);
    const today = getTodayStr();

    // 1) Always parse locally first - this alone makes Magic Add work offline.
    const local = parseQuickEntry(prompt, today);
    let draft = { ...local };
    let aiError = null;

    // 2) Let Gemini refine it (better category + note). Never let it break the add.
    if (apiKey) {
      const instruction = [
        'You convert a short personal-finance note into one transaction.',
        `Today is ${today}. If no date is mentioned, use exactly ${today}.`,
        'Decide "type": "income" if money came IN (salary, refund, received, sold, gift, freelance payment, cashback, bonus), otherwise "expense".',
        'If type is "expense", category must be one of: food, entertainment, education, transport, utilities, shopping, health, other_expense.',
        'If type is "income", category must be one of: salary, freelance, investment, gift, other_income.',
        'paymentMethod must be one of: upi, cash, card, bank, wallet. Default to upi.',
        'amount is a positive number with no currency symbol or separators.',
        'note is a short human label (2-4 words).',
        'Return ONLY JSON: {"type":string,"amount":number,"category":string,"date":"YYYY-MM-DD","paymentMethod":string,"note":string}',
        `Input: "${prompt}"`,
      ].join('\n');

      const ai = await callGeminiJSON(apiKey, [{ text: instruction }]);
      if (ai.ok && ai.data) {
        const d = ai.data;
        const type = d.type === 'income' || d.type === 'expense' ? d.type : local.type;
        const validCats = (type === 'income' ? INCOME_SOURCES : EXPENSE_CATEGORIES).map(c => c.id);
        const aiAmount = Number(d.amount);

        draft = {
          type,
          amount: Number.isFinite(aiAmount) && aiAmount > 0 ? aiAmount : local.amount,
          category: validCats.includes(d.category)
            ? d.category
            : (validCats.includes(local.category) ? local.category : (type === 'income' ? 'other_income' : 'other_expense')),
          paymentMethod: PAYMENT_METHODS.some(p => p.id === d.paymentMethod) ? d.paymentMethod : local.paymentMethod,
          date: sanitizeDate(d.date, local.date),
          note: (typeof d.note === 'string' && d.note.trim()) ? d.note.trim() : local.note,
        };
      } else {
        aiError = ai.error;
      }
    }

    // 3) Guard rails before writing to state.
    if (!draft.amount || !Number.isFinite(draft.amount) || draft.amount <= 0) {
      setIsMagicLoading(false);
      setToast({ message: 'Couldn\u2019t find an amount in that. Try "240 snacks" or "1000 salary".' });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    const validCats = (draft.type === 'income' ? INCOME_SOURCES : EXPENSE_CATEGORIES).map(c => c.id);
    if (!validCats.includes(draft.category)) {
      draft.category = draft.type === 'income' ? 'other_income' : 'other_expense';
    }
    draft.date = sanitizeDate(draft.date, today);
    draft.amount = Math.round(draft.amount * 100) / 100;

    const newT = {
      id: `magic-${magicIdRef.current += 1}`,
      type: draft.type,
      amount: draft.amount,
      category: draft.category,
      paymentMethod: draft.paymentMethod || 'upi',
      date: draft.date,
      note: draft.note || prompt,
    };

    setTransactions(prev => [newT, ...prev]);

    // Jump the view to the month the transaction actually landed in, and clear
    // any active filter/search so the new row is visible immediately.
    setSelectedMonth(getMonthString(newT.date));
    setFilter('all');
    setSearchQuery('');

    setMagicPrompt('');
    setTransactionAnimation({ type: newT.type, amount: newT.amount, id: newT.id });
    setTimeout(() => setTransactionAnimation(null), 1800);

    const catLabel = (newT.type === 'income' ? INCOME_SOURCES : EXPENSE_CATEGORIES)
      .find(c => c.id === newT.category)?.label || newT.category;
    setToast({
      message: aiError
        ? `Added ${newT.type} ${formatMoney(newT.amount)} - ${catLabel} (offline parse: ${aiError})`
        : `Added ${newT.type} ${formatMoney(newT.amount)} - ${catLabel}`,
    });
    setIsMagicLoading(false);
    setTimeout(() => setToast(null), 4000);
  };

  // Builds the real numbers for the selected month so the AI has something to
  // actually analyse (the old version returned two hardcoded sentences).
  const buildMonthSummary = () => {
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
        category: EXPENSE_CATEGORIES.find(c => c.id === id)?.label || id,
        amount: Math.round(amount),
        share: currentMonthData.expense > 0 ? Math.round((amount / currentMonthData.expense) * 1000) / 10 : 0,
      }));

    const byPayment = {};
    monthExpenses.forEach(t => {
      const label = PAYMENT_METHODS.find(p => p.id === t.paymentMethod)?.label || 'Other';
      byPayment[label] = (byPayment[label] || 0) + t.amount;
    });

    const largest = [...monthExpenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(t => ({
        note: t.note || (EXPENSE_CATEGORIES.find(c => c.id === t.category)?.label || t.category),
        amount: Math.round(t.amount),
        date: t.date,
      }));

    const budgets = Object.entries(categoryTargets)
      .filter(([, limit]) => Number(limit) > 0)
      .map(([id, limit]) => ({
        category: EXPENSE_CATEGORIES.find(c => c.id === id)?.label || id,
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

  // Deterministic insights used when there is no API key or the call fails.
  const buildLocalInsights = (s) => {
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

  const generateDetailedReport = async () => {
    setShowReport(true);
    setIsReportLoading(true);
    setReportError(null);
    setReportInsights(null);

    const summary = buildMonthSummary();
    const fallback = buildLocalInsights(summary);

    if (!apiKey) {
      setReportInsights(fallback);
      setReportError('No API key saved, so this is an automatic (non-AI) analysis. Add a Gemini key to get written insights.');
      setIsReportLoading(false);
      return;
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
      setReportInsights({
        observation: ai.data.observation || fallback.observation,
        suggestion: ai.data.suggestion || fallback.suggestion,
        highlights: Array.isArray(ai.data.highlights) ? ai.data.highlights.filter(Boolean) : fallback.highlights,
        watchOut: typeof ai.data.watchOut === 'string' ? ai.data.watchOut : null,
      });
    } else {
      setReportInsights(fallback);
      setReportError(`AI insights unavailable (${ai.error || 'unexpected response'}). Showing an automatic analysis instead.`);
    }
    setIsReportLoading(false);
  };

  const formatCompactMoney = (amount) => formatCompactCurrency(amount, currency);
  const formatMoney = (amount) => formatCurrency(amount, currency);
  const CurrencyIcon = CURRENCIES.find(c => c.code === currency)?.icon || DollarSign;

  return (
    <div className="theme-container min-h-screen bg-slate-50 dk-bg-slate-900 text-slate-900 dk-text-slate-100 font-sans transition-colors duration-300 selection:bg-indigo-100 dk-selection-bg-indigo-900-50 selection:text-indigo-900 dk-selection-text-indigo-100 print-container">
      <style>{globalStyles}</style>

      {transactionAnimation && (
        <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 flex items-center gap-3 text-5xl font-black drop-shadow-2xl no-print ${transactionAnimation.type === 'income' ? 'anim-income text-emerald-500' : 'anim-expense text-rose-500'}`}>
          {transactionAnimation.type === 'income' ? '🤑' : '💸'} {transactionAnimation.type === 'income' ? '+' : '-'}{formatMoney(transactionAnimation.amount)}
        </div>
      )}

      <nav className="bg-white/90 dk-bg-slate-900-80 border-b border-slate-200 dk-border-slate-800 sticky top-0 z-40 shadow-sm backdrop-blur-md transition-colors duration-300 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 dk-text-indigo-400">
            <Activity className="w-6 h-6 shrink-0" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dk-text-white hidden lg:block">Clarity Finance</h1>
            
            <div className="flex bg-slate-100 dk-bg-slate-800 p-1 rounded-xl ml-2 lg:ml-6 overflow-x-auto max-w-full">
              <button onClick={() => setActiveTab('dashboard')} className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all duration-200 text-xs sm:text-sm font-semibold ${activeTab === 'dashboard' ? 'bg-white dk-bg-slate-700 text-indigo-600 dk-text-indigo-400 shadow-sm' : 'text-slate-600 dk-text-slate-400 hover:text-slate-900 dk-hover-text-slate-200'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('forecast')} className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all duration-200 text-xs sm:text-sm font-semibold ${activeTab === 'forecast' ? 'bg-white dk-bg-slate-700 text-indigo-600 dk-text-indigo-400 shadow-sm' : 'text-slate-600 dk-text-slate-400 hover:text-slate-900 dk-hover-text-slate-200'}`}>Forecast</button>
              <button onClick={() => setActiveTab('loans')} className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all duration-200 text-xs sm:text-sm font-semibold ${activeTab === 'loans' ? 'bg-white dk-bg-slate-700 text-indigo-600 dk-text-indigo-400 shadow-sm' : 'text-slate-600 dk-text-slate-400 hover:text-slate-900 dk-hover-text-slate-200'}`}>Loans</button>
              <button onClick={() => setActiveTab('goals')} className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all duration-200 text-xs sm:text-sm font-semibold ${activeTab === 'goals' ? 'bg-white dk-bg-slate-700 text-indigo-600 dk-text-indigo-400 shadow-sm' : 'text-slate-600 dk-text-slate-400 hover:text-slate-900 dk-hover-text-slate-200'}`}>Goals</button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 text-sm font-medium text-slate-600 dk-text-slate-300">
            
            <div className="relative">
              <button 
                onClick={() => { setIsCalendarOpen(!isCalendarOpen); setCalendarYear(parseInt(selectedMonth.split('-')[0], 10)); }} 
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dk-bg-slate-800 dk-hover-bg-slate-700 px-4 py-2 rounded-xl transition-all duration-300 ease-in-out cursor-pointer hover:shadow-sm"
              >
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span className="font-bold text-slate-800 dk-text-slate-200">
                  {monthLabel(selectedMonth, { month: 'short', year: 'numeric' })}
                </span>
              </button>

              {isCalendarOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsCalendarOpen(false)}></div>
                  <div className="absolute top-full right-0 sm:left-0 mt-2 p-4 bg-white dk-bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dk-border-slate-700 z-50 w-64 animate-fade-in-up origin-top-left">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200 dk-border-slate-700">
                      <button onClick={() => setCalendarYear(y => y - 1)} className="p-1 hover:bg-slate-100 dk-hover-bg-slate-700 rounded-lg transition-colors text-slate-700 dk-text-slate-200"><ChevronRight className="w-5 h-5 rotate-180" /></button>
                      <span className="font-bold text-lg text-slate-900 dk-text-white">{calendarYear}</span>
                      <button onClick={() => setCalendarYear(y => y + 1)} className="p-1 hover:bg-slate-100 dk-hover-bg-slate-700 rounded-lg transition-colors text-slate-700 dk-text-slate-200"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => {
                        const monthStr = `${calendarYear}-${(i+1).toString().padStart(2, '0')}`;
                        const isSelected = selectedMonth === monthStr;
                        return (
                          <button 
                            key={m} 
                            onClick={() => { setSelectedMonth(monthStr); setIsCalendarOpen(false); }}
                            className={`py-2 rounded-xl text-sm font-semibold transition-colors ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-indigo-50 dk-hover-bg-indigo-900-30 text-slate-700 dk-text-slate-300'}`}
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

            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-slate-100 hover:bg-slate-200 dk-bg-slate-800 dk-hover-bg-slate-700 border-none rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dk-text-slate-200 transition-all duration-300 ease-in-out cursor-pointer outline-none hover:shadow-sm focus:ring-2 focus:ring-indigo-500/50">
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>

            <button onClick={() => { setTempApiKey(apiKey); setShowApiKeyModal(true); }} className="p-2 rounded-full hover:bg-slate-100 dk-hover-bg-slate-800 transition-colors text-indigo-600 dk-text-indigo-400" title="API Key Settings"><Key className="w-5 h-5" /></button>
            <button onClick={handleExport} className="p-2 rounded-full hover:bg-slate-100 dk-hover-bg-slate-800 transition-colors text-slate-700 dk-text-slate-300" title="Backup Data"><DownloadCloud className="w-5 h-5" /></button>
            <label className="p-2 rounded-full hover:bg-slate-100 dk-hover-bg-slate-800 transition-colors cursor-pointer text-slate-700 dk-text-slate-300" title="Restore Data"><Upload className="w-5 h-5" /><input type="file" accept=".json" onChange={handleImport} className="hidden" /></label>
            <button onClick={handlePrint} className="p-2 rounded-full hover:bg-slate-100 dk-hover-bg-slate-800 transition-colors text-slate-700 dk-text-slate-300" title="Download Monthly PDF"><Download className="w-5 h-5" /></button>
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-slate-100 dk-hover-bg-slate-800 transition-colors text-slate-700 dk-text-slate-300" title="Toggle Theme">{isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        <div className="hidden print-only mb-8 border-b pb-4"><h1 className="text-3xl font-bold text-black">Financial Report</h1><p className="text-lg text-gray-600">Month: {monthLabel(selectedMonth)}</p></div>

        {warnings.length > 0 && activeTab === 'dashboard' && (
          <div className="animate-fade-in-up space-y-2 no-print">
            {warnings.map((warn, i) => (
              <div key={i} className={`flex items-center gap-3 border-l-4 p-4 rounded-r-xl shadow-sm ${warn.type === 'danger' ? 'bg-rose-50 border-rose-500 text-rose-900 dk-bg-rose-900-20 dk-text-rose-300' : 'bg-amber-50 border-amber-500 text-amber-900 dk-bg-amber-900-20 dk-text-amber-300'}`}>
                <span className="text-xl">{warn.icon}</span><p className="text-sm font-semibold">{warn.text}</p>
              </div>
            ))}
          </div>
        )}

        {}
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in-up print-break-inside-avoid relative z-20">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2 text-indigo-100 mb-2"><Wallet className="w-5 h-5" /><h2 className="font-semibold">Monthly Savings</h2></div>
                    <p className="text-4xl font-extrabold text-white">{formatMoney(currentMonthData.savings)}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/20 space-y-2 text-sm text-indigo-100">
                    <div className="flex items-center gap-2"><History className="w-4 h-4 shrink-0" /><span>Vs Last: {savingsDifference >= 0 ? '+' : ''}{formatMoney(savingsDifference)}</span></div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2"><Landmark className="w-4 h-4 shrink-0" /> Total Balance</span>
                      <span className="font-extrabold text-white">{formatMoney(balance)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-500 dk-text-slate-400 mb-2"><TrendingUp className="w-5 h-5 text-emerald-500" /><h2 className="font-semibold text-slate-700 dk-text-slate-300">Monthly Income</h2></div>
                  <p className="text-3xl font-extrabold text-slate-900 dk-text-white">{formatMoney(currentMonthData.income)}</p>
                </div>
                {highestSavingsMonth && <p className="text-xs text-slate-500 dk-text-slate-400 mt-4 pt-4 border-t border-slate-100 dk-border-slate-700 font-medium">Best Month: {highestSavingsMonth.month} ({formatMoney(highestSavingsMonth.savings)})</p>}
              </div>

              <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm relative flex flex-col justify-between">
                <button onClick={() => setShowBudgetSettings(!showBudgetSettings)} className="absolute top-6 right-6 p-1 text-slate-400 hover:text-indigo-500 bg-slate-50 dk-bg-slate-700 rounded-md transition-colors"><Settings className="w-4 h-4" /></button>
                <div>
                  <div className="flex items-center gap-2 text-slate-500 dk-text-slate-400 mb-2"><TrendingDown className="w-5 h-5 text-rose-500" /><h2 className="font-semibold text-slate-700 dk-text-slate-300">Monthly Expenses</h2></div>
                  <p className="text-3xl font-extrabold text-slate-900 dk-text-white">{formatMoney(currentMonthData.expense)}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 dk-border-slate-700">
                  <div className="flex justify-between text-xs mb-1 font-semibold text-slate-600 dk-text-slate-300"><span>Target</span><span>{formatMoney(monthlyTarget)}</span></div>
                  <div className="h-2 w-full bg-slate-100 dk-bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${currentMonthData.expense > monthlyTarget ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min((currentMonthData.expense / (monthlyTarget || 1)) * 100, 100)}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between group relative hover:z-30">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-indigo-400 min-w-0"><Activity className="w-5 h-5 shrink-0" /><h2 className="font-semibold text-white whitespace-nowrap">Health Score</h2></div>
                    <span className="text-xl font-black text-white whitespace-nowrap shrink-0">{financialHealth.score}/100</span>
                  </div>
                  <p className="text-xs text-slate-200 mt-2 leading-relaxed">{financialHealth.message}</p>
                </div>

                <div className="absolute top-full left-0 mt-3 w-full p-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white text-xs rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-2xl z-50 -translate-y-2 group-hover:translate-y-0">
                  <p className="font-bold mb-2 text-indigo-400 border-b border-slate-700 pb-1">Score Breakdown:</p>
                  <ul className="space-y-1">
                    {financialHealth.breakdown.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0"/> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-slate-300 mt-4 pt-4 border-t border-white/10 flex justify-between font-medium">Daily Spend: <span className="text-orange-400 font-bold">{formatMoney(dailyAverage)}</span></p>
              </div>
            </div>

            {}
            {showBudgetSettings && (
              <div className="bg-indigo-50 dk-bg-indigo-900-20 rounded-3xl p-6 border border-indigo-200 dk-border-indigo-800 relative z-10">
                <h3 className="text-lg font-bold mb-4 text-indigo-950 dk-text-indigo-200">Set Monthly Budget Targets</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="dark-card bg-white dk-bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dk-border-slate-700">
                    <label className="text-xs font-semibold text-slate-600 dk-text-slate-400 block mb-1">Overall Limit</label>
                    <input type="number" min="0" value={monthlyTarget} onChange={(e) => handleMonthlyTargetChange(e.target.value)} className="w-32 px-3 py-1 bg-slate-50 dk-bg-slate-900 rounded-lg border border-slate-300 dk-border-slate-700 text-slate-900 dk-text-white transition-all outline-none font-bold" />
                  </div>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <div key={cat.id} className="dark-card bg-white dk-bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dk-border-slate-700">
                      <label className="text-xs font-semibold text-slate-600 dk-text-slate-400 block mb-1">{cat.icon} {cat.label}</label>
                      <input type="number" min="0" value={categoryTargets[cat.id] || ''} onChange={(e) => handleBudgetChange(cat.id, e.target.value)} placeholder="No limit" className="w-28 px-3 py-1 bg-slate-50 dk-bg-slate-900 rounded-lg border border-slate-300 dk-border-slate-700 text-slate-900 dk-text-white transition-all outline-none font-bold" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up stagger-1 relative z-0">
              <div onClick={openHeatmap} className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm flex flex-col justify-center items-center cursor-pointer group hover:shadow-md hover:border-indigo-300 dk-hover-border-indigo-700 transition-all duration-300 min-h-[200px]">
                <div className="w-16 h-16 bg-indigo-50 dk-bg-indigo-900-30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"><Calendar className="w-8 h-8 text-indigo-500" /></div>
                <h3 className="text-lg font-bold text-slate-900 dk-text-white">Daily Heatmap</h3>
                <p className="text-sm text-slate-500 dk-text-slate-400 text-center mt-1">Explore daily spending patterns.</p>
              </div>
              
              <div onClick={() => setIsTrendOpen(true)} className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm flex flex-col justify-center items-center cursor-pointer group hover:shadow-md hover:border-emerald-300 dk-hover-border-emerald-700 transition-all duration-300 min-h-[200px]">
                <div className="w-16 h-16 bg-emerald-50 dk-bg-emerald-900-30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"><BarChart className="w-8 h-8 text-emerald-500" /></div>
                <h3 className="text-lg font-bold text-slate-900 dk-text-white">6-Month Trend</h3>
                <p className="text-sm text-slate-500 dk-text-slate-400 text-center mt-1">Visualize income vs expenses.</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 dk-from-orange-900-10 rounded-3xl p-6 border border-orange-200 dk-border-orange-800-30 shadow-sm flex flex-col justify-between min-h-[200px]">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dk-text-white flex items-center gap-2 mb-4"><Flame className="w-5 h-5 text-orange-500" /> Streaks & Habits</h3>
                  <div className="space-y-3">
                    <div className="dark-card flex justify-between items-center bg-white dk-bg-slate-800 p-3 rounded-xl shadow-sm border border-orange-100 dk-border-slate-700">
                      <span className="text-sm font-semibold text-slate-700 dk-text-slate-300">No-Spend Streak</span>
                      <span className="font-extrabold text-orange-500 flex items-center gap-1"><Flame className="w-4 h-4 fill-current" /> {noSpendStreak} Days</span>
                    </div>
                    <div className="dark-card flex justify-between items-center bg-white dk-bg-slate-800 p-3 rounded-xl shadow-sm border border-orange-100 dk-border-slate-700">
                      <span className="text-sm font-semibold text-slate-700 dk-text-slate-300">Days Remaining</span>
                      <span className="font-extrabold text-slate-800 dk-text-slate-100">{daysRemainingInfo.label}</span>
                    </div>
                  </div>
                </div>
                {frequentCategory && <div className="mt-4 p-3 bg-indigo-50 dk-bg-indigo-900-30 rounded-xl text-xs font-semibold text-indigo-900 dk-text-indigo-300">💡 You've purchased items under <strong>{frequentCategory.label}</strong> {frequentCategory.count} times this month.</div>}
              </div>
            </div>

            {}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dk-from-indigo-900-20 rounded-3xl p-6 border border-indigo-200 dk-border-indigo-800-50 shadow-sm">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-indigo-950 dk-text-indigo-200"><Sparkles className="w-5 h-5 text-indigo-500" /> Magic Add & Receipt Scan</h3>
                  <div className="flex gap-2 mt-4">
                    <input type="text" value={magicPrompt} onChange={(e) => setMagicPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleMagicAdd()} placeholder="e.g. 240 snacks or 1000 salary" className="flex-1 px-3 py-2 bg-white dk-bg-slate-800 border border-slate-300 dk-border-slate-700 rounded-xl text-sm text-slate-900 dk-text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500" />
                    <button onClick={handleMagicAdd} disabled={isMagicLoading} className="px-3 py-2 bg-indigo-600 text-white rounded-xl shadow disabled:opacity-70 hover:bg-indigo-700">{isMagicLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}</button>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isScanning} className="px-3 py-2 bg-purple-600 text-white rounded-xl shadow flex items-center hover:bg-purple-700" title="Scan Receipt">{isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}</button>
                  </div>
                </div>

                <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 dk-text-white">{editingId ? <Edit2 className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-indigo-500" />}{editingId ? 'Edit Transaction' : 'Manual Entry'}</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex bg-slate-100 dk-bg-slate-900 p-1 rounded-xl">
                      <button type="button" onClick={() => handleInputChange({ target: { name: 'type', value: 'expense' }})} className={`flex-1 py-1.5 text-sm font-bold rounded-lg ${formData.type === 'expense' ? 'bg-white dk-bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-500 dk-text-slate-400'}`}>Expense</button>
                      <button type="button" onClick={() => handleInputChange({ target: { name: 'type', value: 'income' }})} className={`flex-1 py-1.5 text-sm font-bold rounded-lg ${formData.type === 'income' ? 'bg-white dk-bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-500 dk-text-slate-400'}`}>Income</button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dk-text-slate-300 mb-1">Amount</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><CurrencyIcon className="w-4 h-4" /></span>
                        <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="0.00" required className="w-full pl-9 pr-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-slate-900 dk-text-white text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dk-text-slate-300 mb-1">Category</label>
                        <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-slate-900 dk-text-white text-sm font-medium outline-none">
                          {formData.type === 'expense' ? EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>) : INCOME_SOURCES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dk-text-slate-300 mb-1">Payment Method</label>
                        <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-slate-900 dk-text-white text-sm font-medium outline-none">
                          {PAYMENT_METHODS.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs font-bold text-slate-600 dk-text-slate-300 mb-1">Date</label><input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-slate-900 dk-text-white text-sm outline-none" /></div>
                      <div><label className="block text-xs font-bold text-slate-600 dk-text-slate-300 mb-1">Note</label><input type="text" name="note" value={formData.note} onChange={handleInputChange} placeholder="e.g. Coffee" className="w-full px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-slate-900 dk-text-white text-sm outline-none" /></div>
                    </div>

                    {formData.type === 'expense' && !editingId && (
                      <div className="pt-2 border-t border-slate-100 dk-border-slate-700">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dk-text-slate-300 cursor-pointer">
                          <input type="checkbox" checked={isSplit} onChange={(e) => setIsSplit(e.target.checked)} className="rounded text-indigo-600" />
                          <Share2 className="w-4 h-4 text-indigo-500" /> Split expense?
                        </label>
                        {isSplit && (
                          <div className="mt-2 flex gap-2">
                            <input type="text" placeholder="Friend name" value={splitDetails.person} onChange={e => setSplitDetails({...splitDetails, person: e.target.value})} className="w-1/2 px-2 py-1.5 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-lg text-xs text-slate-900 dk-text-white" />
                            <input type="number" placeholder="Their share" value={splitDetails.amount} onChange={e => setSplitDetails({...splitDetails, amount: e.target.value})} className="w-1/2 px-2 py-1.5 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-lg text-xs text-slate-900 dk-text-white" />
                          </div>
                        )}
                      </div>
                    )}
                    <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition-colors">{editingId ? 'Update' : 'Add'}</button>
                  </form>
                </div>

                <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dk-text-white flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-indigo-500" /> Top Spending</h3>
                  <div className="space-y-3">
                    {expensesByCategory.slice(0, 5).map(cat => (
                      <div key={cat.id}>
                        <div className="flex justify-between text-xs mb-1 font-bold text-slate-700 dk-text-slate-300"><span>{cat.icon} {cat.label}</span><span>{formatMoney(cat.amount)}</span></div>
                        <div className="h-2 w-full bg-slate-100 dk-bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.percentage}%` }}></div></div>
                      </div>
                    ))}
                  </div>
                  <button onClick={generateDetailedReport} className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl text-sm shadow flex justify-center items-center gap-2 hover:opacity-90 transition-opacity"><FileText className="w-4 h-4" /> AI Month Report</button>
                </div>
              </div>

              {}
              <div className="lg:col-span-2">
                <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm min-h-[600px] flex flex-col">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 dk-text-white flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-indigo-500" /> Transactions</h3>
                      <p className="text-sm font-bold text-indigo-600 dk-text-indigo-300 mt-1">
                        {monthLabel(selectedMonth)}
                        <span className="text-slate-400 dk-text-slate-400 font-semibold"> · {displayTransactions.length} shown</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dk-text-slate-400">Total spent</p>
                      <p className="text-2xl font-extrabold text-rose-500 leading-tight">{formatMoney(currentMonthData.expense)}</p>
                      <p className="text-[11px] font-semibold text-emerald-600 dk-text-emerald-300">+{formatMoney(currentMonthData.income)} in</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end items-center mb-6 gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400"><Search className="w-3.5 h-3.5" /></span>
                        <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-40 pl-8 pr-2 py-1.5 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-lg text-xs text-slate-900 dk-text-white font-medium outline-none" />
                      </div>
                      <div className="flex bg-slate-100 dk-bg-slate-900 p-1 rounded-xl">
                        {['all', 'income', 'expense'].map((f) => (
                          <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 text-xs font-bold rounded-lg capitalize ${filter === f ? 'bg-white dk-bg-slate-700 text-indigo-600 dk-text-indigo-300 shadow-sm' : 'text-slate-500 dk-text-slate-400'}`}>{f}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3">
                    {displayTransactions.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12"><CreditCard className="w-12 h-12 mb-2 text-slate-400" /><p className="font-medium">No matching transactions found.</p></div>
                    ) : (
                      displayTransactions.map((transaction) => {
                        const isIncome = transaction.type === 'income';
                        const catInfo = isIncome ? INCOME_SOURCES.find(c => c.id === transaction.category) : EXPENSE_CATEGORIES.find(c => c.id === transaction.category);
                        return (
                          <div key={transaction.id} className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 dk-bg-slate-800-50 border border-slate-100 dk-border-slate-700-50 hover:border-slate-300 dk-hover-border-slate-600 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white dk-bg-slate-700 flex items-center justify-center text-lg shadow-sm border border-slate-200 dk-border-slate-600">{catInfo?.icon || '📦'}</div>
                              <div>
                                <p className="font-bold text-sm text-slate-900 dk-text-slate-100">{catInfo?.label || 'Other'}</p>
                                {transaction.note && <p className="text-xs text-slate-600 dk-text-slate-400 font-medium">"{transaction.note}"</p>}
                                {transaction.linkedLoanId && <p className="text-[10px] text-indigo-600 dk-text-indigo-300 font-bold">Linked loan movement</p>}
                                <p className="text-[10px] text-slate-500 dk-text-slate-400 mt-0.5">{transaction.date} • {transaction.paymentMethod?.toUpperCase() || 'UPI'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`font-extrabold text-sm ${isIncome ? 'text-emerald-500' : 'text-slate-900 dk-text-slate-100'}`}>{isIncome ? '+' : '-'}{formatMoney(transaction.amount)}</span>
                              <div className="flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                {!transaction.linkedLoanId && <button onClick={() => initiateEdit(transaction)} className="p-1.5 text-slate-500 hover:text-indigo-600"><Edit2 className="w-3.5 h-3.5" /></button>}
                                <button onClick={() => deleteTransaction(transaction.id)} className="p-1.5 text-slate-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
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

        {}
        {activeTab === 'forecast' && (
          <div className="animate-fade-in-up space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-6 text-white shadow-lg"><h2 className="text-sm font-semibold text-blue-100 mb-1">Projected End-of-Month Balance</h2><p className="text-4xl font-extrabold">{formatMoney(projections.projectedBalance)}</p><p className="text-xs text-blue-100 mt-2">Current balance minus unpaid recurring and planned expenses due this month.</p></div>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl p-6 text-white shadow-lg"><h2 className="text-sm font-semibold text-emerald-100 mb-1">Projected Monthly Savings</h2><p className="text-4xl font-extrabold">{formatMoney(projections.projectedSavings)}</p><p className="text-xs text-emerald-100 mt-2">Uses recorded income and expenses; no expected income is assumed.</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 dk-text-white mb-4 flex items-center gap-2"><Repeat className="w-5 h-5 text-indigo-500" /> Recurring Expenses</h3>
                <form onSubmit={handleRecurringSubmit} className="flex flex-wrap gap-2 mb-4">
                  <input type="text" placeholder="Name" value={recurringForm.name} onChange={e => setRecurringForm({...recurringForm, name: e.target.value})} className="flex-1 min-w-[120px] px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-xs text-slate-900 dk-text-white" required />
                  <input type="number" placeholder="Amt" value={recurringForm.amount} onChange={e => setRecurringForm({...recurringForm, amount: e.target.value})} className="w-24 px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-xs text-slate-900 dk-text-white font-bold" required />
                  <input type="number" min="1" max="31" placeholder="Day" value={recurringForm.day} onChange={e => setRecurringForm({...recurringForm, day: e.target.value})} className="w-16 px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-xs text-slate-900 dk-text-white font-bold" required />
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">{editingRecurringId ? 'Update' : 'Add'}</button>
                </form>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-60">
                  {recurring.map(r => (
                    <div key={r.id} className="flex justify-between items-center p-3 bg-slate-50 dk-bg-slate-900 rounded-xl text-sm border border-slate-200 dk-border-slate-800"><div className="flex-1"><p className="font-bold text-slate-900 dk-text-slate-100">{r.name}</p><p className="text-xs text-slate-500 dk-text-slate-400">Day {r.day}</p></div><div className="flex items-center gap-3"><span className="font-bold text-rose-500">{formatMoney(r.amount)}</span><button onClick={() => { setEditingRecurringId(r.id); setRecurringForm({ name: r.name, amount: r.amount, day: String(r.day), category: r.category || 'utilities' }); }} className="text-slate-400 hover:text-indigo-500" title="Edit recurring expense"><Edit2 className="w-4 h-4" /></button><button onClick={() => deleteWithUndo(recurring, setRecurring, r.id, 'recurring expense')} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></div></div>
                  ))}
                </div>
              </div>
              <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 dk-text-white mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-500" /> Planned Future Expenses</h3>
                <form onSubmit={handlePlannedSubmit} className="flex flex-wrap gap-2 mb-4">
                  <input type="text" placeholder="Name" value={plannedForm.name} onChange={e => setPlannedForm({...plannedForm, name: e.target.value})} className="flex-1 min-w-[120px] px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-xs text-slate-900 dk-text-white" required />
                  <input type="number" placeholder="Amt" value={plannedForm.amount} onChange={e => setPlannedForm({...plannedForm, amount: e.target.value})} className="w-24 px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-xs text-slate-900 dk-text-white font-bold" required />
                  <input type="date" value={plannedForm.date} onChange={e => setPlannedForm({...plannedForm, date: e.target.value})} className="w-32 px-2 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-xs text-slate-900 dk-text-white font-bold" required />
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">{editingPlannedId ? 'Update' : 'Add'}</button>
                </form>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-60">
                  {planned.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 dk-bg-slate-900 rounded-xl text-sm border border-slate-200 dk-border-slate-800"><div className="flex-1"><p className="font-bold text-slate-900 dk-text-slate-100">{p.name}</p><p className="text-xs text-slate-500 dk-text-slate-400">{p.date}</p></div><div className="flex items-center gap-3"><span className="font-bold text-rose-500">{formatMoney(p.amount)}</span><button onClick={() => { setEditingPlannedId(p.id); setPlannedForm({ name: p.name, amount: p.amount, date: p.date, category: p.category || 'other_expense' }); }} className="text-slate-400 hover:text-indigo-500" title="Edit planned expense"><Edit2 className="w-4 h-4" /></button><button onClick={() => deleteWithUndo(planned, setPlanned, p.id, 'planned expense')} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></div></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {}
        {activeTab === 'loans' && (
          <div className="animate-fade-in-up space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow"><h2 className="text-sm font-semibold text-emerald-100 mb-1">To Receive</h2><p className="text-4xl font-extrabold">{formatMoney(loans.filter(l => l.type === 'lent').reduce((acc, l) => acc + (l.amount - l.amountPaid), 0))}</p></div>
              <div className="bg-gradient-to-br from-rose-500 to-orange-600 rounded-3xl p-6 text-white shadow"><h2 className="text-sm font-semibold text-rose-100 mb-1">To Pay</h2><p className="text-4xl font-extrabold">{formatMoney(loans.filter(l => l.type === 'borrowed').reduce((acc, l) => acc + (l.amount - l.amountPaid), 0))}</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm"><h3 className="text-lg font-bold text-slate-900 dk-text-white mb-6 flex items-center gap-2"><Landmark className="w-5 h-5 text-indigo-500" /> Log New Loan</h3>
                  <form onSubmit={handleLoanSubmit} className="space-y-4">
                    <div className="flex bg-slate-100 dk-bg-slate-900 p-1 rounded-xl">
                      <button type="button" onClick={() => setLoanForm(p => ({...p, type: 'lent'}))} className={`flex-1 py-1.5 text-sm font-bold rounded-lg ${loanForm.type === 'lent' ? 'bg-white dk-bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-500 dk-text-slate-400'}`}>I Lent</button>
                      <button type="button" onClick={() => setLoanForm(p => ({...p, type: 'borrowed'}))} className={`flex-1 py-1.5 text-sm font-bold rounded-lg ${loanForm.type === 'borrowed' ? 'bg-white dk-bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-500 dk-text-slate-400'}`}>I Borrowed</button>
                    </div>
                    <div><input type="text" value={loanForm.person} onChange={e => setLoanForm(p => ({...p, person: e.target.value}))} placeholder="Person/Entity" required className="w-full px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-sm text-slate-900 dk-text-white font-medium" /></div>
                    <div><input type="number" value={loanForm.amount} onChange={e => setLoanForm(p => ({...p, amount: e.target.value}))} placeholder="Amount" required className="w-full px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-sm text-slate-900 dk-text-white font-bold" /></div>
                    <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow">Log Loan</button>
                  </form>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                {loans.length === 0 && (
                  <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-10 border border-dashed border-slate-300 dk-border-slate-700 flex flex-col items-center justify-center text-center">
                    <Landmark className="w-10 h-10 text-slate-300 dk-text-slate-400 mb-3" />
                    <p className="font-semibold text-slate-700 dk-text-slate-300">No loans logged yet</p>
                    <p className="text-sm text-slate-500 dk-text-slate-400 mt-1">Add one on the left to start tracking who owes what.</p>
                  </div>
                )}
                {loans.map(loan => {
                  const isSettled = loan.amountPaid >= loan.amount;
                  return (
                    <div key={loan.id} className="dark-card bg-white dk-bg-slate-800 rounded-2xl p-5 border border-slate-200 dk-border-slate-700 shadow-sm relative overflow-hidden group">
                      {isSettled && <div className="absolute top-0 right-0 p-4"><CheckCircle className="w-6 h-6 text-emerald-500 opacity-50"/></div>}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${loan.type === 'lent' ? 'bg-emerald-100 text-emerald-800 dk-bg-emerald-900-30 dk-text-emerald-300' : 'bg-rose-100 text-rose-800 dk-bg-rose-900-20 dk-text-rose-300'}`}>{loan.type === 'lent' ? 'LENT TO' : 'BORROWED FROM'}</span>
                          <span className="font-bold ml-2 text-slate-900 dk-text-white">{loan.person}</span>
                          <p className="text-xs text-slate-500 dk-text-slate-400 mt-1 font-medium">{loan.note} • {loan.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-slate-900 dk-text-white">{formatMoney(loan.amount)}</p>
                          <button onClick={() => deleteLoanWithUndo(loan)} className="text-xs text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 mt-1">Delete</button>
                        </div>
                      </div>
                      <div className="bg-slate-50 dk-bg-slate-900-50 p-4 rounded-xl border border-slate-200 dk-border-slate-800">
                         <div className="flex justify-between text-sm mb-2 font-semibold text-slate-700 dk-text-slate-300"><span>Paid Back</span><span>{formatMoney(loan.amountPaid)} / {formatMoney(loan.amount)}</span></div>
                         <div className="h-2 w-full bg-slate-200 dk-bg-slate-700 rounded-full overflow-hidden mb-4"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((loan.amountPaid/loan.amount)*100, 100)}%` }}></div></div>
                         {!isSettled && (
                           <div className="flex gap-2">
                             <input type="number" value={paymentInputs[loan.id] || ''} onChange={e => setPaymentInputs({...paymentInputs, [loan.id]: e.target.value})} placeholder="Log partial payment" className="flex-1 px-3 py-2 bg-white dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-lg text-sm text-slate-900 dk-text-white font-bold" />
                             <button onClick={() => recordLoanPayment(loan.id)} className="px-4 py-2 bg-indigo-100 text-indigo-700 dk-bg-indigo-900-40 dk-text-indigo-300 rounded-lg text-sm font-bold">Record</button>
                           </div>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {}
        {activeTab === 'goals' && (
          <div className="animate-fade-in-up space-y-6">
             <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-6 border border-slate-200 dk-border-slate-700 shadow-sm">
               <h3 className="text-lg font-bold text-slate-900 dk-text-white mb-4">Add Savings Goal</h3>
               <form onSubmit={handleGoalSubmit} className="flex flex-wrap gap-4">
                  <input type="text" placeholder="Goal Name" value={goalForm.name} onChange={e => setGoalForm({...goalForm, name: e.target.value})} required className="flex-1 min-w-[160px] px-3 py-2 border border-slate-300 dk-border-slate-700 bg-slate-50 dk-bg-slate-900 text-slate-900 dk-text-white rounded-xl text-sm" />
                  <input type="number" placeholder="Target Amount" value={goalForm.target} onChange={e => setGoalForm({...goalForm, target: e.target.value})} required className="w-32 px-3 py-2 border border-slate-300 dk-border-slate-700 bg-slate-50 dk-bg-slate-900 text-slate-900 dk-text-white rounded-xl text-sm font-bold" />
                  <input type="number" placeholder="Already Saved" value={goalForm.current} onChange={e => setGoalForm({...goalForm, current: e.target.value})} className="w-32 px-3 py-2 border border-slate-300 dk-border-slate-700 bg-slate-50 dk-bg-slate-900 text-slate-900 dk-text-white rounded-xl text-sm font-bold" />
                  <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">Add Goal</button>
               </form>
             </div>
             {goals.length === 0 && (
               <div className="dark-card bg-white dk-bg-slate-800 rounded-3xl p-10 border border-dashed border-slate-300 dk-border-slate-700 flex flex-col items-center justify-center text-center">
                 <CheckCircle className="w-10 h-10 text-slate-300 dk-text-slate-400 mb-3" />
                 <p className="font-semibold text-slate-700 dk-text-slate-300">No savings goals yet</p>
                 <p className="text-sm text-slate-500 dk-text-slate-400 mt-1">Create your first goal above to track progress.</p>
               </div>
             )}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map(g => {
                  const remaining = Math.max(0, g.target - g.current);
                  const pct = g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0;
                  const isDone = remaining === 0 && g.target > 0;
                  return (
                  <div key={g.id} className="dark-card bg-white dk-bg-slate-800 p-6 rounded-3xl border border-slate-200 dk-border-slate-700 shadow-sm relative group flex flex-col">
                     <button onClick={() => deleteWithUndo(goals, setGoals, g.id, 'savings goal')} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>
                     <h4 className="font-bold mb-2 text-slate-900 dk-text-slate-100 pr-8">{g.name}</h4>
                     <p className="text-2xl font-black text-indigo-600 dk-text-indigo-400 mb-4">{formatMoney(g.current)} <span className="text-sm font-semibold text-slate-500 dk-text-slate-400">/ {formatMoney(g.target)}</span></p>
                     <div className="h-3 w-full bg-slate-100 dk-bg-slate-700 rounded-full overflow-hidden mb-2"><div className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{width:`${pct}%`}}></div></div>

                     {}
                     <div className="flex items-baseline justify-between gap-2 mb-4">
                       <p className="text-xs text-slate-600 dk-text-slate-400 font-semibold">{pct.toFixed(1)}% Completed</p>
                       {isDone ? (
                         <p className="text-xs font-bold text-emerald-600 dk-text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Goal reached</p>
                       ) : (
                         <p className="text-xs font-bold text-slate-500 dk-text-slate-400 text-right">
                           <span className="text-amber-600 dk-text-amber-400">{formatMoney(remaining)}</span> left
                         </p>
                       )}
                     </div>

                     {}
                     <div className="mt-auto flex gap-2">
                       <input
                         type="number"
                         min="0"
                         value={goalInputs[g.id] || ''}
                         onChange={e => setGoalInputs({ ...goalInputs, [g.id]: e.target.value })}
                         onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGoalContribution(g.id, 1); } }}
                         placeholder="Add amount"
                         className="flex-1 min-w-0 px-3 py-2 bg-slate-50 dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-sm text-slate-900 dk-text-white font-bold"
                       />
                       <button
                         type="button"
                         onClick={() => addGoalContribution(g.id, -1)}
                         title="Remove this amount"
                         className="px-3 py-2 bg-slate-100 dk-bg-slate-700 hover:bg-slate-200 dk-hover-bg-slate-600 text-slate-600 dk-text-slate-300 font-bold rounded-xl transition-colors"
                       >&minus;</button>
                       <button
                         type="button"
                         onClick={() => addGoalContribution(g.id, 1)}
                         title="Add this amount"
                         className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors"
                       ><Plus className="w-4 h-4" /></button>
                     </div>
                  </div>
                  );
                })}
             </div>
          </div>
        )}

      </main>

      {}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="dark-card bg-white dk-bg-slate-900 rounded-3xl w-full max-w-md p-8 relative shadow-2xl animate-fade-in-up border border-slate-200 dk-border-slate-800">
            <button onClick={() => setShowApiKeyModal(false)} className="absolute top-6 right-6 p-2 bg-slate-100 dk-bg-slate-800 rounded-full hover:bg-slate-200 dk-hover-bg-slate-700 text-slate-700 dk-text-slate-200 transition-colors"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-100 dk-bg-indigo-900-30 rounded-2xl text-indigo-600"><Key className="w-6 h-6" /></div>
              <div><h2 className="text-xl font-bold text-slate-900 dk-text-white">API Key</h2><p className="text-xs text-slate-500 dk-text-slate-400 font-medium">Optional for Magic Add; required for Receipt Scanning</p></div>
            </div>
            <p className="text-sm text-slate-700 dk-text-slate-300 mb-6 font-medium">Your API key is saved strictly in your browser's local storage and is never sent anywhere else.</p>
            <input type="password" value={tempApiKey} onChange={e => setTempApiKey(e.target.value)} placeholder="Use your API key..." className="w-full px-4 py-3 bg-slate-50 dk-bg-slate-800 border border-slate-300 dk-border-slate-700 rounded-xl text-sm mb-6 text-slate-900 dk-text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
            <button onClick={saveApiKey} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md">Save API Key</button>
          </div>
        </div>
      )}

      {}
      {isHeatmapOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setIsHeatmapOpen(false)}>
          <div className="dark-card bg-white dk-bg-slate-900 rounded-3xl w-full max-w-3xl p-8 relative shadow-2xl animate-fade-in-up max-h-[95vh] overflow-y-auto border border-slate-200 dk-border-slate-800">
            <button onClick={() => setIsHeatmapOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-100 dk-bg-slate-800 rounded-full hover:bg-slate-200 dk-hover-bg-slate-700 text-slate-700 dk-text-slate-200 transition-colors"><X className="w-5 h-5" /></button>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-slate-900 dk-text-white"><Calendar className="w-7 h-7 text-indigo-500" /> Daily Spending Heatmap</h2>
            <p className="text-slate-500 dk-text-slate-400 mb-8 font-medium">Visualize spending intensity for {selectedMonth}.</p>
            
            <div className="grid grid-cols-7 gap-2 mb-8 relative">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-sm font-bold text-slate-500 dk-text-slate-400 mb-2">{d}</div>)}
              {heatmapData.map((d, i) => d.empty ? <div key={i} /> : (
                <div key={i} className={`relative group aspect-square rounded-2xl ${getHeatmapColor(d.spent)} flex items-center justify-center cursor-pointer transition-all hover:scale-105`}>
                  <span className={`text-sm ${d.spent > 0 ? 'text-white font-bold' : 'text-slate-500 dk-text-slate-400 font-semibold'}`}>{d.day}</span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700">
                    <span className="opacity-75 mr-2">{d.dateStr}:</span> {formatMoney(d.spent)}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 bg-slate-50 dk-bg-slate-800-50 rounded-2xl border border-slate-200 dk-border-slate-700">
              <h4 className="text-sm font-bold text-slate-900 dk-text-white mb-4 flex items-center gap-2"><Settings className="w-4 h-4"/> Customize Thresholds</h4>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="dark-card flex items-center gap-2 bg-white dk-bg-slate-800 px-3 py-2 rounded-xl shadow-sm border border-slate-200 dk-border-slate-700"><div className="w-4 h-4 bg-emerald-400 rounded-full"></div><span className="text-sm text-slate-500">&le;</span><input type="number" min="0" value={heatmapDraft.green} onChange={e => updateHeatmapDraft('green', e.target.value)} className="w-20 bg-transparent outline-none font-bold text-slate-900 dk-text-white" /></div>
                <div className="dark-card flex items-center gap-2 bg-white dk-bg-slate-800 px-3 py-2 rounded-xl shadow-sm border border-slate-200 dk-border-slate-700"><div className="w-4 h-4 bg-yellow-400 rounded-full"></div><span className="text-sm text-slate-500">&le;</span><input type="number" min="0" value={heatmapDraft.yellow} onChange={e => updateHeatmapDraft('yellow', e.target.value)} className="w-20 bg-transparent outline-none font-bold text-slate-900 dk-text-white" /></div>
                <div className="dark-card flex items-center gap-2 bg-white dk-bg-slate-800 px-3 py-2 rounded-xl shadow-sm border border-slate-200 dk-border-slate-700"><div className="w-4 h-4 bg-orange-400 rounded-full"></div><span className="text-sm text-slate-500">&le;</span><input type="number" min="0" value={heatmapDraft.orange} onChange={e => updateHeatmapDraft('orange', e.target.value)} className="w-20 bg-transparent outline-none font-bold text-slate-900 dk-text-white" /></div>
                <button type="button" onClick={saveHeatmapThresholds} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold">Save</button>
              </div>
              {heatmapValidationError && <p className="mt-3 text-sm font-semibold text-rose-600 dk-text-rose-300" role="alert">{heatmapValidationError}</p>}
            </div>
          </div>
        </div>
      )}

      {}
      {isTrendOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setIsTrendOpen(false)}>
          <div className="dark-card bg-white dk-bg-slate-900 rounded-3xl w-full max-w-4xl p-8 relative shadow-2xl animate-fade-in-up border border-slate-200 dk-border-slate-800">
            <button onClick={() => setIsTrendOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-100 dk-bg-slate-800 rounded-full hover:bg-slate-200 dk-hover-bg-slate-700 text-slate-700 dk-text-slate-200 transition-colors"><X className="w-5 h-5" /></button>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-slate-900 dk-text-white"><BarChart className="w-7 h-7 text-emerald-500" /> 6-Month Trajectory</h2>
            <p className="text-slate-500 dk-text-slate-400 mb-12 font-medium">Compare your cash flow over the previous half-year. The current month updates live, and hovering shows the balance carried over from the month before.</p>

            <div className="flex items-center gap-6 mb-6 text-xs font-bold">
              <span className="flex items-center gap-2 text-slate-600 dk-text-slate-300"><span className="w-7 h-1 rounded-full bg-emerald-500"></span> Income</span>
              <span className="flex items-center gap-2 text-slate-600 dk-text-slate-300"><span className="w-7 h-1 rounded-full bg-rose-500"></span> Expense</span>
            </div>

            <div className="flex gap-3 mt-2 px-2">
              {}
              <div className="w-16 shrink-0 h-52 flex flex-col justify-between text-right text-[10px] font-bold text-slate-400 dk-text-slate-400 -mt-1.5">
                {sixMonthTrend.axisTicks.map((v, i) => <span key={i}>{formatCompactMoney(v)}</span>)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="relative h-52">
                  {}
                  {[25, 50, 75, 100].map(pct => (
                    <div key={pct} className="absolute left-0 right-0 border-t border-dashed border-slate-200 dk-border-slate-700" style={{ bottom: `${pct}%` }}></div>
                  ))}
                  {}
                  <div className="absolute left-0 right-0 bottom-0 border-t-2 border-slate-300 dk-border-slate-600"></div>

                  {}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline points={sixMonthTrend.incomeLine} fill="none" stroke="#10b981" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points={sixMonthTrend.expenseLine} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>

                  {}
                  <div className="absolute inset-0 flex items-end justify-between">
                    {sixMonthTrend.trend.map((t, i) => {
                      const lastIdx = sixMonthTrend.trend.length - 1;
                      // Keep the tooltip inside the card at the two edges.
                      const tipPos = i === 0
                        ? 'left-0'
                        : i === lastIdx
                          ? 'right-0'
                          : 'left-1/2 -translate-x-1/2';
                      const incomePct = (t.income / sixMonthTrend.maxVal) * 100;
                      const expensePct = (t.expense / sixMonthTrend.maxVal) * 100;
                      return (
                        <div key={t.key} className="relative flex-1 h-full flex items-end justify-center gap-1.5 cursor-pointer group">
                          <div className={`absolute top-0 ${tipPos} px-4 py-2.5 bg-slate-900/95 backdrop-blur-sm text-white text-xs font-medium rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-2xl border border-slate-700 w-[185px] z-50`}>
                            <span className="font-bold text-base border-b border-slate-700 pb-1.5 mb-1 flex items-center justify-between gap-3">
                              {t.month}
                              {t.isLive && <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Live</span>}
                            </span>
                            <div className="text-slate-400 flex justify-between gap-3 mt-2"><span className="whitespace-nowrap">Carried in:</span> <span>{formatMoney(t.openingBalance)}</span></div>
                            <div className="text-emerald-400 flex justify-between gap-4"><span className="whitespace-nowrap">Income:</span> <span>{formatMoney(t.income)}</span></div>
                            <div className="text-rose-400 flex justify-between gap-4"><span className="whitespace-nowrap">Expense:</span> <span>{formatMoney(t.expense)}</span></div>
                            <div className="text-indigo-400 flex justify-between gap-4"><span className="whitespace-nowrap">Saved:</span> <span>{formatMoney(t.saved)}</span></div>
                            <div className="text-white font-bold flex justify-between gap-4 pt-2 mt-1 border-t border-slate-700"><span className="whitespace-nowrap">Balance:</span> <span>{formatMoney(t.closingBalance)}</span></div>
                          </div>

                          <div className="w-1/3 max-w-[26px] bg-emerald-400/70 rounded-t-lg transition-all group-hover:bg-emerald-400" style={{ height: `${incomePct}%` }}></div>
                          <div className="w-1/3 max-w-[26px] bg-rose-400/70 rounded-t-lg transition-all group-hover:bg-rose-400" style={{ height: `${expensePct}%` }}></div>

                          {}
                          <div className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dk-border-slate-900 z-30" style={{ bottom: `${incomePct}%` }}></div>
                          <div className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dk-border-slate-900 z-30" style={{ bottom: `${expensePct}%` }}></div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {}
                <div className="flex justify-between mt-4">
                  {sixMonthTrend.trend.map(t => (
                    <div key={t.key} className="flex-1 flex justify-center">
                      <span className={`text-sm font-bold px-4 py-1 rounded-full flex items-center gap-1.5 ${t.isLive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 dk-text-slate-300 bg-slate-100 dk-bg-slate-800'}`}>
                        {t.isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>}
                        {t.month}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {showReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="dark-card bg-white dk-bg-slate-900 rounded-3xl w-full max-w-2xl p-8 relative shadow-2xl animate-fade-in-up border border-slate-200 dk-border-slate-800">
            <button onClick={() => setShowReport(false)} className="absolute top-6 right-6 p-2 bg-slate-100 dk-bg-slate-800 rounded-full hover:bg-slate-200 dk-hover-bg-slate-700 text-slate-700 dk-text-slate-200 transition-colors"><X className="w-5 h-5" /></button>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-slate-900 dk-text-white"><FileText className="w-7 h-7 text-indigo-500" /> Executive Summary <span className="text-base font-semibold text-slate-500 dk-text-slate-400">{monthLabel(selectedMonth)}</span></h2>
            
            {isReportLoading ? (
              <div className="flex flex-col items-center justify-center py-12"><Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" /><p className="font-semibold text-slate-600 dk-text-slate-400">AI is analyzing your data...</p></div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dk-bg-slate-800-50 p-6 rounded-2xl border border-slate-200 dk-border-slate-700">
                  <div><span className="text-sm font-bold text-slate-600 dk-text-slate-400">Income</span><p className="text-xl font-extrabold text-emerald-500">{formatMoney(currentMonthData.income)}</p></div>
                  <div><span className="text-sm font-bold text-slate-600 dk-text-slate-400">Expense</span><p className="text-xl font-extrabold text-rose-500">{formatMoney(currentMonthData.expense)}</p></div>
                  <div><span className="text-sm font-bold text-slate-600 dk-text-slate-400">Saved</span><p className="text-xl font-extrabold text-indigo-500">{formatMoney(currentMonthData.savings)}</p></div>
                  <div><span className="text-sm font-bold text-slate-600 dk-text-slate-400">Savings Rate</span><p className="text-xl font-extrabold text-slate-900 dk-text-white">{currentMonthData.income ? ((currentMonthData.savings/currentMonthData.income)*100).toFixed(1) : 0}%</p></div>
                </div>
                
                {reportError && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dk-bg-amber-900-20 border border-amber-200 dk-border-orange-800-30 text-amber-900 dk-text-amber-300 no-print">
                    <span className="text-lg leading-none">⚠️</span>
                    <p className="text-xs font-semibold leading-relaxed">{reportError}</p>
                  </div>
                )}

                <div className="p-6 bg-indigo-50 dk-bg-indigo-900-20 rounded-2xl border border-indigo-200 dk-border-indigo-800-50">
                  <h3 className="font-bold flex items-center gap-2 mb-4 text-indigo-950 dk-text-indigo-200"><Bot className="w-5 h-5"/> AI Insights</h3>
                  <div className="space-y-4">
                    <p className="text-sm text-slate-800 dk-text-slate-200 leading-relaxed"><strong>Observation:</strong> {reportInsights?.observation}</p>

                    {Array.isArray(reportInsights?.highlights) && reportInsights.highlights.length > 0 && (
                      <ul className="space-y-2">
                        {reportInsights.highlights.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-800 dk-text-slate-200">
                            <CheckCircle className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <p className="text-sm text-slate-800 dk-text-slate-200 leading-relaxed"><strong>Suggestion:</strong> {reportInsights?.suggestion}</p>

                    {reportInsights?.watchOut && (
                      <p className="text-sm text-slate-800 dk-text-slate-200 leading-relaxed"><strong>Watch out:</strong> {reportInsights.watchOut}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={generateDetailedReport} className="flex-1 py-3 bg-slate-100 dk-bg-slate-800 hover:bg-slate-200 dk-hover-bg-slate-700 text-slate-800 dk-text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 no-print"><RefreshCw className="w-4 h-4" /> Regenerate</button>
                  <button onClick={() => window.print()} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md no-print">Download as PDF</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 text-sm font-semibold animate-fade-in-up border border-slate-700">
          <span>{toast.message}</span>
          {toast.undoAction && <button onClick={toast.undoAction} className="text-indigo-400 font-bold hover:text-indigo-300 flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Undo</button>}
        </div>
      )}

    </div>
  );
}
