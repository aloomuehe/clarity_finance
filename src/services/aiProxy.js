/**
 * AI Proxy Client for OpenAI-compatible Chat Completions endpoints
 * (e.g., OpenRouter, LiteLLM, vLLM, custom gateways)
 */

export const normalizeProxyUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  if (!url) return '';

  // Ensure protocol
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, '');

  // If already ends with /chat/completions or /completions, keep as-is
  if (/\/chat\/completions$/i.test(url) || /\/completions$/i.test(url)) {
    return url;
  }

  // If ends with /v1, append /chat/completions
  if (/\/v1$/i.test(url)) {
    return `${url}/chat/completions`;
  }

  // Standard fallback: append /chat/completions
  return `${url}/chat/completions`;
};

const safeJSONParse = (text) => {
  if (!text) return null;
  let cleaned = String(text).trim();
  // Strip code fences ```json ... ```
  cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const startObj = cleaned.indexOf('{');
    const endObj = cleaned.lastIndexOf('}');
    if (startObj !== -1 && endObj > startObj) {
      try {
        return JSON.parse(cleaned.slice(startObj, endObj + 1));
      } catch {
        /* fall through */
      }
    }
    const startArr = cleaned.indexOf('[');
    const endArr = cleaned.lastIndexOf(']');
    if (startArr !== -1 && endArr > startArr) {
      try {
        return JSON.parse(cleaned.slice(startArr, endArr + 1));
      } catch {
        /* fall through */
      }
    }
    return null;
  }
};

/**
 * Sanitizes messages to strip potential API keys, bearer tokens, or secrets.
 */
export const sanitizeErrorMessage = (msg) => {
  if (!msg || typeof msg !== 'string') return '';
  return msg
    .replace(/(?:sk-[a-zA-Z0-9_-]{8,}|AIza[a-zA-Z0-9_-]{20,}|bearer\s+[a-zA-Z0-9._-]+)/gi, '[REDACTED]')
    .replace(/(?:key|token|secret|password)=["']?[^"'\s&]+["']?/gi, '$1=[REDACTED]');
};

/**
 * Formats error responses into safe, actionable messages without exposing API keys.
 */
const formatSafeError = (status, serverMessage) => {
  const msg = (serverMessage || '').toLowerCase();

  if (status === 401 || status === 403 || msg.includes('unauthorized') || msg.includes('invalid api key')) {
    return 'API key or authorization failed. Please check your API key.';
  }
  if (status === 404 || msg.includes('not found')) {
    return 'Proxy endpoint or model was not found (404). Check your Proxy URL and Model name.';
  }
  if (status === 429 || msg.includes('rate limit') || msg.includes('quota')) {
    return 'Active proxy is rate limited or quota exceeded (429). Please try again later or switch proxy.';
  }
  if (msg.includes('vision') || msg.includes('image') || msg.includes('multimodal')) {
    return 'The configured model does not support image input. Please use a vision-capable model.';
  }
  if (status >= 500) {
    return `Proxy service is temporarily unavailable (HTTP ${status}).`;
  }
  if (serverMessage && typeof serverMessage === 'string' && serverMessage.length < 150) {
    const cleanMsg = sanitizeErrorMessage(serverMessage);
    return `Proxy error (${status || 'unknown'}): ${cleanMsg}`;
  }
  return `Proxy request failed with HTTP ${status || 'unknown'}.`;
};

/**
 * Tests connection to a proxy with a harmless minimal text prompt.
 * Never uploads user screenshots.
 */
export async function testProxyConnection({ url, apiKey, model }) {
  if (!url) return { ok: false, error: 'Proxy URL is required' };
  if (!model) return { ok: false, error: 'Model name is required' };

  const endpoint = normalizeProxyUrl(url);

  const payload = {
    model: model.trim(),
    messages: [
      {
        role: 'user',
        content: 'Respond with valid JSON: {"ok": true}',
      },
    ],
    temperature: 0.1,
    max_tokens: 30,
  };

  const headers = {
    'Content-Type': 'application/json',
  };
  if (apiKey && apiKey.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const serverMsg = data?.error?.message || data?.message || `HTTP ${res.status}`;
      return {
        ok: false,
        error: formatSafeError(res.status, serverMsg),
      };
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return {
        ok: false,
        error: 'Proxy returned an empty response. Verify model name and endpoint.',
      };
    }

    return {
      ok: true,
      message: 'Connection successful. Image capability will be verified when scanning.',
    };
  } catch {
    return {
      ok: false,
      error: 'Could not reach the proxy. Check your network, URL, or CORS settings.',
    };
  }
}

/**
 * Sends a structured JSON extraction request to an OpenAI-compatible proxy.
 * Supports multimodal image input via base64 data URLs.
 */
export async function callProxyJSON({ url, apiKey, model, customPrompt }, parts) {
  if (!url) return { ok: false, error: 'No proxy URL configured' };
  if (!model) return { ok: false, error: 'No model configured for proxy' };

  const endpoint = normalizeProxyUrl(url);

  // Separate text instructions and image inlineData
  let textParts = [];
  let imageParts = [];

  for (const part of parts || []) {
    if (part?.text) {
      textParts.push(part.text);
    } else if (part?.inlineData) {
      imageParts.push(part.inlineData);
    }
  }

  let promptText = textParts.join('\n\n');
  if (customPrompt && customPrompt.trim()) {
    promptText = `${promptText}\n\nUser Custom Instruction: ${customPrompt.trim()}`;
  }

  // Build OpenAI-compatible user message content
  let messageContent;
  if (imageParts.length > 0) {
    messageContent = [
      { type: 'text', text: promptText },
      ...imageParts.map(img => ({
        type: 'image_url',
        image_url: {
          url: `data:${img.mimeType || 'image/jpeg'};base64,${img.data}`,
        },
      })),
    ];
  } else {
    messageContent = promptText;
  }

  const payload = {
    model: model.trim(),
    messages: [
      {
        role: 'user',
        content: messageContent,
      },
    ],
    temperature: 0.2,
  };

  const headers = {
    'Content-Type': 'application/json',
  };
  if (apiKey && apiKey.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const serverMsg = data?.error?.message || data?.message || `HTTP ${res.status}`;
      return {
        ok: false,
        error: formatSafeError(res.status, serverMsg),
      };
    }

    const rawText = data?.choices?.[0]?.message?.content;
    if (!rawText) {
      return {
        ok: false,
        error: 'Proxy model returned an empty response.',
      };
    }

    const parsed = safeJSONParse(rawText);
    if (!parsed) {
      return {
        ok: false,
        error: 'Could not understand the model response. Review the proxy/model configuration.',
      };
    }

    return {
      ok: true,
      data: parsed,
      model: model.trim(),
    };
  } catch {
    return {
      ok: false,
      error: 'Could not reach the proxy. Check your network or CORS settings.',
    };
  }
}
