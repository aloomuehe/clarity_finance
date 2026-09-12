import { callGeminiJSON } from './gemini';
import { sanitizeDate } from '../utils/dates';

export async function scanReceipt(file, apiKey, today, expenseCategories) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
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
          const validCats = expenseCategories.map(c => c.id);
          resolve({
            success: true,
            data: {
              type: 'expense',
              amount: Number.isFinite(amount) && amount > 0 ? amount : '',
              category: validCats.includes(parsed.category) ? parsed.category : 'other_expense',
              date: sanitizeDate(parsed.date, today),
              note: typeof parsed.note === 'string' ? parsed.note : '',
            },
          });
        } else {
          resolve({
            success: false,
            error: ai.error || 'Unknown error scanning receipt',
          });
        }
      } catch (err) {
        resolve({
          success: false,
          error: err.message || 'Error processing receipt image',
        });
      }
    };
    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Could not read the receipt image.',
      });
    };
    reader.readAsDataURL(file);
  });
}
