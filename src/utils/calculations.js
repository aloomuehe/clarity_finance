import { getTodayStr, sanitizeDate, shiftDate } from './dates';
import { loadLS } from './storage';

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
