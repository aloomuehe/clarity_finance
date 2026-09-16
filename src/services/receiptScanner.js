import { callAIJSON } from './aiRouter.js';
import { sanitizeDate } from '../utils/dates.js';
import { MAX_MONEY_AMOUNT } from '../constants/finance.js';

// Keywords that indicate receipt summary/totals rather than actual purchased products
const TOTAL_KEYWORDS = [
  'grand total',
  'sub total',
  'subtotal',
  'total amount',
  'total',
  'tax',
  'gst',
  'cgst',
  'sgst',
  'igst',
  'vat',
  'sales tax',
  'service tax',
  'service charge',
  'tip',
  'discount',
  'coupon',
  'amount paid',
  'paid amount',
  'cash paid',
  'card paid',
  'balance due',
  'amount due',
  'change',
  'change due',
  'round off',
  'round-off',
];

/**
 * Checks whether an item name/note strictly represents a summary/total line
 * rather than a genuine purchased product or service.
 */
export function isReceiptSummaryLine(name) {
  if (!name || typeof name !== 'string') return false;
  const clean = name.toLowerCase().trim();
  return TOTAL_KEYWORDS.some(keyword => {
    return clean === keyword
      || clean === `receipt ${keyword}`
      || clean.startsWith(`${keyword}:`)
      || clean.startsWith(`${keyword} `)
      || clean.startsWith(`${keyword}(`);
  });
}

const MONTH_NAMES = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
};

/**
 * Normalizes dates printed in various receipt formats (e.g. 23-Jan-2025, 23/01/2025, 2025-01-23)
 * into standard YYYY-MM-DD without forcing the current month.
 */
export function normalizeReceiptDate(rawStr, fallback) {
  if (!rawStr || typeof rawStr !== 'string') return { date: fallback, isExplicit: false };
  const str = rawStr.trim();

  // Already YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const sanitized = sanitizeDate(str, fallback);
    return { date: sanitized, isExplicit: sanitized === str };
  }

  // DD-Mon-YYYY (e.g. 23-Jan-2025, 23 Jan 2025, 23/Jan/2025)
  const dmyMonMatch = str.match(/^(\d{1,2})[-/\s]([A-Za-z]+)[-/\s](\d{2,4})$/);
  if (dmyMonMatch) {
    const day = dmyMonMatch[1].padStart(2, '0');
    const monStr = dmyMonMatch[2].toLowerCase();
    const mon = MONTH_NAMES[monStr];
    let year = Number(dmyMonMatch[3]);
    if (year < 100) year += 2000;
    if (mon && day) {
      const formatted = `${year}-${mon}-${day}`;
      const sanitized = sanitizeDate(formatted, fallback);
      return { date: sanitized, isExplicit: sanitized === formatted };
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyNumMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmyNumMatch) {
    const day = dmyNumMatch[1].padStart(2, '0');
    const mon = dmyNumMatch[2].padStart(2, '0');
    let year = Number(dmyNumMatch[3]);
    if (year < 100) year += 2000;
    const formatted = `${year}-${mon}-${day}`;
    const sanitized = sanitizeDate(formatted, fallback);
    return { date: sanitized, isExplicit: sanitized === formatted };
  }

  const sanitized = sanitizeDate(str, fallback);
  return { date: sanitized, isExplicit: sanitized !== fallback };
}

/**
 * Scans an itemized receipt image using Gemini Vision or configured Proxy.
 * Extracts individual purchased line items and enforces strict separation
 * between printed/explicit receipt totals and calculated line-item sums.
 */
