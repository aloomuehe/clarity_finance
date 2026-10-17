import { useState, useMemo, useRef } from 'react';
import {
  Layers,
  Camera,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Check,
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Key,
  Loader2,
  X,
  ShieldAlert,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { getTodayStr } from '../utils/dates.js';
import { scanBulkImages } from '../services/bulkScan.js';
import {
  createEmptyBulkRow,
  detectDuplicates,
  validateBulkBatch,
} from '../utils/bulkValidation.js';

function BulkAddModalContent({
  onClose,
  onCommit,
  apiKey,
  aiConfig,
  onOpenApiKeyModal,
  existingTransactions = [],
  expenseCategories = [],
  incomeSources = [],
  paymentMethods = [],
  formatMoney = (n) => String(n),
  CurrencyIcon,
}) {
  const resolvedAiConfig = useMemo(() => {
    if (aiConfig && typeof aiConfig === 'object') return aiConfig;
    return { provider: 'gemini', apiKey: apiKey || '' };
  }, [aiConfig, apiKey]);

  const isProxy = resolvedAiConfig.provider === 'proxy';
  const isConfigured = isProxy ? Boolean(resolvedAiConfig.activeProxy) : Boolean(resolvedAiConfig.apiKey);

  // Navigation mode: 'select' | 'scan' | 'manual' | 'review'
  const [mode, setMode] = useState('select');

  // Rows currently in draft / review
  const [rows, setRows] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'selected' | 'attention' | 'duplicates'

  // Image scanning state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const fileInputRef = useRef(null);

  // Run duplicate detection on rows whenever rows or existingTransactions change
  const rowsWithDuplicates = useMemo(() => {
    return detectDuplicates(rows, existingTransactions);
  }, [rows, existingTransactions]);

  // Run chronological validation whenever rowsWithDuplicates changes
  const validation = useMemo(() => {
    return validateBulkBatch(rowsWithDuplicates, existingTransactions, formatMoney);
  }, [rowsWithDuplicates, existingTransactions, formatMoney]);

  // Safe close handler: confirms if there are unsaved transactions
  const handleRequestClose = () => {
    if (rows.length > 0) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    onClose();
  };

  // Row update helpers
  const updateRow = (id, updates) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)));
  };

  const deleteRow = (id) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const duplicateRow = (id) => {
    const target = rows.find(r => r.id === id);
    if (!target) return;
    const cloned = {
      ...target,
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      selected: true,
      needsReview: false,
    };
    const targetIndex = rows.findIndex(r => r.id === id);
    const updated = [...rows];
    updated.splice(targetIndex + 1, 0, cloned);
    setRows(updated);
  };

  const addManualRow = () => {
    const lastRow = rows[rows.length - 1];
    const newRow = createEmptyBulkRow(lastRow?.date || getTodayStr());
    setRows(prev => [...prev, newRow]);
  };

  const toggleSelectAll = (selectVal) => {
    setRows(prev => prev.map(r => ({ ...r, selected: selectVal })));
  };

  // Switch to Manual Bulk Entry
  const handleStartManual = () => {
    if (rows.length === 0) {
      setRows([createEmptyBulkRow(getTodayStr())]);
    }
    setMode('manual');
  };

  // Switch to Scan Transactions
  const handleStartScan = () => {
    setSelectedFiles([]);
    setScanError(null);
    setScanProgress(null);
    setMode('scan');
  };

  // File selection for scanning
  const handleFileChange = (e) => {
    const rawFiles = Array.from(e.target.files || []);
    const validImageFiles = [];
    const rejectedErrors = [];

    rawFiles.forEach(file => {
      const isImage = file.type?.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif)$/i.test(file.name);
      if (!isImage) {
        rejectedErrors.push(`"${file.name}" is not a supported image file.`);
      } else if (file.size > 15 * 1024 * 1024) {
        rejectedErrors.push(`"${file.name}" exceeds the 15MB limit.`);
      } else {
        validImageFiles.push(file);
      }
    });

    if (rejectedErrors.length > 0) {
      setScanError(rejectedErrors.join(' '));
    } else {
      setScanError(null);
    }

    if (validImageFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validImageFiles]);
    }
  };

  const removeSelectedFile = (idx) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Trigger AI scanning
  const handleRunScan = async () => {
    if (!isConfigured) {
      if (onOpenApiKeyModal) onOpenApiKeyModal();
      return;
    }
    if (selectedFiles.length === 0) return;

    setIsScanning(true);
    setScanError(null);
    setScanProgress({ current: 0, total: selectedFiles.length, status: 'Preparing screenshots...' });

    try {
      const res = await scanBulkImages(selectedFiles, resolvedAiConfig, {
        today: getTodayStr(),
        expenseCategories,
        incomeSources,
        paymentMethods,
        onProgress: setScanProgress,
      });

      if (res.success && res.transactions?.length > 0) {
        setRows(res.transactions);
        setMode('review');
      } else {
        setScanError(res.error || 'No transactions were found in the uploaded screenshot(s).');
      }
    } catch (err) {
      setScanError(err.message || 'An unexpected error occurred while scanning.');
    } finally {
      setIsScanning(false);
    }
  };

  // Final commit
  const handleCommit = () => {
    if (!validation.isValid) return;
    const selectedRows = rowsWithDuplicates.filter(r => r.selected);
    onCommit(selectedRows);
    onClose();
  };

  // Filtered rows for review display
  const displayRows = rowsWithDuplicates.filter(row => {
    if (reviewFilter === 'selected') return row.selected;
    if (reviewFilter === 'attention') return Boolean(validation.errorsByRowId[row.id] || row.needsReview);
    if (reviewFilter === 'duplicates') return row.isDuplicate;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[80] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl my-auto shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[92vh] animate-fade-in-up">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            {mode !== 'select' && (
              <button
                type="button"
                onClick={() => {
                  if (mode === 'review' && rows.some(r => r.id.startsWith('draft-'))) {
                    setMode('manual');
                  } else {
                    setMode('select');
                  }
                }}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Bulk Add Transactions
                {mode === 'review' && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                    Review ({rows.length})
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {mode === 'select' && 'Choose your preferred input method'}
                {mode === 'scan' && 'Extract multiple transactions from screenshots using AI'}
                {mode === 'manual' && 'Rapid spreadsheet table entry without AI'}
                {mode === 'review' && 'Review, edit, and confirm candidate transactions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'manual' && (
              <button
                type="button"
                onClick={() => setMode('review')}
                disabled={rows.length === 0}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <span>Proceed to Review ({rows.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleRequestClose}
              className="p-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* ================= MODE: SELECT ================= */}
          {mode === 'select' && (
            <div className="py-6 sm:py-8 max-w-2xl mx-auto space-y-6 text-center">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                  How would you like to add transactions?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Import multiple transactions rapidly via AI scans or offline table entry.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {/* Option A: Scan */}
                <button
                  type="button"
                  onClick={handleStartScan}
                  className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/80 dark:hover:border-blue-500/80 bg-white dark:bg-slate-900/90 hover:bg-slate-50/50 dark:hover:bg-slate-800/60 transition-all group flex flex-col justify-between cursor-pointer shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform border border-blue-100 dark:border-blue-900/40">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 dark:text-white text-base">Scan Transactions</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                          AI
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Upload single or multiple screenshots (bank statements, UPI, receipts) and let Clarity extract transactions automatically.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Upload screenshots</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </button>

                {/* Option B: Manual Bulk Entry */}
                <button
                  type="button"
                  onClick={handleStartManual}
                  className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/80 dark:hover:border-blue-500/80 bg-white dark:bg-slate-900/90 hover:bg-slate-50/50 dark:hover:bg-slate-800/60 transition-all group flex flex-col justify-between cursor-pointer shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:scale-105 transition-transform border border-slate-200/80 dark:border-slate-700/80">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 dark:text-white text-base">Manual Bulk Entry</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                          Offline
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Enter multiple transactions quickly using a keyboard-friendly spreadsheet table. Works completely offline without AI.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-all">
                    <span>Open spreadsheet</span>
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ================= MODE: SCAN ================= */}
          {mode === 'scan' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Privacy Warning Banner (Requirement 4) */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3 shadow-sm">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950 dark:text-amber-100 mb-0.5">Privacy Notice</h4>
                  <p className="leading-relaxed">
                    Before uploading: Redact or blur sensitive information you don&apos;t want processed, such as UPI IDs, account numbers, phone numbers, QR codes, or unrelated transactions.
                  </p>
                </div>
              </div>

              {/* Active Connection Info Badge */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-slate-500 dark:text-slate-400">AI Connection:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {isProxy
                      ? (resolvedAiConfig.activeProxy ? `${resolvedAiConfig.activeProxy.name} (${resolvedAiConfig.activeProxy.model})` : 'Proxy (None selected)')
                      : 'Google Gemini (Direct)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenApiKeyModal}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Unconfigured Notice */}
              {!isConfigured && (
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/40 text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>
                      {isProxy
                        ? 'An active proxy configuration is required for AI Screenshot scanning.'
                        : 'A Gemini API key is required for AI Screenshot scanning.'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onOpenApiKeyModal}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                    >
                      {isProxy ? 'Select Proxy' : 'Set API Key'}
                    </button>
                    <button
                      type="button"
                      onClick={handleStartManual}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Switch to Manual Entry
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Dropzone */}
              <div
                onClick={() => !isScanning && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                  isScanning
                    ? 'border-blue-400 bg-blue-50/30 dark:bg-blue-950/20 cursor-wait'
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-500/80 dark:hover:border-blue-500/80 bg-slate-50/60 dark:bg-slate-900/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={isScanning}
                  className="hidden"
                />
                <div className="w-11 h-11 mx-auto rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 border border-blue-100 dark:border-blue-900/40">
                  {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-1">
                  {isScanning ? 'Processing Screenshots...' : 'Upload Transaction Screenshots'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-3">
                  Click or drag and drop single or multiple image files (PNG, JPG, WebP)
                </p>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                  Multiple screenshots supported
                </div>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Selected Files ({selectedFiles.length})</span>
                    {!isScanning && (
                      <button
                        type="button"
                        onClick={() => setSelectedFiles([])}
                        className="text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{file.name}</span>
                          <span className="text-slate-400 text-[10px]">
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        {!isScanning && (
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(idx)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scanning Progress & Error */}
              {isScanning && scanProgress && (
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 space-y-2 animate-pulse">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                      {scanProgress.status}
                    </span>
                    <span className="tabular-nums">
                      {scanProgress.current} / {scanProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-blue-100 dark:bg-blue-950/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, ((scanProgress.current || 1) / (scanProgress.total || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Error fallback with Try Again & Manual Entry (Requirements 6 & 23) */}
              {scanError && (
                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 space-y-3">
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        {isProxy
                          ? "Couldn't scan these images using the active proxy."
                          : "Couldn't scan these images right now."}
                      </p>
                      <p className="text-xs opacity-90 mt-0.5">{scanError}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={handleRunScan}
                      disabled={selectedFiles.length === 0}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                    >
                      Try Again
                    </button>
                    {isProxy && (
                      <button
                        type="button"
                        onClick={onOpenApiKeyModal}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                      >
                        Switch Proxy
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleStartManual}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Switch to Manual Bulk Entry
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleStartManual}
                  disabled={isScanning}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Enter Manually Instead
                </button>
                <button
                  type="button"
                  onClick={handleRunScan}
                  disabled={isScanning || selectedFiles.length === 0 || !isConfigured}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition-all shadow-2xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scanning with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Scan {selectedFiles.length > 0 ? `${selectedFiles.length} Screenshot(s)` : ''}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= MODE: MANUAL ================= */}
          {mode === 'manual' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Spreadsheet Entry
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter transactions line by line. Fast keyboard navigation (Tab between fields).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addManualRow}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Add Row</span>
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800 dk-border-slate-700 bg-white dark:bg-slate-900 dk-bg-slate-800 dark:text-white dk-text-white shadow-2xs">
                <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 min-w-[720px]">
                  <thead className="bg-slate-50/90 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200/90 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5 w-10 text-center font-medium text-slate-400 dark:text-slate-500">#</th>
                      <th className="p-2.5 w-36">Date</th>
                      <th className="p-2.5 min-w-[150px]">Description / Note</th>
                      <th className="p-2.5 w-32">
                        <span className="flex items-center gap-1">
                          {CurrencyIcon && <CurrencyIcon className="w-3.5 h-3.5" />}
                          Amount
                        </span>
                      </th>
                      <th className="p-2.5 w-28">Type</th>
                      <th className="p-2.5 w-36">Category</th>
                      <th className="p-2.5 w-32">Payment</th>
                      <th className="p-2.5 w-20 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 bg-white dark:bg-slate-900">
                    {rows.map((row, idx) => {
                      const cats = row.type === 'income' ? incomeSources : expenseCategories;
                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="p-2 text-center text-slate-400 dark:text-slate-500 font-medium tabular-nums text-xs">
                            {idx + 1}
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              value={row.date || ''}
                              onChange={(e) => updateRow(row.id, { date: e.target.value })}
                              className="w-full h-8 px-2.5 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] transition-colors"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="e.g. Swiggy, Salary"
                              value={row.note || ''}
                              onChange={(e) => updateRow(row.id, { note: e.target.value })}
                              className="w-full h-8 px-2.5 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              placeholder="0.00"
                              value={row.amount}
                              onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                              className="w-full h-8 px-2.5 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold tabular-nums text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={row.type || 'expense'}
                              onChange={(e) => {
                                const newType = e.target.value;
                                const defaultCat = newType === 'income' ? (incomeSources[0]?.id || 'salary') : (expenseCategories[0]?.id || 'food');
                                updateRow(row.id, { type: newType, category: defaultCat });
                              }}
                              className="w-full h-8 px-2 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 rounded-lg text-xs font-semibold outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white transition-colors cursor-pointer"
                            >
                              <option value="expense">Expense</option>
                              <option value="income">Income</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <select
                              value={row.category || (row.type === 'income' ? 'salary' : 'food')}
                              onChange={(e) => updateRow(row.id, { category: e.target.value })}
                              className="w-full h-8 px-2 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white transition-colors cursor-pointer"
                            >
                              {cats.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <select
                              value={row.paymentMethod || 'upi'}
                              onChange={(e) => updateRow(row.id, { paymentMethod: e.target.value })}
                              className="w-full h-8 px-2 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white transition-colors cursor-pointer"
                            >
                              {paymentMethods.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => duplicateRow(row.id)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                title="Duplicate row"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteRow(row.id)}
                                disabled={rows.length === 1}
                                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-30 cursor-pointer"
                                title="Delete row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom bar in manual mode */}
              <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addManualRow}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Add Row</span>
                  </button>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {rows.length} {rows.length === 1 ? 'row' : 'rows'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('review')}
                  disabled={rows.length === 0}
                  className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  Review & Validate ({rows.length} rows) &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ================= MODE: REVIEW ================= */}
          {mode === 'review' && (
            <div className="space-y-4">
              {/* Summary Metrics Bar (Requirement 18) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                    Selected To Add
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    {validation.readyCount} / {validation.selectedCount} ready
                  </span>
                  {validation.excludedCount > 0 && (
                    <span className="text-[11px] text-slate-400 block">
                      ({validation.excludedCount} excluded)
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                    Income
                  </span>
                  <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +{formatMoney(validation.totalIncome)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                    Expenses
                  </span>
                  <span className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                    &minus;{formatMoney(validation.totalExpense)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                    Status
                  </span>
                  {validation.errorCount > 0 ? (
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{validation.errorCount} need attention</span>
                    </span>
                  ) : validation.selectedCount === 0 ? (
                    <span className="text-xs font-semibold text-slate-500 mt-1 block">
                      0 rows selected
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Ready to import</span>
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 block mt-0.5 tabular-nums">
                    Available cash: {formatMoney(validation.startingBalance)}
                  </span>
                </div>
              </div>

              {/* Filter Tabs & Quick Actions */}
              <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setReviewFilter('all')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      reviewFilter === 'all'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                    }`}
                  >
                    All ({rows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewFilter('selected')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      reviewFilter === 'selected'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                    }`}
                  >
                    Selected ({validation.selectedCount})
                  </button>
                  {validation.errorCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setReviewFilter('attention')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        reviewFilter === 'attention'
                          ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs font-semibold'
                          : 'text-rose-500 dark:text-rose-400 font-medium'
                      }`}
                    >
                      Needs Attention ({validation.errorCount})
                    </button>
                  )}
                  {validation.duplicateCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setReviewFilter('duplicates')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        reviewFilter === 'duplicates'
                          ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs font-semibold'
                          : 'text-amber-500 dark:text-amber-400 font-medium'
                      }`}
                    >
                      Duplicates ({validation.duplicateCount})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={addManualRow}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>
              </div>

              {/* Review Table Container */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800">
                <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 min-w-[760px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200/90 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={rows.length > 0 && rows.every(r => r.selected)}
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                        />
                      </th>
                      <th className="p-2.5 w-32">Date</th>
                      <th className="p-2.5 min-w-[130px]">Description / Note</th>
                      <th className="p-2.5 w-28">
                        <span className="flex items-center gap-1">
                          {CurrencyIcon && <CurrencyIcon className="w-3.5 h-3.5" />}
                          Amount
                        </span>
                      </th>
                      <th className="p-2.5 w-24">Type</th>
                      <th className="p-2.5 w-36">Category</th>
                      <th className="p-2.5 w-28">Payment</th>
                      <th className="p-2.5 min-w-[140px]">Validation / Status</th>
                      <th className="p-2.5 w-14 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                    {displayRows.map((row) => {
                      const rowError = validation.errorsByRowId[row.id];
                      const cats = row.type === 'income' ? incomeSources : expenseCategories;
                      return (
                        <tr
                          key={row.id}
                          className={`transition-colors ${
                            !row.selected
                              ? 'opacity-50 bg-slate-50/50 dark:bg-slate-900/30'
                              : rowError
                              ? 'bg-rose-50/60 dark:bg-rose-950/20'
                              : row.isDuplicate
                              ? 'bg-amber-50/60 dark:bg-amber-950/20'
                              : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(row.selected)}
                              onChange={(e) => updateRow(row.id, { selected: e.target.checked })}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              value={row.date || ''}
                              onChange={(e) => updateRow(row.id, { date: e.target.value })}
                              className={`w-full px-2 py-1 bg-slate-50 dark:bg-slate-800/80 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium ${
                                !row.date ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-slate-700/80'
                              } text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]`}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.note || ''}
                              placeholder="e.g. Swiggy"
                              onChange={(e) => updateRow(row.id, { note: e.target.value })}
                              className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={row.amount}
                              onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                              className={`w-full px-2 py-1 bg-slate-50 dark:bg-slate-800/80 border rounded-lg text-xs font-semibold tabular-nums outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                                !row.amount || Number(row.amount) <= 0
                                  ? 'border-rose-400 dark:border-rose-500'
                                  : 'border-slate-200 dark:border-slate-700/80'
                              } text-slate-900 dark:text-white placeholder:text-slate-400`}
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={row.type || 'expense'}
                              onChange={(e) => {
                                const newType = e.target.value;
                                const defaultCat = newType === 'income' ? (incomeSources[0]?.id || 'salary') : (expenseCategories[0]?.id || 'food');
                                updateRow(row.id, { type: newType, category: defaultCat });
                              }}
                              className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white cursor-pointer"
                            >
                              <option value="expense">Expense</option>
                              <option value="income">Income</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <select
                              value={row.category || (row.type === 'income' ? 'salary' : 'food')}
                              onChange={(e) => updateRow(row.id, { category: e.target.value })}
                              className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white cursor-pointer"
                            >
                              {cats.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <select
                              value={row.paymentMethod || 'upi'}
                              onChange={(e) => updateRow(row.id, { paymentMethod: e.target.value })}
                              className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white cursor-pointer"
                            >
                              {paymentMethods.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <div className="space-y-1">
                              {rowError && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40">
                                  <AlertCircle className="w-3 h-3 shrink-0" />
                                  <span>{rowError}</span>
                                </span>
                              )}
                              {row.isDuplicate && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40"
                                  title={row.duplicateReason}
                                >
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>Possible duplicate</span>
                                </span>
                              )}
                              {row.needsReview && !rowError && !row.isDuplicate && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                                  <HelpCircle className="w-3 h-3 shrink-0" />
                                  <span>{row.uncertainReason || 'Review'}</span>
                                </span>
                              )}
                              {!rowError && !row.isDuplicate && !row.needsReview && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                                  <Check className="w-3 h-3 shrink-0" />
                                  <span>Valid</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => deleteRow(row.id)}
                              className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Duplicate Information Note */}
              {validation.duplicateCount > 0 && (
                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    Detected {validation.duplicateCount} possible duplicate(s). Duplicates are unselected by default to prevent accidental double entry; check the box if you want to import them.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {mode === 'review' && (
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-3xl flex items-center justify-between gap-4 flex-wrap shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRequestClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {rows.some(r => r.id.startsWith('draft-')) && (
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className="px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Edit in Table View
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCommit}
                disabled={!validation.isValid || validation.errorCount > 0}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition-all shadow-2xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {validation.errorCount > 0
                    ? `Fix ${validation.errorCount} Error(s) to Add`
                    : `Add ${validation.readyCount} Transaction${validation.readyCount === 1 ? '' : 's'}`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Discard Confirmation Dialog (Requirement 30) */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-[90] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200/90 dark:border-slate-800 space-y-4 animate-fade-in-up">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Discard Unsaved Transactions?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You have {rows.length} uncommitted transaction(s). If you close now, your draft will be discarded.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-2xs cursor-pointer"
              >
                Discard &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BulkAddModal(props) {
  if (!props.isOpen) return null;
  return <BulkAddModalContent {...props} />;
}
