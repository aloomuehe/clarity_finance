const LS_PREFIX = 'clarity_';

export const loadLS = (key, fallback) => {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    // guard against shape changes between versions
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    if (!Array.isArray(fallback) && typeof fallback === 'object' && fallback !== null
        && (typeof parsed !== 'object' || Array.isArray(parsed))) return fallback;
    if (typeof fallback === 'number' && typeof parsed !== 'number') return fallback;
    if (typeof fallback === 'string' && typeof parsed !== 'string') return fallback;
    return parsed;
  } catch {
    return fallback;
  }
};

export const saveLS = (key, value) => {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or blocked (private mode) - ignore */
  }
};
