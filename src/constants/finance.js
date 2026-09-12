import { DollarSign, Euro, IndianRupee, JapaneseYen, PoundSterling } from 'lucide-react';

export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: '🍔', color: 'bg-orange-500' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', color: 'bg-purple-500' },
  { id: 'education', label: 'Education', icon: '📚', color: 'bg-blue-500' },
  { id: 'transport', label: 'Transportation', icon: '🚗', color: 'bg-yellow-500' },
  { id: 'utilities', label: 'Utilities', icon: '💡', color: 'bg-cyan-500' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: 'bg-pink-500' },
  { id: 'health', label: 'Health', icon: '🏥', color: 'bg-red-500' },
  { id: 'other_expense', label: 'Other', icon: '📦', color: 'bg-slate-500' },
];

export const INCOME_SOURCES = [
  { id: 'salary', label: 'Salary', icon: '💼', color: 'bg-green-600' },
  { id: 'freelance', label: 'Freelance', icon: '💻', color: 'bg-emerald-500' },
  { id: 'investment', label: 'Investment', icon: '📈', color: 'bg-teal-500' },
  { id: 'gift', label: 'Gift', icon: '🎁', color: 'bg-lime-500' },
  { id: 'other_income', label: 'Other', icon: '🪙', color: 'bg-slate-500' },
];

export const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'bank', label: 'Bank Transfer', icon: '🏦' },
  { id: 'wallet', label: 'Wallet', icon: '💼' },
];

export const CURRENCIES = [
  { code: 'USD', icon: DollarSign, label: 'USD ($)' },
  { code: 'EUR', icon: Euro, label: 'EUR (€)' },
  { code: 'GBP', icon: PoundSterling, label: 'GBP (£)' },
  { code: 'INR', icon: IndianRupee, label: 'INR (₹)' },
  { code: 'JPY', icon: JapaneseYen, label: 'JPY (¥)' },
];

export const MAX_MONEY_AMOUNT = 100000000;
