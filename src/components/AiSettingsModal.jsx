import { useState, useMemo } from 'react';
import {
  Key,
  X,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Radio,
  Server,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { normalizeProxyUrl, testProxyConnection } from '../services/aiProxy.js';
import { AI_PROVIDERS, createProxyConfig } from '../utils/proxyStorage.js';

export default function AiSettingsModal({
  open,
  onClose,
  provider = AI_PROVIDERS.GEMINI,
  onSelectProvider,
  geminiApiKey = '',
  onSaveGeminiApiKey,
  proxyConfigs = [],
  activeProxyId = null,
  onSaveProxyConfig,
  onDeleteProxyConfig,
  onSetActiveProxy,
  // Legacy props fallback
  tempApiKey,
  setTempApiKey,
  saveApiKey,
}) {
  // Modal subview: 'list' | 'form'
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);

  // Direct Gemini state
  const [directKey, setDirectKey] = useState(geminiApiKey || tempApiKey || '');
  const [showDirectKey, setShowDirectKey] = useState(false);

  // Form draft state for New / Edit Proxy
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [showFormKey, setShowFormKey] = useState(false);

  // Test connection state
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // { ok: boolean, message?: string, error?: string }

  // Active proxy object
  const activeProxy = useMemo(() => {
    return proxyConfigs.find(c => c.id === activeProxyId) || null;
  }, [proxyConfigs, activeProxyId]);

  if (!open) return null;

  // Open Form to create new proxy
  const handleOpenNew = () => {
    setEditingId(null);
    setFormName('');
    setFormUrl('');
    setFormApiKey('');
    setFormModel('google/gemini-2.5-flash');
    setFormPrompt('');
    setShowFormKey(false);
    setTestStatus(null);
    setView('form');
  };

  // Open Form to edit existing proxy
  const handleOpenEdit = (config) => {
    setEditingId(config.id);
    setFormName(config.name);
    setFormUrl(config.url);
    setFormApiKey(config.apiKey || '');
    setFormModel(config.model || '');
    setFormPrompt(config.customPrompt || '');
    setShowFormKey(false);
    setTestStatus(null);
    setView('form');
  };

  // Run connection test
  const handleRunTest = async () => {
    if (!formUrl.trim() || !formModel.trim()) {
      setTestStatus({ ok: false, error: 'Proxy URL and Model are required to test.' });
      return;
    }
    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await testProxyConnection({
        url: formUrl.trim(),
        apiKey: formApiKey.trim(),
        model: formModel.trim(),
      });
      setTestStatus(res);
    } catch (err) {
      setTestStatus({ ok: false, error: err.message || 'Connection test failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  // Save proxy configuration
  const handleSaveForm = (e) => {
    e?.preventDefault();
    if (!formName.trim() || !formUrl.trim() || !formModel.trim()) {
      setTestStatus({ ok: false, error: 'Name, Proxy URL, and Model are required.' });
      return;
    }

    const config = createProxyConfig({
      id: editingId,
      name: formName,
      url: formUrl,
      apiKey: formApiKey,
      model: formModel,
      customPrompt: formPrompt,
    });

    if (onSaveProxyConfig) {
      onSaveProxyConfig(config);
    }

    setView('list');
  };

  // Save Gemini Key
  const handleSaveDirectKey = () => {
    const key = directKey.trim();
    if (onSaveGeminiApiKey) {
      onSaveGeminiApiKey(key);
    } else if (saveApiKey) {
      if (setTempApiKey) setTempApiKey(key);
      saveApiKey();
    }
  };

  const normalizedUrlPreview = formUrl.trim() ? normalizeProxyUrl(formUrl.trim()) : '';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="dark-card bg-white dk-bg-slate-900 rounded-3xl w-full max-w-xl p-4 sm:p-6 sm:p-8 relative shadow-2xl modal-spring border border-slate-200 dk-border-slate-800 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {view === 'form' && (
              <button
                type="button"
                onClick={() => setView('list')}
                className="p-1.5 sm:p-2 bg-slate-100 hover:bg-slate-200 dk-bg-slate-800 dk-hover-bg-slate-700 text-slate-700 dk-text-slate-200 rounded-xl transition-colors shrink-0"
                title="Back to saved proxies"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="p-2.5 sm:p-3 bg-indigo-100 dk-bg-indigo-900-30 rounded-2xl text-indigo-600 dk-text-indigo-400 shrink-0">
              <Key className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-slate-900 dk-text-white truncate">
                {view === 'form'
                  ? (editingId ? 'Edit Proxy Configuration' : 'New Proxy Configuration')
                  : 'AI & API Settings'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dk-text-slate-400 font-medium truncate">
                {view === 'form'
                  ? 'Configure an OpenAI-compatible proxy endpoint'
                  : 'Manage AI providers and proxy connections'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-100 dk-bg-slate-800 rounded-full hover:bg-slate-200 dk-hover-bg-slate-700 text-slate-700 dk-text-slate-200 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-5">
          {/* ================= VIEW: LIST ================= */}
          {view === 'list' && (
            <>
              {/* Provider Selector Tabs (Requirement 2) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dk-text-slate-400 mb-1.5 uppercase tracking-wider">
                  Active AI Provider
                </label>
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dk-bg-slate-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => onSelectProvider && onSelectProvider(AI_PROVIDERS.GEMINI)}
                    className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      provider === AI_PROVIDERS.GEMINI
                        ? 'bg-white dk-bg-slate-700 text-indigo-600 dk-text-indigo-400 shadow-sm'
                        : 'text-slate-600 dk-text-slate-400 hover:text-slate-900 dk-hover-text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Google Gemini (Direct)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectProvider && onSelectProvider(AI_PROVIDERS.PROXY)}
                    className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      provider === AI_PROVIDERS.PROXY
                        ? 'bg-white dk-bg-slate-700 text-indigo-600 dk-text-indigo-400 shadow-sm'
                        : 'text-slate-600 dk-text-slate-400 hover:text-slate-900 dk-hover-text-white'
                    }`}
                  >
                    <Server className="w-4 h-4" />
                    <span>Proxy (OpenAI-compatible)</span>
                  </button>
                </div>
              </div>

              {/* ================= TAB 1: GOOGLE GEMINI ================= */}
              {provider === AI_PROVIDERS.GEMINI && (
                <div className="p-5 rounded-2xl bg-slate-50 dk-bg-slate-800/60 border border-slate-200 dk-border-slate-700 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dk-text-white mb-1">
                      Gemini API Key
                    </h3>
                    <p className="text-xs text-slate-600 dk-text-slate-300">
                      Direct connection to Google Gemini API models. Your key is stored strictly in your browser&apos;s local storage.
                    </p>
                  </div>

                  <div className="relative">
                    <input
                      type={showDirectKey ? 'text' : 'password'}
                      value={directKey}
                      onChange={(e) => setDirectKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full pl-4 pr-11 py-2.5 bg-white dk-bg-slate-900 border border-slate-300 dk-border-slate-700 rounded-xl text-sm text-slate-900 dk-text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDirectKey(!showDirectKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dk-hover-text-slate-200"
                      title={showDirectKey ? 'Hide key' : 'Show key'}
                    >
                      {showDirectKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveDirectKey}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition-colors"
                  >
                    Save Gemini Key
                  </button>
                </div>
              )}

              {/* ================= TAB 2: PROXY ================= */}
              {provider === AI_PROVIDERS.PROXY && (
                <div className="space-y-4">
                  {/* Active Proxy Info Banner (Requirements 13 & 28) */}
                  <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${
                    activeProxy
                      ? 'bg-emerald-50 dk-bg-emerald-950/20 border-emerald-200 dk-border-emerald-800/40 text-emerald-900 dk-text-emerald-300'
                      : 'bg-amber-50 dk-bg-amber-950/20 border-amber-200 dk-border-amber-800/40 text-amber-900 dk-text-amber-300'
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Radio className="w-4 h-4 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold block">
                          {activeProxy ? `Active Proxy: ${activeProxy.name}` : 'No Active Proxy Selected'}
                        </span>
                        <span className="text-xs opacity-90 truncate block">
                          {activeProxy
                            ? `${activeProxy.model} · Manual switching only (no auto-failover)`
                            : 'Select a saved proxy below or click "+ New Proxy"'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Saved Proxy List Header */}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-700 dk-text-slate-300 uppercase tracking-wider">
                      Saved Configurations ({proxyConfigs.length})
                    </h3>
                    <button
                      type="button"
                      onClick={handleOpenNew}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Proxy</span>
                    </button>
                  </div>

                  {/* Saved Proxy Cards */}
                  {proxyConfigs.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dk-border-slate-800 text-slate-500 dk-text-slate-400 space-y-3">
                      <Server className="w-8 h-8 mx-auto opacity-40" />
                      <div>
                        <p className="font-bold text-sm text-slate-700 dk-text-slate-300">No Proxy Configurations Saved</p>
                        <p className="text-xs mt-0.5">
                          Add your first OpenAI-compatible proxy (such as OpenRouter, LiteLLM, or custom gateway).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenNew}
                        className="px-4 py-2 rounded-xl bg-indigo-50 dk-bg-indigo-900-30 text-indigo-600 dk-text-indigo-400 hover:bg-indigo-100 font-bold text-xs inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Your First Proxy</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {proxyConfigs.map((config) => {
                        const isActive = config.id === activeProxyId;
                        let domain = config.url;
                        try {
                          domain = new URL(config.url).hostname;
                        } catch {
                          /* fallback to raw url */
                        }

                        return (
                          <div
                            key={config.id}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                              isActive
                                ? 'bg-indigo-50/40 dk-bg-indigo-950/20 border-indigo-500 dk-border-indigo-500 shadow-sm'
                                : 'bg-slate-50 dk-bg-slate-800/60 border-slate-200 dk-border-slate-700 hover:border-slate-300 dk-hover-border-slate-600'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-bold text-sm text-slate-900 dk-text-white truncate">
                                  {config.name}
                                </span>
                                {config.customPrompt && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 dk-bg-slate-700 text-slate-600 dk-text-slate-300">
                                    Prompt
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 dk-text-slate-400 truncate flex items-center gap-1.5">
                                <span className="font-mono text-[11px] text-slate-700 dk-text-slate-300 font-semibold truncate">
                                  {config.model}
                                </span>
                                <span>·</span>
                                <span className="truncate">{domain}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isActive ? (
                                <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 dk-bg-emerald-900-30 dk-text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Active</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onSetActiveProxy && onSetActiveProxy(config.id)}
                                  className="px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 dk-bg-slate-700 dk-hover-bg-slate-600 text-slate-800 dk-text-slate-200 font-bold text-xs transition-colors"
                                >
                                  Use
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenEdit(config)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 dk-hover-text-indigo-400 transition-colors"
                                title="Edit proxy"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onDeleteProxyConfig && onDeleteProxyConfig(config.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 transition-colors"
                                title="Delete proxy"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ================= VIEW: FORM (NEW / EDIT) ================= */}
          {view === 'form' && (
            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dk-text-slate-300 mb-1">
                  Configuration Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OpenRouter Flash, My Gateway"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dk-bg-slate-800 border border-slate-300 dk-border-slate-700 rounded-xl text-sm text-slate-900 dk-text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Proxy URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dk-text-slate-300 mb-1">
                  Proxy URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://openrouter.ai/api/v1/chat/completions"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dk-bg-slate-800 border border-slate-300 dk-border-slate-700 rounded-xl text-sm text-slate-900 dk-text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
                {normalizedUrlPreview && (
                  <p className="text-[11px] text-slate-400 mt-1 truncate">
                    Endpoint: <span className="font-mono text-slate-600 dk-text-slate-300">{normalizedUrlPreview}</span>
                  </p>
                )}
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dk-text-slate-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showFormKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2 bg-slate-50 dk-bg-slate-800 border border-slate-300 dk-border-slate-700 rounded-xl text-sm text-slate-900 dk-text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormKey(!showFormKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dk-hover-text-slate-200"
                    title={showFormKey ? 'Hide key' : 'Show key'}
                  >
                    {showFormKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dk-text-slate-300 mb-1">
                  Model <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. google/gemini-2.5-flash, openai/gpt-4o-mini"
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dk-bg-slate-800 border border-slate-300 dk-border-slate-700 rounded-xl text-sm text-slate-900 dk-text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Note: For receipt and screenshot scanning, ensure the model supports vision/image inputs.
                </p>
              </div>

              {/* Custom Prompt (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dk-text-slate-300 mb-1">
                  Custom Prompt <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prefer payment method 'upi' if ambiguous. Assume currency INR."
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dk-bg-slate-800 border border-slate-300 dk-border-slate-700 rounded-xl text-xs text-slate-900 dk-text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Test Status Feedback Banner */}
              {testStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    testStatus.ok
                      ? 'bg-emerald-50 dk-bg-emerald-950/20 border-emerald-200 dk-border-emerald-800/40 text-emerald-900 dk-text-emerald-300'
                      : 'bg-rose-50 dk-bg-rose-950/20 border-rose-200 dk-border-rose-800/40 text-rose-900 dk-text-rose-300'
                  }`}
                >
                  {testStatus.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {testStatus.ok ? 'Connection Successful' : 'Connection Failed'}
                    </span>
                    <span className="opacity-90">
                      {testStatus.ok ? testStatus.message : testStatus.error}
                    </span>
                  </div>
                </div>
              )}

              {/* Form Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dk-border-slate-800">
                <button
                  type="button"
                  onClick={handleRunTest}
                  disabled={isTesting || !formUrl.trim() || !formModel.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dk-bg-slate-800 dk-hover-bg-slate-700 text-slate-800 dk-text-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    className="px-3.5 py-2 text-xs font-bold text-slate-600 dk-text-slate-400 hover:text-slate-900 dk-hover-text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm"
                  >
                    {editingId ? 'Save Changes' : 'Add Proxy'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
