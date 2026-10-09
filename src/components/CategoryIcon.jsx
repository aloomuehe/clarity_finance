import {
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
  CreditCard,
  Building2,
  Banknote,
  Smartphone,
  Wallet,
} from 'lucide-react';

const CATEGORY_ICONS = {
  // Expenses
  food: Utensils,
  entertainment: Clapperboard,
  education: GraduationCap,
  transport: Car,
  utilities: Zap,
  shopping: ShoppingBag,
  health: HeartPulse,
  other_expense: CircleEllipsis,

  // Income
  salary: Briefcase,
  freelance: Laptop,
  investment: TrendingUp,
  gift: Gift,
  other_income: Coins,
};

const PAYMENT_METHOD_ICONS = {
  upi: Smartphone,
  cash: Banknote,
  card: CreditCard,
  bank: Building2,
  wallet: Wallet,
};

export function CategoryIcon({ category, className = "w-4 h-4", fallback = CircleEllipsis }) {
  const IconComponent = CATEGORY_ICONS[category] || fallback;
  return <IconComponent className={className} />;
}

export function PaymentMethodIcon({ method, className = "w-3.5 h-3.5", fallback = CreditCard }) {
  const IconComponent = PAYMENT_METHOD_ICONS[method] || fallback;
  return <IconComponent className={className} />;
}

export default CategoryIcon;
