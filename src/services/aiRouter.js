import { callGeminiJSON } from './gemini.js';
import { callProxyJSON } from './aiProxy.js';

/**
 * Unified AI Request Router.
 * Dispatches to either Google Gemini (direct) or the active user-configured Proxy.
 *
 * @param {Object|string} aiConfig - Either legacy apiKey string or { provider, apiKey, activeProxy }
 * @param {Array} parts - Array of text and image inlineData parts
 * @returns {Promise<{ ok: boolean, data?: any, error?: string, model?: string }>}
 */
export async function callAIJSON(aiConfig, parts) {
  // Support legacy signature where first arg is just string apiKey
  const isObjectConfig = aiConfig && typeof aiConfig === 'object';
  const provider = isObjectConfig ? aiConfig.provider : 'gemini';
  const apiKey = isObjectConfig ? aiConfig.apiKey : aiConfig;
  const activeProxy = isObjectConfig ? aiConfig.activeProxy : null;

  if (provider === 'proxy') {
    if (!activeProxy) {
      return {
        ok: false,
        error: 'No active proxy configured. Please select or add an active proxy in AI settings.',
      };
    }
    return callProxyJSON(activeProxy, parts);
  }

  // Default: Direct Google Gemini
  if (!apiKey) {
    return {
      ok: false,
      error: 'No Gemini API key saved. Please set your API key in AI settings.',
    };
  }

  return callGeminiJSON(apiKey, parts);
}
