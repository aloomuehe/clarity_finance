import { loadLS, saveLS } from './storage.js';

export const AI_PROVIDERS = {
  GEMINI: 'gemini',
  PROXY: 'proxy',
};

/**
 * Loads the current AI provider type ('gemini' | 'proxy').
 * Defaults to 'gemini' for backward compatibility.
 */
export const loadAIProvider = () => {
  const provider = loadLS('ai_provider', AI_PROVIDERS.GEMINI);
  return provider === AI_PROVIDERS.PROXY ? AI_PROVIDERS.PROXY : AI_PROVIDERS.GEMINI;
};

/**
 * Saves the active AI provider type.
 */
export const saveAIProvider = (provider) => {
  const safe = provider === AI_PROVIDERS.PROXY ? AI_PROVIDERS.PROXY : AI_PROVIDERS.GEMINI;
  saveLS('ai_provider', safe);
  return safe;
};

/**
 * Loads all saved proxy configurations.
 */
export const loadProxyConfigs = () => {
  const saved = loadLS('ai_proxy_configs', []);
  if (!Array.isArray(saved)) return [];
  return saved.filter(c => c && typeof c === 'object' && c.id && c.name);
};

/**
 * Saves proxy configurations to localStorage.
 */
export const saveProxyConfigs = (configs) => {
  if (!Array.isArray(configs)) return;
  saveLS('ai_proxy_configs', configs);
};

/**
 * Loads the active proxy configuration ID.
 */
export const loadActiveProxyId = () => {
  const id = loadLS('active_ai_proxy_id', null);
  return typeof id === 'string' && id ? id : null;
};

/**
 * Saves the active proxy configuration ID.
 */
export const saveActiveProxyId = (id) => {
  saveLS('active_ai_proxy_id', id || null);
};

/**
 * Retrieves the currently active proxy object from a list of configs and active ID.
 */
export const getActiveProxy = (configs = [], activeId = null) => {
  if (!activeId || !Array.isArray(configs)) return null;
  return configs.find(c => c.id === activeId) || null;
};

/**
 * Factory to create a new proxy configuration object.
 */
export const createProxyConfig = ({
  id,
  name,
  url,
  apiKey,
  model,
  customPrompt = '',
}) => {
  return {
    id: id || `proxy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: (name || 'Custom Proxy').trim(),
    url: (url || '').trim(),
    apiKey: (apiKey || '').trim(),
    model: (model || '').trim(),
    customPrompt: (customPrompt || '').trim(),
    createdAt: Date.now(),
  };
};

/**
 * Safely deletes a proxy configuration.
 * If deleting the active proxy, sets newActiveId to null (Requirement 17: NEVER pick a random backup).
 */
export const deleteProxyConfig = (configs = [], activeId, idToDelete) => {
  const updatedConfigs = configs.filter(c => c.id !== idToDelete);
  const newActiveId = activeId === idToDelete ? null : activeId;
  return { updatedConfigs, newActiveId };
};
