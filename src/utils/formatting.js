export const formatCompactCurrency = (amount, currency) => new Intl.NumberFormat(undefined, {
  style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1,
}).format(amount || 0);

export const formatCurrency = (amount, currency) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
