import { callAIJSON } from './aiRouter.js';
import { sanitizeDate, getTodayStr } from '../utils/dates.js';
import { MAX_MONEY_AMOUNT } from '../constants/finance.js';

// Convert a File object to base64 string
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (file.size > 15 * 1024 * 1024) {
      return reject(new Error(`File ${file.name} exceeds maximum size limit of 15MB`));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target.result;
        const base64Data = result.split(',')[1];
        resolve({
          mimeType: file.type || 'image/jpeg',
          data: base64Data,
          name: file.name,
          size: file.size,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
};

// Common keyword category aliases mapping to standard category IDs
const CATEGORY_ALIASES = {
  expense: {
    food: ['food', 'dining', 'restaurant', 'cafe', 'coffee', 'swiggy', 'zomato', 'snack', 'lunch', 'dinner', 'groceries', 'grocery', 'supermarket', 'mart'],
    entertainment: ['entertainment', 'movie', 'cinema', 'netflix', 'spotify', 'prime', 'game', 'gaming', 'concert', 'show'],
    education: ['education', 'course', 'book', 'tuition', 'school', 'college', 'udemy', 'coursera', 'exam', 'fee'],
    transport: ['transport', 'transportation', 'uber', 'ola', 'cab', 'taxi', 'fuel', 'petrol', 'diesel', 'metro', 'bus', 'train', 'flight'],
    utilities: ['utilities', 'electricity', 'water', 'gas', 'wifi', 'internet', 'broadband', 'recharge', 'phone', 'bill'],
    shopping: ['shopping', 'amazon', 'flipkart', 'myntra', 'clothing', 'apparel', 'electronics', 'shoes'],
    health: ['health', 'medical', 'medicine', 'pharmacy', 'hospital', 'doctor', 'clinic', 'dental', 'fitness', 'gym'],
    other_expense: ['other', 'misc', 'miscellaneous', 'other_expense'],
  },
  income: {
    salary: ['salary', 'paycheck', 'payroll', 'wages', 'stipend', 'bonus'],
    freelance: ['freelance', 'contract', 'gig', 'consulting', 'client'],
    investment: ['investment', 'dividend', 'interest', 'stocks', 'mutual fund', 'crypto', 'capital gains'],
    gift: ['gift', 'reward', 'cashback', 'prize'],
    other_income: ['other', 'misc', 'refund', 'other_income'],
  },
};

export const mapCategoryAlias = (rawCat, type, validIds) => {
  if (!rawCat || typeof rawCat !== 'string') return null;
  const clean = rawCat.toLowerCase().trim();
  if (validIds.includes(clean)) return clean;

  const aliases = CATEGORY_ALIASES[type] || {};
  for (const [targetId, keywords] of Object.entries(aliases)) {
    if (validIds.includes(targetId)) {
      if (keywords.some(k => clean.includes(k) || k.includes(clean))) {
        return targetId;
      }
    }
  }
  return null;
};

export const mapPaymentMethodAlias = (rawMethod, validIds) => {
  if (!rawMethod || typeof rawMethod !== 'string') return 'upi';
  const clean = rawMethod.toLowerCase().trim();
  if (validIds.includes(clean)) return clean;
  if (clean.includes('upi') || clean.includes('gpay') || clean.includes('phonepe') || clean.includes('paytm')) return 'upi';
  if (clean.includes('card') || clean.includes('debit') || clean.includes('credit') || clean.includes('visa') || clean.includes('mastercard')) return 'card';
  if (clean.includes('cash')) return 'cash';
  if (clean.includes('bank') || clean.includes('transfer') || clean.includes('neft') || clean.includes('rtgs') || clean.includes('imps')) return 'bank';
  if (clean.includes('wallet')) return 'wallet';
  return 'upi';
};

/**
 * Scans multiple screenshot files using Gemini Vision.
 * Reports progress per image and aggregates candidate transactions.
 */
export async function scanBulkImages(files, aiConfigOrKey, {
  today = getTodayStr(),
  expenseCategories = [],
  incomeSources = [],
  paymentMethods = [],
  onProgress = () => {},
} = {}) {
  const isProxy = aiConfigOrKey && typeof aiConfigOrKey === 'object' && aiConfigOrKey.provider === 'proxy';
  if (isProxy) {
    if (!aiConfigOrKey.activeProxy) {
      return { success: false, error: 'No active proxy configured. Please select or add an active proxy in AI settings.', transactions: [] };
    }
  } else {
    const key = typeof aiConfigOrKey === 'string' ? aiConfigOrKey : aiConfigOrKey?.apiKey;
    if (!key) {
      return { success: false, error: 'No Gemini API key provided. Please set your API key in AI settings or switch to Manual Bulk Entry.', transactions: [] };
    }
  }

  if (!files || files.length === 0) {
    return { success: false, error: 'No files selected for scanning.', transactions: [] };
  }

  const validExpenseIds = expenseCategories.map(c => c.id);
  const validIncomeIds = incomeSources.map(c => c.id);
  const validPaymentIds = paymentMethods.map(p => p.id);
  const currentYear = new Date().getFullYear();

  const aggregatedCandidates = [];
  const errors = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress({
      current: i + 1,
      total: files.length,
      status: `Reading file ${i + 1} of ${files.length}: ${file.name}...`,
    });

    let base64Obj;
    try {
      base64Obj = await fileToBase64(file);
    } catch (err) {
      errors.push(`Could not read ${file.name}: ${err.message}`);
      continue;
    }

    onProgress({
      current: i + 1,
      total: files.length,
      status: `Extracting transactions from image ${i + 1} of ${files.length} with AI...`,
    });

    const instruction = [
      'You are an expert financial assistant extracting financial transactions from an uploaded image.',
      `Today's date is ${today}. Current year is ${currentYear}.`,
      'Read the image (e.g. payment app transaction history, bank statement, UPI confirmation, or receipt) and extract ALL individual transactions visible.',
      'For each transaction found, extract:',
      '- date: formatted as "YYYY-MM-DD". If the year is not printed, assume ' + currentYear + '. If no valid date is visible, return "".',
      '- description: payee, merchant, sender, or description (e.g. "Swiggy", "Amazon", "Metro Card", "Salary", "Rent").',
      '- amount: numerical positive amount without currency symbols or commas (e.g. 320.50).',
      '- type: "expense" (paid, debit, transferred to) or "income" (received, credit, refund, salary).',
      `- category: best match from expense categories [${validExpenseIds.join(', ')}] if type is expense, or income sources [${validIncomeIds.join(', ')}] if type is income.`,
      `- paymentMethod: best match from [${validPaymentIds.join(', ')}] if identifiable, else "upi".`,
      '- confidence: "high" if all fields were clearly legible; "uncertain" if any field was ambiguous or inferred.',
      'Return ONLY a valid JSON object with the exact format: {"transactions": [{"date": "YYYY-MM-DD", "description": "string", "amount": number, "type": "expense"|"income", "category": "string", "paymentMethod": "string", "confidence": "high"|"uncertain"}]}',
      'If no financial transactions are found in the image, return {"transactions": []}.',
    ].join('\n');

    const parts = [
      { text: instruction },
      { inlineData: { mimeType: base64Obj.mimeType, data: base64Obj.data } },
    ];

    const ai = await callAIJSON(aiConfigOrKey, parts);

    if (!ai.ok) {
      errors.push(`Failed on image ${i + 1} (${file.name}): ${ai.error}`);
      continue;
    }

    const rawList = Array.isArray(ai.data?.transactions)
      ? ai.data.transactions
      : (Array.isArray(ai.data) ? ai.data : []);

    rawList.forEach((item, idx) => {
      const type = item.type === 'income' ? 'income' : 'expense';
      const parsedAmount = Number(item.amount);
      const isAmountValid = Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount <= MAX_MONEY_AMOUNT;
      const cleanDate = sanitizeDate(item.date, '');
      const isDateValid = Boolean(cleanDate);

      const targetValidIds = type === 'income' ? validIncomeIds : validExpenseIds;
      const fallbackCat = type === 'income' ? 'other_income' : 'other_expense';
      const mappedCat = mapCategoryAlias(item.category, type, targetValidIds) || fallbackCat;
      const mappedPayment = mapPaymentMethodAlias(item.paymentMethod, validPaymentIds);

      const isUncertain = item.confidence === 'uncertain' || !isAmountValid || !isDateValid || !item.category || mappedCat === fallbackCat;

      aggregatedCandidates.push({
        id: `ai-${i}-${idx}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sourceImage: file.name,
        type,
        amount: isAmountValid ? parsedAmount : '',
        category: mappedCat,
        paymentMethod: mappedPayment,
        date: cleanDate || today,
        note: (item.description || item.note || '').trim(),
        confidence: isUncertain ? 'uncertain' : 'high',
        needsReview: isUncertain,
        uncertainReason: !isAmountValid
          ? 'Uncertain amount'
          : (!isDateValid ? 'Uncertain date' : (mappedCat === fallbackCat ? 'Category needs review' : 'Needs review')),
        selected: true,
      });
    });
  }

  onProgress({
    current: files.length,
    total: files.length,
    status: `Finished processing. Extracted ${aggregatedCandidates.length} candidate transaction(s).`,
  });

  if (aggregatedCandidates.length === 0 && errors.length > 0) {
    return {
      success: false,
      error: errors.join('; ') || 'Could not extract transactions from the provided image(s).',
      transactions: [],
      errors,
    };
  }

  return {
    success: true,
    transactions: aggregatedCandidates,
    errors: errors.length > 0 ? errors : null,
  };
}
