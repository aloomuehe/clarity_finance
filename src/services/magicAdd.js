import { callGeminiJSON } from './gemini.js';
import { parseQuickEntry } from '../utils/calculations.js';
import { sanitizeDate } from '../utils/dates.js';

export async function processMagicAdd({
  prompt,
  apiKey,
  today,
  incomeSources,
  expenseCategories,
  paymentMethods,
}) {
  const cleanPrompt = (prompt || '').trim();
  if (!cleanPrompt) {
    return { success: false, error: 'Empty prompt' };
  }

  // 1) Always parse locally first - this alone makes Magic Add work offline.
  const local = parseQuickEntry(cleanPrompt, today);
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
      `Input: "${cleanPrompt}"`,
    ].join('\n');

    const ai = await callGeminiJSON(apiKey, [{ text: instruction }]);
    if (ai.ok && ai.data) {
      const d = ai.data;
      const type = d.type === 'income' || d.type === 'expense' ? d.type : local.type;
      const validCats = (type === 'income' ? incomeSources : expenseCategories).map(c => c.id);
      const aiAmount = Number(d.amount);

      draft = {
        type,
        amount: Number.isFinite(aiAmount) && aiAmount > 0 ? aiAmount : local.amount,
        category: validCats.includes(d.category)
          ? d.category
          : (validCats.includes(local.category) ? local.category : (type === 'income' ? 'other_income' : 'other_expense')),
        paymentMethod: paymentMethods.some(p => p.id === d.paymentMethod) ? d.paymentMethod : local.paymentMethod,
        date: sanitizeDate(d.date, local.date),
        note: (typeof d.note === 'string' && d.note.trim()) ? d.note.trim() : local.note,
      };
    } else {
      aiError = ai.error;
    }
  }

  // 3) Guard rails before writing to state.
  if (!draft.amount || !Number.isFinite(draft.amount) || draft.amount <= 0) {
    return {
      success: false,
      error: 'Couldn\u2019t find an amount in that. Try "240 snacks" or "1000 salary".',
    };
  }

  const validCats = (draft.type === 'income' ? incomeSources : expenseCategories).map(c => c.id);
  if (!validCats.includes(draft.category)) {
    draft.category = draft.type === 'income' ? 'other_income' : 'other_expense';
  }
  draft.date = sanitizeDate(draft.date, today);
  draft.amount = Math.round(draft.amount * 100) / 100;
  if (!draft.note) {
    draft.note = cleanPrompt;
  }

  return {
    success: true,
    data: draft,
    aiError,
  };
}
