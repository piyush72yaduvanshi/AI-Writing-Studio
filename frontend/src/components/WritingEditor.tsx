import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Trash2, 
  ArrowLeftRight, 
  Sparkles,
  Download,
  Columns,
  Clock,
  BookOpen,
  FileDown
} from 'lucide-react';
import { AIResponseData } from '../types/ai';

interface WritingEditorProps {
  content: string;
  onContentChange: (newContent: string) => void;
  aiResult: string;
  onAiResultChange?: (newResult: string) => void;
  onApplyToOriginal?: (appliedText: string) => void;
  isGenerating: boolean;
  lastAiMeta: AIResponseData | null;
  onQuickPrompt?: (prompt: string) => void;
}

export const WritingEditor: React.FC<WritingEditorProps> = ({
  content,
  onContentChange,
  aiResult,
  onApplyToOriginal,
  isGenerating,
  lastAiMeta,
  onQuickPrompt,
}) => {
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<'original' | 'result'>('original');
  const [viewMode, setViewMode] = useState<'split' | 'original' | 'result'>('split');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Advanced writing metrics
  const originalWords = content.trim() ? content.trim().split(/\s+/).length : 0;
  const originalChars = content.length;
  const readingTimeMin = Math.ceil(originalWords / 200) || 1;

  const resultWords = aiResult.trim() ? aiResult.trim().split(/\s+/).length : 0;

  // Heuristic Readability Score
  const getReadability = () => {
    if (originalWords < 10) return { label: 'Draft', color: 'text-slate-400 bg-slate-800' };
    const avgWordLen = originalChars / originalWords;
    if (avgWordLen > 6.2) return { label: 'Advanced Literary', color: 'text-purple-400 bg-purple-950/60 border-purple-800/50' };
    if (avgWordLen > 4.8) return { label: 'Standard Editorial', color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/50' };
    return { label: 'Conversational & Clean', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50' };
  };

  const readability = getReadability();

  // Clipboard copy handler with "Copied!" feedback
  const handleCopy = async () => {
    if (!aiResult) return;
    try {
      await navigator.clipboard.writeText(aiResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Download export handlers
  const handleDownload = (format: 'md' | 'txt') => {
    const textToExport = aiResult || content;
    if (!textToExport) return;
    const blob = new Blob([textToExport], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `draft-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  const handleClear = () => {
    if (content && window.confirm('Are you sure you want to clear your writing?')) {
      onContentChange('');
    }
  };

  const handleApplyToOriginal = () => {
    if (!aiResult) return;
    if (onApplyToOriginal) {
      onApplyToOriginal(aiResult);
    } else {
      onContentChange(aiResult);
    }
    setMobileTab('original');
  };

  const quickPrompts = [
    "Make the scene dialogue subtext-heavy",
    "Hook the reader with a visceral dilemma",
    "Tighten pacing & eliminate passive verbs",
    "Deepen character psychological conflict"
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-12rem)] min-h-[500px]">
      {/* Top Analytics & View Modes Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 py-2 text-xs text-slate-400 gap-2 shrink-0">
        {/* Left: Writing metrics */}
        <div className="flex items-center space-x-3 overflow-x-auto py-0.5">
          <span className="font-mono text-slate-300 font-semibold flex items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400 mr-1.5" />
            {originalWords} <span className="text-slate-500 font-normal ml-1">words</span>
          </span>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <span className="font-mono text-slate-400 hidden sm:inline">
            {originalChars} chars
          </span>
          <span className="text-slate-700 hidden md:inline">•</span>
          <span className="flex items-center text-slate-400 hidden md:flex font-mono" title="Estimated reading time">
            <Clock className="h-3 w-3 mr-1 text-slate-500" />
            ~{readingTimeMin}m read
          </span>
          <span className="text-slate-700 hidden lg:inline">•</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border hidden lg:inline-flex items-center ${readability.color}`}>
            <BookOpen className="h-2.5 w-2.5 mr-1" />
            {readability.label}
          </span>
        </div>

        {/* Right: Layout Switcher & Export */}
        <div className="flex items-center space-x-2">
          {/* Desktop View Mode Controls */}
          <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('split')}
              title="Split Dual-Pane View"
              className={`px-2 py-1 rounded text-xs transition-colors flex items-center space-x-1 ${
                viewMode === 'split' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="h-3 w-3" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('original')}
              title="Focus Original Draft"
              className={`px-2 py-1 rounded text-xs transition-colors flex items-center space-x-1 ${
                viewMode === 'original' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Draft</span>
            </button>
            <button
              onClick={() => setViewMode('result')}
              title="Focus AI Result"
              className={`px-2 py-1 rounded text-xs transition-colors flex items-center space-x-1 ${
                viewMode === 'result' ? 'bg-indigo-950/70 text-indigo-300 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Result</span>
            </button>
          </div>

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              title="Export writing options"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs"
            >
              <Download className="h-3 w-3" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-800 bg-slate-900 shadow-xl z-50 py-1.5 text-xs text-slate-200">
                <button
                  onClick={() => handleDownload('md')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center space-x-2 transition-colors"
                >
                  <FileDown className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Download Markdown (.md)</span>
                </button>
                <button
                  onClick={() => handleDownload('txt')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center space-x-2 transition-colors"
                >
                  <FileDown className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Download Plain Text (.txt)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tab Toggle */}
      <div className="flex md:hidden border-b border-slate-800 bg-slate-950 px-4">
        <button
          onClick={() => setMobileTab('original')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
            mobileTab === 'original'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Original ({originalWords} words)
        </button>
        <button
          onClick={() => setMobileTab('result')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center space-x-1.5 ${
            mobileTab === 'result'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>AI Result</span>
          {isGenerating && <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />}
        </button>
      </div>

      {/* Editor Split Panes */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-slate-950 overflow-hidden">
        {/* Left Pane: Original Input */}
        <div
          className={`flex flex-col h-full ${
            viewMode === 'result' ? 'hidden' : viewMode === 'original' ? 'flex md:col-span-2' : ''
          } ${mobileTab === 'original' ? 'flex' : 'hidden md:flex'}`}
        >
          {/* Pane Top Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/30 px-4 py-2 text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-slate-300">
              Original Writing (Draft / Hinglish / Notes)
            </span>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleClear}
                disabled={!content}
                title="Clear draft"
                className="text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Write freely in English, Hindi, or conversational Hinglish...&#10;&#10;e.g., 'mera character ek introvert ladka hai jisko radio astronomy ka shauk hai...'"
            className="flex-1 w-full resize-none bg-slate-950 p-4 sm:p-6 text-sm sm:text-base text-slate-100 placeholder-slate-600 focus:outline-none font-serif leading-relaxed"
            spellCheck={false}
          />

          {/* Quick Action Prompt Chips */}
          {onQuickPrompt && (
            <div className="border-t border-slate-900 bg-slate-950/60 p-2 overflow-x-auto flex items-center space-x-1.5 text-[11px]">
              <span className="text-slate-500 shrink-0 font-medium mr-1 flex items-center">
                <Sparkles className="h-3 w-3 mr-1 text-indigo-400" /> Quick Polish:
              </span>
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => onQuickPrompt(qp)}
                  className="shrink-0 px-2 py-0.5 rounded-md border border-slate-800/80 bg-slate-900/40 hover:bg-indigo-950/30 hover:border-indigo-500/40 text-slate-400 hover:text-indigo-300 transition-all cursor-pointer"
                >
                  {qp}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Pane: AI Result */}
        <div
          className={`flex flex-col h-full bg-slate-900/20 ${
            viewMode === 'original' ? 'hidden' : viewMode === 'result' ? 'flex md:col-span-2' : ''
          } ${mobileTab === 'result' ? 'flex' : 'hidden md:flex'}`}
        >
          {/* Pane Top Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40 px-4 py-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-semibold uppercase tracking-wider text-indigo-300 flex items-center">
                <Sparkles className="h-3.5 w-3.5 mr-1 text-indigo-400" /> AI Result
              </span>
              {lastAiMeta && !isGenerating && (
                <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                  {lastAiMeta.model} • {(lastAiMeta.duration_ms / 1000).toFixed(1)}s
                  {lastAiMeta.cached && ' • cached'}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {aiResult && (
                <>
                  <span className="text-[11px] font-mono text-slate-500 mr-2">
                    {resultWords} words
                  </span>
                  <button
                    onClick={handleApplyToOriginal}
                    title="Send generated text back to original draft for further editing"
                    className="flex items-center space-x-1 text-xs px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    <ArrowLeftRight className="h-3 w-3" />
                    <span className="hidden sm:inline">Use as Draft</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    id="copy-result-button"
                    className={`flex items-center space-x-1 text-xs px-3 py-1 rounded font-medium transition-all ${
                      copied
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm hover:shadow-brand-500/20'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* AI Result Area / Loading State */}
          <div className="flex-1 relative flex flex-col overflow-auto">
            {isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10 px-4">
                <div className="relative mb-3">
                  <div className="h-10 w-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <Sparkles className="h-4 w-4 text-indigo-400 absolute inset-0 m-auto" />
                </div>
                <p className="text-sm font-medium text-slate-200">AI generation in progress...</p>
                <p className="text-xs text-slate-400 mt-1">Processing nuances, style & structure...</p>
              </div>
            ) : null}

            {aiResult ? (
              <div className="p-4 sm:p-6 text-sm sm:text-base text-slate-100 font-serif leading-relaxed whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
                {aiResult}
              </div>
            ) : !isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6 text-slate-600" />
                </div>
                <h4 className="text-sm font-semibold text-slate-400">Ready for Transformation</h4>
                <p className="text-xs max-w-sm mt-1 text-slate-500">
                  Select an AI action from the toolbar below (e.g., Improve, Fix Grammar, Screenplay Draft, Translate) to generate polished prose.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
