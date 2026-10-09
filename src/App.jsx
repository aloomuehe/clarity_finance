import { useState, useEffect, useMemo, useRef } from 'react';
import {
  DollarSign,
  Activity,
  Moon,
  Sun,
  Download,
  Key,
  Upload,
  DownloadCloud,
  RefreshCw,
  LayoutDashboard,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Landmark,
  Target,
  Search,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import './App.css';
import { getTodayStr, getMonthString, monthLabel, sanitizeDate } from './utils/dates';
import { loadLS, saveLS } from './utils/storage';
import { formatCompactCurrency, formatCurrency } from './utils/formatting';
import {
  aggregateMonthlyData,
  calculateBalance,
  getAvailableBalance as getAvailableBalanceUtil,
  calculateDaysRemainingInfo,
  calculateElapsedDays,
  calculateExpensesByCategory,
  calculateFinancialHealth,
  calculateFrequentCategory,
  calculateNoSpendStreak,
  calculateProjections,
  calculateSixMonthTrend,
  calculateWarnings,
  filterTransactions,
  generateHeatmapData,
  getMonthData,
  isValidHeatmapThresholds,
  loadHeatmapThresholds,
  processRecurringExpenses,
} from './utils/calculations';
import {
  CURRENCIES,
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  MAX_MONEY_AMOUNT,
  PAYMENT_METHODS,
} from './constants/finance';
import { scanReceipt } from './services/receiptScanner';
import { processMagicAdd } from './services/magicAdd';
import { generateMonthlyReport } from './services/reports';

import Dashboard from './components/Dashboard';
import TransactionsPage from './components/TransactionsPage';
import Forecast from './components/Forecast';
import Loans from './components/Loans';
import Goals from './components/Goals';
import Reports from './components/Reports';
import MonthPicker from './components/MonthPicker';
import AiSettingsModal from './components/AiSettingsModal';
import HeatmapModal from './components/HeatmapModal';
import TrendModal from './components/TrendModal';
import BulkAddModal from './components/BulkAddModal';
import ReceiptReviewModal from './components/ReceiptReviewModal';
import MonthlyFinancialReport from './components/MonthlyFinancialReport';
import { validateBulkBatch } from './utils/bulkValidation';
import {
  loadAIProvider,
  saveAIProvider,
  loadProxyConfigs,
  saveProxyConfigs,
  loadActiveProxyId,
  saveActiveProxyId,
  getActiveProxy,
  deleteProxyConfig,
} from './utils/proxyStorage';

const applyTheme = (dark) => {
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('clarity_theme');
    const dark = saved !== null ? saved === 'dark' : false;
    applyTheme(dark);
    return dark;
  });

  const [transactionAnimation, setTransactionAnimation] = useState(null);

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('clarity_api_key') || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  const [aiProvider, setAiProvider] = useState(loadAIProvider);
  const [proxyConfigs, setProxyConfigs] = useState(loadProxyConfigs);
  const [activeProxyId, setActiveProxyId] = useState(loadActiveProxyId);

  const activeProxy = useMemo(() => getActiveProxy(proxyConfigs, activeProxyId), [proxyConfigs, activeProxyId]);
  const aiConfig = useMemo(() => ({
    provider: aiProvider,
    apiKey,
    activeProxy,
  }), [aiProvider, apiKey, activeProxy]);

  const handleSelectProvider = (newProvider) => {
    setAiProvider(newProvider);
    saveAIProvider(newProvider);
  };

  const handleSaveProxyConfig = (config) => {
    setProxyConfigs(prev => {
      const existingIdx = prev.findIndex(c => c.id === config.id);
      let updated;
      if (existingIdx !== -1) {
        updated = [...prev];
        updated[existingIdx] = config;
      } else {
        updated = [...prev, config];
      }
      saveProxyConfigs(updated);
      return updated;
    });
    if (!activeProxyId) {
      setActiveProxyId(config.id);
      saveActiveProxyId(config.id);
    }
    setToast({ message: `Proxy "${config.name}" saved.` });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteProxyConfig = (idToDelete) => {
    const target = proxyConfigs.find(c => c.id === idToDelete);
    const { updatedConfigs, newActiveId } = deleteProxyConfig(proxyConfigs, activeProxyId, idToDelete);
    setProxyConfigs(updatedConfigs);
    saveProxyConfigs(updatedConfigs);
    setActiveProxyId(newActiveId);
    saveActiveProxyId(newActiveId);
    setToast({ message: `Proxy "${target?.name || 'configuration'}" deleted.` });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSetActiveProxy = (id) => {
    setActiveProxyId(id);
    saveActiveProxyId(id);
    const target = proxyConfigs.find(c => c.id === id);
    setToast({ message: `Active proxy set to "${target?.name || 'Selected'}".` });
    setTimeout(() => setToast(null), 3000);
  };

  const [transactions, setTransactions] = useState(() => {
    const loaded = loadLS('transactions', []);
    if (!Array.isArray(loaded)) return [];
    return loaded.filter(t => t && typeof t === 'object' && (t.type === 'income' || t.type === 'expense')).map(t => ({
      ...t,
      amount: Math.abs(Number(t.amount) || 0),
    }));
  });

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: 'food',
    paymentMethod: 'upi',
    date: getTodayStr(),
    note: '',
  });
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

  const [recurring, setRecurring] = useState(() => {
    const saved = loadLS('recurring', []);
    if (!Array.isArray(saved)) return [];
    return saved.filter(r => r && typeof r === 'object').map((r, i) => (r && r.id ? r : { ...r, id: `recurring-legacy-${i + 1}` }));
  });
  const [processedRecurring, setProcessedRecurring] = useState(() => loadLS('recurring_processed', []));
  const [recurringErrors, setRecurringErrors] = useState([]);
  const [planned, setPlanned] = useState(() => {
    const loaded = loadLS('planned', []);
    if (!Array.isArray(loaded)) return [];
    return loaded.filter(p => p && typeof p === 'object').map(p => ({
      ...p,
      amount: Math.abs(Number(p.amount) || 0),
    }));
  });
  const [recurringForm, setRecurringForm] = useState({ name: '', amount: '', day: '1', category: 'utilities' });
  const [plannedForm, setPlannedForm] = useState({ name: '', amount: '', date: getTodayStr(), category: 'other_expense' });
  const [editingRecurringId, setEditingRecurringId] = useState(null);
  const [editingPlannedId, setEditingPlannedId] = useState(null);

  const [loans, setLoans] = useState(() => {
    const loaded = loadLS('loans', []);
    if (!Array.isArray(loaded)) return [];
    return loaded.filter(l => l && typeof l === 'object').map(l => ({
      ...l,
      amount: Math.abs(Number(l.amount) || 0),
      amountPaid: Math.min(Math.abs(Number(l.amount) || 0), Math.max(0, Number(l.amountPaid) || 0)),
    }));
  });
  const [loanForm, setLoanForm] = useState({ type: 'lent', person: '', amount: '', date: getTodayStr(), note: '' });
  const [paymentInputs, setPaymentInputs] = useState({});

  const [goals, setGoals] = useState(() => {
    const loaded = loadLS('goals', []);
    if (!Array.isArray(loaded)) return [];
    return loaded.filter(g => g && typeof g === 'object').map(g => ({
      ...g,
      target: Math.abs(Number(g.target) || 0),
      current: Math.min(Math.abs(Number(g.target) || 0), Math.max(0, Number(g.current) || 0)),
    }));
  });
  const [goalForm, setGoalForm] = useState({ name: '', target: '', current: '' });
  const [goalInputs, setGoalInputs] = useState({});

  const [magicPrompt, setMagicPrompt] = useState('');
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);
  const magicIdRef = useRef(0);
  const nextId = (prefix) => `${prefix}-${Date.now()}-${magicIdRef.current += 1}`;

  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);

  const [showReport, setShowReport] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportInsights, setReportInsights] = useState(null);
  const [reportError, setReportError] = useState(null);

  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);
  const [isTrendOpen, setIsTrendOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [receiptReviewData, setReceiptReviewData] = useState(null);
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
  useEffect(() => { saveLS('recurring_processed', processedRecurring); }, [processedRecurring]);
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

  const monthlyData = useMemo(() => aggregateMonthlyData(transactions), [transactions]);

  const { currentMonthData, previousMonthData, highestSavingsMonth } = useMemo(
    () => getMonthData(monthlyData, selectedMonth),
    [monthlyData, selectedMonth]
  );

  const { balance } = useMemo(() => calculateBalance(transactions), [transactions]);

  const getAvailableBalance = (excludeTransactionId = null) => {
    return getAvailableBalanceUtil(transactions, excludeTransactionId);
  };

  // Automatically process recurring expenses when due
  useEffect(() => {
    const available = calculateBalance(transactions).balance;
    const { newTransactions, newProcessedKeys, blockedExpenses } = processRecurringExpenses({
      recurring,
      transactions,
      processedRecurring,
      todayStr: getTodayStr(),
      availableBalance: available,
      generateId: nextId,
    });

    if (newTransactions.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTransactions(prev => [...newTransactions, ...prev]);
      setProcessedRecurring(prev => [...prev, ...newProcessedKeys]);
    }

    setRecurringErrors(prev => {
      if (prev.length === 0 && blockedExpenses.length === 0) return prev;
      const prevKeys = prev.map(e => `${e.recurringId}:${e.required}`).join('|');
      const nextKeys = blockedExpenses.map(e => `${e.recurringId}:${e.required}`).join('|');
      return prevKeys === nextKeys ? prev : blockedExpenses;
    });
  }, [recurring, transactions, processedRecurring]);

  const displayTransactions = useMemo(
    () => filterTransactions(transactions, selectedMonth, filter, searchQuery, INCOME_SOURCES, EXPENSE_CATEGORIES),
    [transactions, selectedMonth, filter, searchQuery]
  );

  const monthTransactions = useMemo(
    () => filterTransactions(transactions, selectedMonth, 'all', '', INCOME_SOURCES, EXPENSE_CATEGORIES),
    [transactions, selectedMonth]
  );

  const expensesByCategory = useMemo(
    () => calculateExpensesByCategory(displayTransactions, currentMonthData.expense, EXPENSE_CATEGORIES),
    [displayTransactions, currentMonthData.expense]
  );

  const reportExpensesByCategory = useMemo(
    () => calculateExpensesByCategory(monthTransactions, currentMonthData.expense, EXPENSE_CATEGORIES),
    [monthTransactions, currentMonthData.expense]
  );

  const warnings = useMemo(
    () => calculateWarnings(currentMonthData, monthlyTarget, categoryTargets, currency, EXPENSE_CATEGORIES, recurringErrors),
    [currentMonthData, monthlyTarget, categoryTargets, currency, recurringErrors]
  );

  const noSpendStreak = useMemo(() => calculateNoSpendStreak(transactions), [transactions]);

  const frequentCategory = useMemo(
    () => calculateFrequentCategory(displayTransactions, EXPENSE_CATEGORIES),
    [displayTransactions]
  );

  // Days elapsed in the selected month (full month length for past months).
  const elapsedDays = useMemo(() => calculateElapsedDays(selectedMonth), [selectedMonth]);
  const dailyAverage = currentMonthData.expense / elapsedDays;

  const daysRemainingInfo = useMemo(() => calculateDaysRemainingInfo(selectedMonth), [selectedMonth]);

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

  const projections = useMemo(
    () => calculateProjections(recurring, planned, transactions, balance, currentMonthData, selectedMonth),
    [recurring, planned, transactions, balance, currentMonthData, selectedMonth]
  );

  const financialHealth = useMemo(
    () => calculateFinancialHealth(currentMonthData, monthlyTarget, recurring, loans, goals),
    [currentMonthData, monthlyTarget, recurring, loans, goals]
  );

  const heatmapData = useMemo(() => generateHeatmapData(transactions, selectedMonth), [transactions, selectedMonth]);

  const getHeatmapColor = (spent, dateStr) => {
    const todayStr = getTodayStr();
    if (spent > 0) {
      if (spent <= heatmapThresholds.green) return 'bg-emerald-400 dk-bg-emerald-500';
      if (spent <= heatmapThresholds.yellow) return 'bg-yellow-400 dk-bg-yellow-500';
      if (spent <= heatmapThresholds.orange) return 'bg-orange-400 dk-bg-orange-500';
      return 'bg-rose-500 dk-bg-rose-600';
    }
    // spent === 0
    if (dateStr && dateStr > todayStr) {
      return 'bg-slate-100 dk-bg-slate-800-50';
    }
    return 'bg-emerald-400 dk-bg-emerald-500';
  };

  const sixMonthTrend = useMemo(() => calculateSixMonthTrend(monthlyData, selectedMonth), [monthlyData, selectedMonth]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'type' && { category: value === 'expense' ? 'food' : 'salary' }),
    }));
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

    const grossAmount = Math.abs(Number(formData.amount));
    if (formData.type === 'expense') {
      const available = getAvailableBalance(editingId);
      if (grossAmount > available) {
        setToast({ message: `Insufficient balance. You only have ${formatMoney(available)} available.` });
        return;
      }
    }
    if (formData.type === 'income' && editingId) {
      const availableWithout = getAvailableBalance(editingId);
      if (availableWithout + grossAmount < 0) {
        setToast({ message: `Cannot reduce income below already spent balance. Minimum required: ${formatMoney(Math.abs(availableWithout))}.` });
        return;
      }
    }
    let amountNum = grossAmount;
    let splitLoan = null;
    if (formData.type === 'expense' && isSplit && splitDetails.amount && splitDetails.person && !editingId) {
      const splitAmt = Number(splitDetails.amount);
      if (Number.isFinite(splitAmt) && splitAmt > 0 && splitAmt < amountNum && splitAmt <= MAX_MONEY_AMOUNT && splitDetails.person.trim()) {
        splitLoan = {
          id: nextId('split-loan'),
          type: 'lent',
          person: splitDetails.person.trim(),
          amount: splitAmt,
          amountPaid: 0,
          date: formData.date,
          note: `Split: ${formData.note || 'Expense'}`,
        };
      }
    }

    const existingTx = editingId ? transactions.find(t => t.id === editingId) : null;
    const newTransaction = {
      id: editingId ? editingId : nextId('transaction'),
      ...formData,
      amount: splitLoan ? grossAmount : amountNum,
      ...(splitLoan && { linkedLoanId: splitLoan.id, loanMovement: 'principal' }),
      ...(existingTx?.recurringId && { recurringId: existingTx.recurringId }),
      ...(existingTx?.recurringOccurrence && { recurringOccurrence: existingTx.recurringOccurrence }),
      ...(existingTx?.isRecurring && { isRecurring: existingTx.isRecurring }),
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
    if (!tToDelete) return;

    if (tToDelete.type === 'income') {
      const availableWithout = getAvailableBalance(id);
      if (availableWithout < 0) {
        setToast({ message: `Cannot delete income: funds have already been spent (would leave balance at ${formatMoney(availableWithout)}).` });
        setTimeout(() => setToast(null), 4000);
        return;
      }
    }

    if (tToDelete?.recurringId && tToDelete?.recurringOccurrence) {
      const key = `${tToDelete.recurringId}:${tToDelete.recurringOccurrence}`;
      setProcessedRecurring(prev => (prev.includes(key) ? prev : [...prev, key]));
    }
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
        setTransactions(prev => [tToDelete, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
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
    setFormData({
      type: transaction.type,
      amount: Math.abs(Number(transaction.amount) || 0),
      category: transaction.category,
      paymentMethod: transaction.paymentMethod || 'upi',
      date: transaction.date,
      note: transaction.note || '',
    });
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
    const cleanDate = sanitizeDate(loanForm.date, '') || (/^\d{4}-\d{2}-\d{2}$/.test(loanForm.date) ? loanForm.date : getTodayStr());
    if (!cleanDate) {
      setToast({ message: 'Enter a valid date (YYYY-MM-DD).' });
      return;
    }
    const loanId = nextId('loan');
    const transactionId = nextId('loan-cash');
    const isLent = loanForm.type === 'lent';
    if (isLent) {
      const available = getAvailableBalance();
      if (amount > available) {
        setToast({ message: `Insufficient balance. You only have ${formatMoney(available)} available.` });
        return;
      }
    }
    const cleanNote = typeof loanForm.note === 'string' ? loanForm.note.trim() : '';
    const personTrimmed = loanForm.person.trim();
    const cashTransaction = {
      id: transactionId,
      type: isLent ? 'expense' : 'income',
      amount,
      category: isLent ? 'other_expense' : 'other_income',
      paymentMethod: 'bank',
      date: cleanDate,
      note: cleanNote
        ? `${isLent ? 'Loan to' : 'Loan from'} ${personTrimmed} (${cleanNote})`
        : `${isLent ? 'Loan to' : 'Loan from'} ${personTrimmed}`,
      linkedLoanId: loanId,
      loanMovement: 'principal',
    };
    const loan = {
      id: loanId,
      type: loanForm.type,
      person: personTrimmed,
      amount,
      amountPaid: 0,
      date: cleanDate,
      note: cleanNote,
      principalTransactionId: transactionId,
      cashTransactionIds: [transactionId],
      repaymentTransactionIds: [],
    };
    setTransactions(prev => [cashTransaction, ...prev]);
    setLoans(prev => [loan, ...prev]);
    setLoanForm({ type: 'lent', person: '', amount: '', date: getTodayStr(), note: '' });
    setSelectedMonth(getMonthString(cleanDate));
    setToast({ message: `${isLent ? 'Loan recorded as an expense' : 'Borrowed money recorded as income'}.` });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEditLoan = (loanId, updatedLoanData) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) {
      setToast({ message: 'Loan not found.' });
      setTimeout(() => setToast(null), 3000);
      return false;
    }

    const trimmedPerson = typeof updatedLoanData?.person === 'string' ? updatedLoanData.person.trim() : '';
    if (!trimmedPerson) {
      setToast({ message: 'Please enter a person or entity name.' });
      setTimeout(() => setToast(null), 3000);
      return false;
    }

    const newAmount = Number(updatedLoanData?.amount);
    if (!Number.isFinite(newAmount) || newAmount <= 0 || newAmount > MAX_MONEY_AMOUNT) {
      setToast({ message: `Enter a positive amount up to ${formatMoney(MAX_MONEY_AMOUNT)}.` });
      setTimeout(() => setToast(null), 3000);
      return false;
    }

    const cleanDate = sanitizeDate(updatedLoanData?.date, '') || (/^\d{4}-\d{2}-\d{2}$/.test(updatedLoanData?.date) ? updatedLoanData.date : '');
    if (!cleanDate) {
      setToast({ message: 'Please enter a valid loan date (YYYY-MM-DD).' });
      setTimeout(() => setToast(null), 3000);
      return false;
    }

    const cleanNote = typeof updatedLoanData?.note === 'string' ? updatedLoanData.note.trim() : '';
    const currentPaid = Math.max(0, Number(loan.amountPaid) || 0);

    // Rule: Cannot edit loan amount to be less than the amount already repaid
    if (newAmount < currentPaid) {
      setToast({ message: `Loan amount cannot be less than the amount already repaid (${formatMoney(currentPaid)}).` });
      setTimeout(() => setToast(null), 4000);
      return false;
    }

    // Locate linked principal transaction
    let principalTx = null;
    if (loan.principalTransactionId) {
      principalTx = transactions.find(t => t.id === loan.principalTransactionId);
    }
    if (!principalTx) {
      principalTx = transactions.find(t => t.linkedLoanId === loan.id && t.loanMovement === 'principal');
    }
    if (!principalTx) {
      principalTx = transactions.find(t => t.linkedLoanId === loan.id && t.type === (loan.type === 'lent' ? 'expense' : 'income'));
    }

    // Available balance validation if principal transaction exists
    if (principalTx) {
      const isLent = loan.type === 'lent';
      const availableWithout = getAvailableBalanceUtil(transactions, principalTx.id);

      if (isLent) {
        if (newAmount > availableWithout) {
          setToast({ message: `Insufficient balance. You only have ${formatMoney(availableWithout)} available for this loan.` });
          setTimeout(() => setToast(null), 4000);
          return false;
        }
      } else {
        const resultingBalance = availableWithout + newAmount;
        if (resultingBalance < 0) {
          setToast({ message: `Cannot reduce borrowed amount: funds have already been spent (would leave balance at ${formatMoney(resultingBalance)}). Minimum required: ${formatMoney(Math.abs(availableWithout))}.` });
          setTimeout(() => setToast(null), 4000);
          return false;
        }
      }
    }

    const isLent = loan.type === 'lent';
    const oldPerson = loan.person;

    // Update transactions:
    // 1. Update principal transaction amount, date, and note in place
    // 2. Update repayment transaction notes with new person name (preserve repayment dates and amounts)
    setTransactions(prev => prev.map(t => {
      if (principalTx && t.id === principalTx.id) {
        return {
          ...t,
          amount: newAmount,
          date: cleanDate,
          note: cleanNote
            ? `${isLent ? 'Loan to' : 'Loan from'} ${trimmedPerson} (${cleanNote})`
            : `${isLent ? 'Loan to' : 'Loan from'} ${trimmedPerson}`,
        };
      }
      if (t.linkedLoanId === loan.id && t.loanMovement === 'repayment') {
        const repPrefix = isLent ? 'Repayment from' : 'Repayment to';
        return {
          ...t,
          note: t.note && oldPerson && t.note.includes(oldPerson)
            ? t.note.replaceAll(oldPerson, trimmedPerson)
            : (t.note || `${repPrefix} ${trimmedPerson}`),
        };
      }
      return t;
    }));

    // Update loan record
    const updatedLoan = {
      ...loan,
      person: trimmedPerson,
      amount: newAmount,
      date: cleanDate,
      note: cleanNote,
      principalTransactionId: principalTx ? principalTx.id : (loan.principalTransactionId || null),
      cashTransactionIds: loan.cashTransactionIds || (principalTx ? [principalTx.id] : []),
      repaymentTransactionIds: loan.repaymentTransactionIds || [],
    };

    setLoans(prev => prev.map(l => l.id === loan.id ? updatedLoan : l));
    setSelectedMonth(getMonthString(cleanDate));
    setToast({ message: 'Loan updated successfully.' });
    setTimeout(() => setToast(null), 3000);
    return true;
  };

  const deleteLoanWithUndo = (loan) => {
    const linkedIds = new Set(loan.cashTransactionIds || []);
    if (loan.principalTransactionId) linkedIds.add(loan.principalTransactionId);
    (loan.repaymentTransactionIds || []).forEach(id => linkedIds.add(id));
    transactions.forEach(t => {
      if (t.linkedLoanId === loan.id) linkedIds.add(t.id);
    });
    const linkedTransactions = transactions.filter(transaction => linkedIds.has(transaction.id));

    // Guard: deleting a borrowed loan removes income; verify balance does not drop negative
    const resultingBalance = getAvailableBalanceUtil(transactions, linkedIds);
    if (resultingBalance < 0) {
      setToast({ message: `Cannot delete loan: borrowed funds have already been spent (would leave balance at ${formatMoney(resultingBalance)}).` });
      setTimeout(() => setToast(null), 4000);
      return;
    }

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
    if (!isLent) {
      const available = getAvailableBalance();
      if (payment > available) {
        setToast({ message: `Insufficient balance. You only have ${formatMoney(available)} available.` });
        return;
      }
    }
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
    const data = {
      transactions,
      loans,
      goals,
      categoryTargets,
      recurring,
      planned,
      monthlyTarget,
      currency,
      selectedMonth,
      heatmapThresholds,
      processedRecurring,
    };
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
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setToast({ message: 'Backup file is too large (max 20MB).' });
      setTimeout(() => setToast(null), 4000);
      if (e.target) e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data || typeof data !== 'object' || !Array.isArray(data.transactions)) throw new Error('Invalid backup format');
        const isStoredDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());

        // Stage & validate transactions with ID de-duplication
        const seenTxIds = new Set();
        const stagedTransactions = [];
        for (const item of data.transactions) {
          if (!item || typeof item !== 'object') continue;
          if (item.type !== 'income' && item.type !== 'expense') continue;
          const amt = Number(item.amount);
          if (!Number.isFinite(amt) || amt <= 0 || amt > MAX_MONEY_AMOUNT) continue;
          if (!isStoredDate(item.date)) continue;

          let id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : null;
          if (!id || seenTxIds.has(id)) {
            id = nextId('tx-import');
          }
          seenTxIds.add(id);

          stagedTransactions.push({
            id,
            type: item.type,
            amount: amt,
            category: typeof item.category === 'string' ? item.category : (item.type === 'income' ? 'other_income' : 'other_expense'),
            date: item.date,
            paymentMethod: typeof item.paymentMethod === 'string' ? item.paymentMethod : 'upi',
            note: typeof item.note === 'string' ? item.note : '',
            ...(item.linkedLoanId && { linkedLoanId: item.linkedLoanId }),
            ...(item.loanMovement && { loanMovement: item.loanMovement }),
            ...(item.recurringId && { recurringId: item.recurringId }),
            ...(item.recurringOccurrence && { recurringOccurrence: item.recurringOccurrence }),
            ...(item.isRecurring && { isRecurring: true }),
          });
        }
        if (data.transactions.length > 0 && stagedTransactions.length === 0) {
          throw new Error('No valid transactions in backup');
        }

        // Stage & validate loans
        let stagedLoans = null;
        if (Array.isArray(data.loans)) {
          stagedLoans = data.loans.filter(item => {
            if (!item || typeof item !== 'object') return false;
            if (item.type !== 'lent' && item.type !== 'borrowed') return false;
            const amt = Number(item.amount);
            return Number.isFinite(amt) && amt > 0 && amt <= MAX_MONEY_AMOUNT && typeof item.person === 'string' && item.person.trim();
          }).map(item => {
            const amt = Number(item.amount);
            return {
              id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : nextId('loan-import'),
              type: item.type,
              person: item.person.trim(),
              amount: amt,
              amountPaid: Math.min(amt, Math.max(0, Number(item.amountPaid) || 0)),
              date: isStoredDate(item.date) ? item.date : getTodayStr(),
              note: typeof item.note === 'string' ? item.note : '',
              principalTransactionId: item.principalTransactionId || null,
              cashTransactionIds: Array.isArray(item.cashTransactionIds) ? item.cashTransactionIds.filter(Boolean) : [],
              repaymentTransactionIds: Array.isArray(item.repaymentTransactionIds) ? item.repaymentTransactionIds.filter(Boolean) : [],
            };
          });
        }

        // Stage & validate goals
        let stagedGoals = null;
        if (Array.isArray(data.goals)) {
          stagedGoals = data.goals.filter(item => {
            if (!item || typeof item !== 'object') return false;
            const target = Number(item.target);
            return typeof item.name === 'string' && item.name.trim() && Number.isFinite(target) && target > 0 && target <= MAX_MONEY_AMOUNT;
          }).map(item => {
            const target = Number(item.target);
            return {
              id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : nextId('goal-import'),
              name: item.name.trim(),
              target,
              current: Math.min(target, Math.max(0, Number(item.current) || 0)),
            };
          });
        }

        // Stage categoryTargets
        let stagedCategoryTargets = null;
        if (data.categoryTargets && typeof data.categoryTargets === 'object' && !Array.isArray(data.categoryTargets)) {
          stagedCategoryTargets = Object.fromEntries(
            Object.entries(data.categoryTargets)
              .filter(([, value]) => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= MAX_MONEY_AMOUNT)
              .map(([key, value]) => [key, Number(value)])
          );
        }

        // Stage recurring
        let stagedRecurring = null;
        if (Array.isArray(data.recurring)) {
          stagedRecurring = data.recurring.filter(item => {
            if (!item || typeof item !== 'object') return false;
            const amt = Number(item.amount);
            const day = Number(item.day);
            return typeof item.name === 'string' && item.name.trim() && Number.isFinite(amt) && amt > 0 && amt <= MAX_MONEY_AMOUNT && Number.isInteger(day) && day >= 1 && day <= 31;
          }).map((item, i) => ({
            id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `recurring-${i + 1}`,
            name: item.name.trim(),
            amount: Number(item.amount),
            day: Number(item.day),
            category: typeof item.category === 'string' ? item.category : 'utilities',
          }));
        }

        // Stage planned
        let stagedPlanned = null;
        if (Array.isArray(data.planned)) {
          stagedPlanned = data.planned.filter(item => {
            if (!item || typeof item !== 'object') return false;
            const amt = Number(item.amount);
            return typeof item.name === 'string' && item.name.trim() && Number.isFinite(amt) && amt > 0 && amt <= MAX_MONEY_AMOUNT && isStoredDate(item.date);
          }).map(item => ({
            id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : nextId('planned-import'),
            name: item.name.trim(),
            amount: Number(item.amount),
            date: item.date,
            category: typeof item.category === 'string' ? item.category : 'other_expense',
          }));
        }

        // Stage processedRecurring
        let stagedProcessedRecurring = null;
        if (Array.isArray(data.processedRecurring)) {
          stagedProcessedRecurring = data.processedRecurring.filter(item => typeof item === 'string');
        } else {
          stagedProcessedRecurring = stagedTransactions
            .filter(item => item?.recurringId && item?.recurringOccurrence)
            .map(item => `${item.recurringId}:${item.recurringOccurrence}`);
        }

        // Stage scalar settings
        const stagedMonthlyTarget = (Number.isFinite(Number(data.monthlyTarget)) && Number(data.monthlyTarget) >= 0 && Number(data.monthlyTarget) <= MAX_MONEY_AMOUNT)
          ? Number(data.monthlyTarget)
          : null;
        const stagedCurrency = CURRENCIES.some(item => item.code === data.currency) ? data.currency : null;
        const stagedSelectedMonth = (typeof data.selectedMonth === 'string' && /^\d{4}-\d{2}$/.test(data.selectedMonth))
          ? data.selectedMonth
          : null;
        const stagedHeatmap = isValidHeatmapThresholds(data.heatmapThresholds)
          ? { green: Number(data.heatmapThresholds.green), yellow: Number(data.heatmapThresholds.yellow), orange: Number(data.heatmapThresholds.orange) }
          : null;

        // ATOMIC COMMIT: Apply all updates only after all staged validations succeed
        setTransactions(stagedTransactions);
        if (stagedLoans !== null) setLoans(stagedLoans);
        if (stagedGoals !== null) setGoals(stagedGoals);
        if (stagedCategoryTargets !== null) setCategoryTargets(stagedCategoryTargets);
        if (stagedRecurring !== null) setRecurring(stagedRecurring);
        if (stagedPlanned !== null) setPlanned(stagedPlanned);
        if (stagedProcessedRecurring !== null) setProcessedRecurring(stagedProcessedRecurring);
        if (stagedMonthlyTarget !== null) setMonthlyTarget(stagedMonthlyTarget);
        if (stagedCurrency !== null) setCurrency(stagedCurrency);
        if (stagedSelectedMonth !== null) setSelectedMonth(stagedSelectedMonth);
        if (stagedHeatmap !== null) {
          setHeatmapThresholds(stagedHeatmap);
          setHeatmapDraft(stagedHeatmap);
        }

        setToast({ message: 'Backup completely restored!' });
      } catch {
        setToast({ message: 'Invalid backup file!' });
      } finally {
        if (e.target) e.target.value = '';
        setTimeout(() => setToast(null), 4000);
      }
    };
    reader.onerror = () => {
      setToast({ message: 'Failed to read backup file.' });
      setTimeout(() => setToast(null), 4000);
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    document.title = `Clarity Finance - Monthly Report (${monthLabel(selectedMonth)})`;
  }, [selectedMonth]);

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      setToast({ message: 'Printing blocked by browser. Press Ctrl+P or Cmd+P.' });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleFileUpload = async (e) => {
    const isProxy = aiProvider === 'proxy';
    const isConfigured = isProxy ? Boolean(activeProxy) : Boolean(apiKey);
    if (!isConfigured) {
      setShowApiKeyModal(true);
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setToast({ message: 'Receipt image exceeds 15MB limit.' });
      setTimeout(() => setToast(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const isImage = file.type?.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif)$/i.test(file.name);
    if (!isImage) {
      setToast({ message: 'Please upload a valid image file (PNG, JPG, WebP).' });
      setTimeout(() => setToast(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsScanning(true);
    const today = getTodayStr();
    try {
      const res = await scanReceipt(file, aiConfig, today, EXPENSE_CATEGORIES);
      if (res.success) {
        if (res.data?.items && res.data.items.length > 0) {
          setReceiptReviewData(res.data);
        } else {
          setToast({ message: 'No items detected on this receipt.' });
        }
      } else {
        setToast({ message: `Failed to scan receipt: ${res.error}` });
      }
    } catch {
      setToast({ message: 'Could not read the receipt image.' });
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleMagicAdd = async () => {
    const prompt = magicPrompt.trim();
    if (!prompt) return;

    setIsMagicLoading(true);
    const today = getTodayStr();

    const res = await processMagicAdd({
      prompt,
      apiKey,
      today,
      incomeSources: INCOME_SOURCES,
      expenseCategories: EXPENSE_CATEGORIES,
      paymentMethods: PAYMENT_METHODS,
    });

    if (!res.success) {
      setIsMagicLoading(false);
      setToast({ message: res.error });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    const { data: draft, aiError } = res;
    if (draft.type === 'expense') {
      const available = getAvailableBalance();
      if (draft.amount > available) {
        setIsMagicLoading(false);
        setToast({ message: `Insufficient balance. You only have ${formatMoney(available)} available.` });
        setTimeout(() => setToast(null), 4000);
        return;
      }
    }
    const newT = {
      id: nextId('magic'),
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

  const handleBulkAdd = () => {
    setIsBulkAddOpen(true);
  };

  const handleCommitBulkTransactions = (selectedRows) => {
    if (!selectedRows || selectedRows.length === 0) return;

    // Atomic validation right before committing to state
    const finalValidation = validateBulkBatch(selectedRows, transactions, formatMoney);
    if (!finalValidation.isValid || finalValidation.errorCount > 0) {
      setToast({ message: 'Validation failed. Some transactions could not be committed.' });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    const newTransactions = selectedRows.map(row => ({
      id: nextId('transaction'),
      type: row.type === 'income' ? 'income' : 'expense',
      amount: Math.abs(Number(row.amount)),
      category: row.category,
      paymentMethod: row.paymentMethod || 'upi',
      date: row.date,
      note: (row.note || '').trim(),
    }));

    setTransactions(prev => [...newTransactions, ...prev]);

    // Update selectedMonth to the latest transaction's month
    const sortedByDate = [...newTransactions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (sortedByDate[0]?.date) {
      setSelectedMonth(getMonthString(sortedByDate[0].date));
    }
    setFilter('all');
    setSearchQuery('');

    if (newTransactions.length === 1) {
      setTransactionAnimation({ type: newTransactions[0].type, amount: newTransactions[0].amount, id: newTransactions[0].id });
      setTimeout(() => setTransactionAnimation(null), 1800);
    }

    setToast({
      message: `Successfully added ${newTransactions.length} transaction${newTransactions.length === 1 ? '' : 's'}.`,
    });
    setTimeout(() => setToast(null), 4000);
  };

  const handleGenerateReport = async () => {
    setShowReport(true);
    setIsReportLoading(true);
    setReportError(null);
    setReportInsights(null);

    const res = await generateMonthlyReport({
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
      expenseCategories: EXPENSE_CATEGORIES,
      paymentMethods: PAYMENT_METHODS,
    });

    setReportInsights(res.insights);
    setReportError(res.error);
    setIsReportLoading(false);
  };

  const formatCompactMoney = (amount) => formatCompactCurrency(amount, currency);
  const formatMoney = (amount) => formatCurrency(amount, currency);
  const CurrencyIcon = CURRENCIES.find(c => c.code === currency)?.icon || DollarSign;

  return (
    <div className="theme-container min-h-screen bg-slate-50 dk-bg-slate-900 text-slate-900 dk-text-slate-100 font-sans transition-colors duration-300 selection:bg-indigo-100 dk-selection-bg-indigo-900-50 selection:text-indigo-900 dk-selection-text-indigo-100 print-container">

      <MonthlyFinancialReport
        selectedMonth={selectedMonth}
        monthLabel={monthLabel}
        currentMonthData={currentMonthData}
        previousMonthData={previousMonthData}
        balance={balance}
        monthlyTarget={monthlyTarget}
        categoryTargets={categoryTargets}
        financialHealth={financialHealth}
        dailyAverage={dailyAverage}
        noSpendStreak={noSpendStreak}
        daysRemainingInfo={daysRemainingInfo}
        frequentCategory={frequentCategory}
        expensesByCategory={reportExpensesByCategory}
        monthTransactions={monthTransactions}
        reportInsights={reportInsights}
        formatMoney={formatMoney}
        currency={currency}
        expenseCategories={EXPENSE_CATEGORIES}
        incomeSources={INCOME_SOURCES}
        paymentMethods={PAYMENT_METHODS}
      />

      <div className="web-app-view flex min-h-screen">
        {transactionAnimation && (
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 flex items-center gap-2.5 text-4xl font-bold drop-shadow-2xl no-print ${transactionAnimation.type === 'income' ? 'anim-income text-emerald-500' : 'anim-expense text-rose-500'}`}>
            {transactionAnimation.type === 'income' ? <TrendingUp className="w-8 h-8 shrink-0" /> : <TrendingDown className="w-8 h-8 shrink-0" />}
            <span>{transactionAnimation.type === 'income' ? '+' : '-'}{formatMoney(transactionAnimation.amount)}</span>
          </div>
        )}

        {/* Left Sidebar (Desktop) matching reference */}
        <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 p-4 justify-between h-screen sticky top-0 z-40 no-print">
          <div>
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2.5 px-2 py-1 mb-4 text-blue-600 dark:text-blue-400">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
                <Activity className="w-4 h-4" />
              </div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Clarity Finance
              </h1>
            </div>

            {/* Search Input (Decorative / Functional Filter) */}
            <div className="relative mb-5">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 border border-transparent focus:border-slate-300 dark:focus:border-slate-700 outline-none transition-colors"
              />
            </div>

            {/* Primary Navigation */}
            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
                { id: 'forecast', label: 'Forecast', icon: TrendingUp },
                { id: 'loans', label: 'Loans', icon: Landmark },
                { id: 'goals', label: 'Goals', icon: Target },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Utilities Group */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
            <button
              onClick={() => { setTempApiKey(apiKey); setShowApiKeyModal(true); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors font-medium text-left"
              title="AI Settings"
            >
              <Key className="w-4 h-4 text-slate-400 shrink-0" />
              <span>AI Settings</span>
            </button>

            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors font-medium text-left"
              title="Backup Data"
            >
              <DownloadCloud className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Export Data</span>
            </button>

            <label
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors font-medium cursor-pointer text-left"
              title="Restore Data"
            >
              <Upload className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Import Data</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button
              onClick={handlePrint}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors font-medium text-left"
              title="Download Monthly PDF"
            >
              <Download className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors font-medium text-left"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 text-slate-400 shrink-0" />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* User Profile Footer */}
            <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 px-1">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                CF
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Personal Ledger</p>
                <p className="text-[10px] text-slate-400 truncate">Clarity Finance</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          {/* Top Header matching reference */}
          <header className="h-16 px-4 sm:px-6 lg:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30 no-print">
            <div className="flex items-center gap-3">
              <div className="md:hidden flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Activity className="w-5 h-5 shrink-0" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">Clarity</span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="capitalize">{activeTab}</span>
                <span>/</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{monthLabel(selectedMonth)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
              <MonthPicker
                selectedMonth={selectedMonth}
                onSelectMonth={setSelectedMonth}
                monthLabel={monthLabel}
              />

              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-none rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer outline-none"
              >
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>

              <button
                onClick={toggleDarkMode}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 md:hidden"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </header>

          {/* Main Page Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-20 md:pb-8">
            {warnings.length > 0 && activeTab === 'dashboard' && (
              <div className="animate-fade-in-up space-y-2 no-print">
                {warnings.map((warn, i) => (
                  <div key={i} className={`flex items-center gap-3 border-l-4 p-3.5 rounded-r-xl shadow-2xs text-xs font-semibold ${warn.type === 'danger' ? 'bg-rose-50 border-rose-500 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-amber-50 border-amber-500 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                    {warn.type === 'danger' ? (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                    )}
                    <p>{warn.text}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'dashboard' && (
              <Dashboard
                currentMonthData={currentMonthData}
                previousMonthData={previousMonthData}
                balance={balance}
                highestSavingsMonth={highestSavingsMonth}
                monthlyTarget={monthlyTarget}
                handleMonthlyTargetChange={handleMonthlyTargetChange}
                showBudgetSettings={showBudgetSettings}
                setShowBudgetSettings={setShowBudgetSettings}
                categoryTargets={categoryTargets}
                handleBudgetChange={handleBudgetChange}
                financialHealth={financialHealth}
                dailyAverage={dailyAverage}
                formatMoney={formatMoney}
                openHeatmap={openHeatmap}
                setIsTrendOpen={setIsTrendOpen}
                noSpendStreak={noSpendStreak}
                daysRemainingInfo={daysRemainingInfo}
                frequentCategory={frequentCategory}
                expensesByCategory={expensesByCategory}
                generateDetailedReport={handleGenerateReport}
                monthLabel={monthLabel}
                selectedMonth={selectedMonth}
                monthTransactions={monthTransactions}
                onNavigateToTransactions={() => setActiveTab('transactions')}
                initiateEdit={initiateEdit}
                expenseCategories={EXPENSE_CATEGORIES}
                incomeSources={INCOME_SOURCES}
                sixMonthTrend={sixMonthTrend}
                formatCompactMoney={formatCompactMoney}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsPage
                displayTransactions={displayTransactions}
                currentMonthData={currentMonthData}
                selectedMonth={selectedMonth}
                onSelectMonth={setSelectedMonth}
                monthLabel={monthLabel}
                formatMoney={formatMoney}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filter={filter}
                setFilter={setFilter}
                initiateEdit={initiateEdit}
                editingId={editingId}
                deleteTransaction={deleteTransaction}
                formData={formData}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                isSplit={isSplit}
                setIsSplit={setIsSplit}
                splitDetails={splitDetails}
                setSplitDetails={setSplitDetails}
                expenseCategories={EXPENSE_CATEGORIES}
                incomeSources={INCOME_SOURCES}
                paymentMethods={PAYMENT_METHODS}
                CurrencyIcon={CurrencyIcon}
                onBulkAdd={handleBulkAdd}
                magicPrompt={magicPrompt}
                setMagicPrompt={setMagicPrompt}
                handleMagicAdd={handleMagicAdd}
                isMagicLoading={isMagicLoading}
                fileInputRef={fileInputRef}
                handleFileUpload={handleFileUpload}
                isScanning={isScanning}
              />
            )}

        {activeTab === 'forecast' && (
          <Forecast
            formatMoney={formatMoney}
            projections={projections}
            recurring={recurring}
            planned={planned}
            recurringForm={recurringForm}
            plannedForm={plannedForm}
            editingRecurringId={editingRecurringId}
            editingPlannedId={editingPlannedId}
            handleRecurringSubmit={handleRecurringSubmit}
            handlePlannedSubmit={handlePlannedSubmit}
            setRecurringForm={setRecurringForm}
            setPlannedForm={setPlannedForm}
            setEditingRecurringId={setEditingRecurringId}
            setEditingPlannedId={setEditingPlannedId}
            deleteWithUndo={deleteWithUndo}
            setRecurring={setRecurring}
            setPlanned={setPlanned}
            selectedMonth={selectedMonth}
            monthLabel={monthLabel}
            balance={balance}
            currentMonthData={currentMonthData}
            transactions={transactions}
            expenseCategories={EXPENSE_CATEGORIES}
          />
        )}

        {activeTab === 'loans' && (
          <Loans
            formatMoney={formatMoney}
            loans={loans}
            loanForm={loanForm}
            paymentInputs={paymentInputs}
            handleLoanSubmit={handleLoanSubmit}
            handleEditLoan={handleEditLoan}
            setLoanForm={setLoanForm}
            setPaymentInputs={setPaymentInputs}
            recordLoanPayment={recordLoanPayment}
            deleteLoanWithUndo={deleteLoanWithUndo}
          />
        )}

        {activeTab === 'goals' && (
          <Goals
            formatMoney={formatMoney}
            goals={goals}
            goalForm={goalForm}
            goalInputs={goalInputs}
            handleGoalSubmit={handleGoalSubmit}
            setGoalForm={setGoalForm}
            setGoalInputs={setGoalInputs}
            addGoalContribution={addGoalContribution}
            deleteWithUndo={deleteWithUndo}
            setGoals={setGoals}
          />
        )}

      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around no-print">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
          { id: 'forecast', label: 'Forecast', icon: TrendingUp },
          { id: 'loans', label: 'Loans', icon: Landmark },
          { id: 'goals', label: 'Goals', icon: Target },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
                isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>

    <AiSettingsModal
        open={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        provider={aiProvider}
        onSelectProvider={handleSelectProvider}
        geminiApiKey={apiKey}
        onSaveGeminiApiKey={(newKey) => {
          setApiKey(newKey);
          localStorage.setItem('clarity_api_key', newKey);
          setShowApiKeyModal(false);
          setToast({ message: 'Gemini API Key saved successfully!' });
          setTimeout(() => setToast(null), 3000);
        }}
        proxyConfigs={proxyConfigs}
        activeProxyId={activeProxyId}
        onSaveProxyConfig={handleSaveProxyConfig}
        onDeleteProxyConfig={handleDeleteProxyConfig}
        onSetActiveProxy={handleSetActiveProxy}
        tempApiKey={tempApiKey}
        setTempApiKey={setTempApiKey}
        saveApiKey={saveApiKey}
      />

      <HeatmapModal
        open={isHeatmapOpen}
        onClose={() => setIsHeatmapOpen(false)}
        selectedMonth={selectedMonth}
        heatmapData={heatmapData}
        getHeatmapColor={getHeatmapColor}
        formatMoney={formatMoney}
        heatmapDraft={heatmapDraft}
        updateHeatmapDraft={updateHeatmapDraft}
        saveHeatmapThresholds={saveHeatmapThresholds}
        heatmapValidationError={heatmapValidationError}
      />

      <TrendModal
        open={isTrendOpen}
        onClose={() => setIsTrendOpen(false)}
        sixMonthTrend={sixMonthTrend}
        formatMoney={formatMoney}
        formatCompactMoney={formatCompactMoney}
      />

      <Reports
        showReport={showReport}
        setShowReport={setShowReport}
        selectedMonth={selectedMonth}
        monthLabel={monthLabel}
        isReportLoading={isReportLoading}
        formatMoney={formatMoney}
        currentMonthData={currentMonthData}
        reportError={reportError}
        reportInsights={reportInsights}
        generateDetailedReport={handleGenerateReport}
        onDownloadPdf={handlePrint}
      />

      <BulkAddModal
        isOpen={isBulkAddOpen}
        onClose={() => setIsBulkAddOpen(false)}
        onCommit={handleCommitBulkTransactions}
        apiKey={apiKey}
        aiConfig={aiConfig}
        onOpenApiKeyModal={() => {
          setTempApiKey(apiKey);
          setShowApiKeyModal(true);
        }}
        existingTransactions={transactions}
        expenseCategories={EXPENSE_CATEGORIES}
        incomeSources={INCOME_SOURCES}
        paymentMethods={PAYMENT_METHODS}
        formatMoney={formatMoney}
        CurrencyIcon={CurrencyIcon}
      />

      <ReceiptReviewModal
        isOpen={Boolean(receiptReviewData)}
        onClose={() => setReceiptReviewData(null)}
        receiptData={receiptReviewData}
        onCommit={(selectedItems) => {
          handleCommitBulkTransactions(selectedItems);
          setReceiptReviewData(null);
        }}
        expenseCategories={EXPENSE_CATEGORIES}
        paymentMethods={PAYMENT_METHODS}
        formatMoney={formatMoney}
        existingTransactions={transactions}
        availableBalance={getAvailableBalance()}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 text-sm font-semibold animate-fade-in-up border border-slate-700">
          <span>{toast.message}</span>
          {toast.undoAction && (
            <button onClick={toast.undoAction} className="text-indigo-400 font-bold hover:text-indigo-300 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Undo
            </button>
          )}
        </div>
      )}
      </div>

    </div>
  );
}