export async function scanReceipt(file, aiConfigOrKey, today, expenseCategories = []) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Data = event.target.result.split(',')[1];
        const validCategoryIds = expenseCategories.map(c => c.id);

        const instruction = [
          'You are an expert receipt parser. Analyze this receipt and extract ALL individual purchased line items separately.',
          `Reference current date is ${today}.`,
          '',
          'CRITICAL RULES ON EXPLICIT TOTALS VS. CALCULATED SUMS:',
          '1. A "printed total" is a final amount EXPLICITLY labeled and printed on the receipt (e.g. "Total", "Grand Total", "Amount Paid", "Net Payable", "Invoice Total").',
          '2. DO NOT sum or calculate the line items yourself to invent a receipt total.',
          '3. If the receipt does NOT have an explicit, printed total label and number, you MUST set "hasExplicitTotal": false and "explicitTotal": null.',
          '4. NEVER collapse multiple purchased items into one transaction or into a merchant summary.',
          '',
          'CRITICAL RULES ON LINE ITEMS:',
          '5. Extract each purchased product/item as its own entry in the "items" array.',
          '6. Use the specific visible product description for "description" (e.g. "Orange Powder", "Walnuts 5% Tax Item", "Coin 3% Tax Item", "Rose Water", "Glycerine", "Cheese 12% Tax Item").',
          '7. NEVER replace item descriptions with "Shopping", and do NOT use the merchant/store name (e.g. "Sleek Bill") as an item description.',
          '8. DO NOT return Grand Total, Subtotal, Tax, GST, VAT, Tip, Discount, Change, or Amount Paid as line items in the "items" array.',
          '9. For item quantity (e.g. "Chips x 3 @ 50 = 150"), return a single line item with the line total amount (150).',
          '10. If the receipt genuinely has only 1 purchased item, return that single item in "items".',
          `11. Category must be the best match from: [${validCategoryIds.join(', ')}].`,
          '12. Extract the date actually printed on the receipt (e.g. "23-Jan-2025" -> "2025-01-23"). Do not alter the year/month if clearly printed.',
          '13. If any field (description, amount, date) is ambiguous, blurry, or uncertain, mark "confidence": "uncertain" and specify "uncertainField". Do NOT guess or fabricate text.',
          '',
          'Return ONLY valid JSON matching this schema:',
          '{',
          '  "merchant": "string",',
          '  "date": "YYYY-MM-DD" | "DD-Mon-YYYY" | null,',
          '  "hasExplicitTotal": boolean,',
          '  "explicitTotal": number | null,',
          '  "subtotal": number | null,',
          '  "tax": number | null,',
          '  "discount": number | null,',
          '  "paymentMethod": "upi" | "cash" | "card" | "bank" | "wallet",',
          '  "items": [',
          '    {',
          '      "description": "string",',
          '      "amount": number,',
          '      "category": "string",',
          '      "confidence": "high" | "uncertain",',
          '      "uncertainField": "description" | "amount" | "date" | "category" | null',
          '    }',
          '  ]',
          '}',
        ].join('\n');

        const ai = await callAIJSON(aiConfigOrKey, [
          { text: instruction },
          { inlineData: { mimeType: file.type || 'image/jpeg', data: base64Data } },
        ]);

        if (ai.ok && ai.data) {
          const parsed = ai.data;
          const { date: cleanDate, isExplicit: hasExplicitDate } = normalizeReceiptDate(parsed.date, today);
          const merchant = typeof parsed.merchant === 'string' ? parsed.merchant.trim() : '';

          // Explicit total vs calculated total distinction
          const hasExplicitTotal = parsed.hasExplicitTotal === true || (parsed.hasExplicitTotal === undefined && parsed.explicitTotal != null && parsed.explicitTotal !== 'null');
          const rawExplicitTotal = Number(parsed.explicitTotal ?? parsed.receiptTotal);
          const receiptTotal = hasExplicitTotal && Number.isFinite(rawExplicitTotal) && rawExplicitTotal > 0 && rawExplicitTotal <= MAX_MONEY_AMOUNT
            ? rawExplicitTotal
            : null;

          const rawSubtotal = Number(parsed.subtotal);
          const subtotal = Number.isFinite(rawSubtotal) && rawSubtotal > 0 && rawSubtotal <= MAX_MONEY_AMOUNT ? rawSubtotal : null;

          const rawTax = Number(parsed.tax);
          const tax = Number.isFinite(rawTax) && rawTax > 0 && rawTax <= MAX_MONEY_AMOUNT ? rawTax : null;

          const rawDiscount = Number(parsed.discount);
          const discount = Number.isFinite(rawDiscount) && rawDiscount > 0 && rawDiscount <= MAX_MONEY_AMOUNT ? rawDiscount : null;

          const rawItems = Array.isArray(parsed.items)
            ? parsed.items
            : (Array.isArray(parsed) ? parsed : []);

          // Defensive filter: Ensure no grand total or tax summary lines leaked into items list
          const filteredItems = rawItems.filter(it => {
            if (!it || typeof it !== 'object') return false;
            const name = it.description || it.name || it.note || '';
            return !isReceiptSummaryLine(name);
          });

          let candidateItems = [];

          if (filteredItems.length > 0) {
            candidateItems = filteredItems.map((item, idx) => {
              const amt = Number(item.amount);
              const isValidAmt = Number.isFinite(amt) && amt > 0 && amt <= MAX_MONEY_AMOUNT;
              const rawCat = typeof item.category === 'string' ? item.category.toLowerCase().trim() : '';
              const category = validCategoryIds.includes(rawCat) ? rawCat : 'other_expense';
              const name = (item.description || item.name || item.note || `Item ${idx + 1}`).trim();

              const isUncertain = item.confidence === 'uncertain'
                || !isValidAmt
                || !name
                || name.toLowerCase().includes('unknown')
                || name.toLowerCase().includes('unclear');

              let uncertainReason = null;
              if (item.uncertainField === 'amount' || !isValidAmt) {
                uncertainReason = 'Uncertain amount';
              } else if (item.uncertainField === 'description' || !name || name.toLowerCase().includes('unknown')) {
                uncertainReason = 'Uncertain description';
              } else if (item.uncertainField === 'date' || !hasExplicitDate) {
                uncertainReason = 'Uncertain date';
              } else if (item.uncertainField === 'category') {
                uncertainReason = 'Uncertain category';
              } else if (isUncertain) {
                uncertainReason = 'Needs review';
              }

              return {
                id: `receipt-item-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
                type: 'expense',
                amount: isValidAmt ? amt : '',
                category,
                date: cleanDate,
                paymentMethod: parsed.paymentMethod || 'upi',
                note: name,
                selected: true,
                needsReview: isUncertain,
                uncertainReason,
              };
            });
          } else if (receiptTotal || parsed.amount) {
            // Single fallback item when receipt has only one line or unitemized POS slip
            const amt = receiptTotal || Number(parsed.amount);
            const isValidAmt = Number.isFinite(amt) && amt > 0 && amt <= MAX_MONEY_AMOUNT;
            const rawCat = typeof parsed.category === 'string' ? parsed.category.toLowerCase().trim() : '';
            const category = validCategoryIds.includes(rawCat) ? rawCat : 'other_expense';
            const name = (parsed.note || merchant || 'Receipt Item').trim();

            candidateItems = [{
              id: `receipt-item-${Date.now()}-0`,
              type: 'expense',
              amount: isValidAmt ? amt : '',
              category,
              date: cleanDate,
              paymentMethod: parsed.paymentMethod || 'upi',
              note: name,
              selected: true,
              needsReview: !isValidAmt,
              uncertainReason: !isValidAmt ? 'Uncertain amount' : null,
            }];
          }

          // Clarity calculates the item sum independently from the extracted items
          const extractedTotal = candidateItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

          // Verification is only applicable when an explicit receipt total is present on the receipt
          const difference = receiptTotal !== null
            ? Math.round((receiptTotal - extractedTotal) * 100) / 100
            : null;
          const isVerified = difference !== null && Math.abs(difference) < 0.01;

          resolve({
            success: true,
            data: {
              merchant,
              date: cleanDate,
              hasExplicitDate,
              hasExplicitTotal,
              receiptTotal,
              subtotal,
              tax,
              discount,
              paymentMethod: parsed.paymentMethod || 'upi',
              extractedTotal,
              difference,
              isVerified,
              items: candidateItems,
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
