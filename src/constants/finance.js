import {
  DollarSign,
  Euro,
  IndianRupee,
  JapaneseYen,
  PoundSterling,
  Utensils,
  Clapperboard,
  GraduationCap,
  Car,
  Zap,
  ShoppingBag,
  HeartPulse,
  CircleEllipsis,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  Coins,
  Smartphone,
  Banknote,
  CreditCard,
  Building2,
  Wallet,
} from 'lucide-react';

export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: Utensils, color: 'bg-orange-500' },
  { id: 'entertainment', label: 'Entertainment', icon: Clapperboard, color: 'bg-purple-500' },
  { id: 'education', label: 'Education', icon: GraduationCap, color: 'bg-blue-500' },
  { id: 'transport', label: 'Transportation', icon: Car, color: 'bg-yellow-500' },
  { id: 'utilities', label: 'Utilities', icon: Zap, color: 'bg-cyan-500' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'bg-pink-500' },
  { id: 'health', label: 'Health', icon: HeartPulse, color: 'bg-red-500' },
  { id: 'other_expense', label: 'Other', icon: CircleEllipsis, color: 'bg-slate-500' },
];

export const INCOME_SOURCES = [
  { id: 'salary', label: 'Salary', icon: Briefcase, color: 'bg-green-600' },
  { id: 'freelance', label: 'Freelance', icon: Laptop, color: 'bg-emerald-500' },
  { id: 'investment', label: 'Investment', icon: TrendingUp, color: 'bg-teal-500' },
  { id: 'gift', label: 'Gift', icon: Gift, color: 'bg-lime-500' },
  { id: 'other_income', label: 'Other', icon: Coins, color: 'bg-slate-500' },
];

export const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'bank', label: 'Bank Transfer', icon: Building2 },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
];

export const CURRENCIES = [
  { code: 'USD', icon: DollarSign, label: 'USD ($)' },
  { code: 'EUR', icon: Euro, label: 'EUR (€)' },
  { code: 'GBP', icon: PoundSterling, label: 'GBP (£)' },
  { code: 'INR', icon: IndianRupee, label: 'INR (₹)' },
  { code: 'JPY', icon: JapaneseYen, label: 'JPY (¥)' },
];

export const MAX_MONEY_AMOUNT = 100000000;
