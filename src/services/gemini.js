const GEMINI_MODELS = [
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
];

const safeJSONParse = (text) => {
  if (!text) return null;
  let cleaned = String(text).trim();
  // strip ```json ... ``` fences the model sometimes adds
  cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through */ }
    }
    return null;
  }
};

// Single place where we talk to Gemini. Returns { ok, data, error }.
export const callGeminiJSON = async (apiKey, parts) => {
  if (!apiKey) return { ok: false, error: 'No API key saved' };
  const payload = {
    contents: [{ role: 'user', parts }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
  };
  let lastError = 'Unknown error';

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        lastError = data?.error?.message || `HTTP ${res.status}`;
        // model missing / bad request for this model -> try the next one
        if (res.status === 404 || res.status === 400) continue;
        return { ok: false, error: lastError };
      }

      const text = (data?.candidates?.[0]?.content?.parts || [])
        .map(p => p?.text)
        .filter(Boolean)
        .join('')
        .trim();

      if (!text) {
        lastError = data?.promptFeedback?.blockReason
          ? `Blocked: ${data.promptFeedback.blockReason}`
          : 'Model returned an empty response';
        continue;
      }

      const parsed = safeJSONParse(text);
      if (!parsed) { lastError = 'Could not read the model response as JSON'; continue; }
      return { ok: true, data: parsed, model };
    } catch (err) {
      lastError = err?.message || String(err);
    }
  }
  return { ok: false, error: lastError };
};
