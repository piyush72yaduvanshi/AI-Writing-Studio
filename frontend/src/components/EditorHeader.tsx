import React from 'react';
import { 
  History, 
  Check, 
  Clock, 
  BookOpen
} from 'lucide-react';
import { WritingMode, WritingLanguage, WritingTone } from '../types/document';

interface EditorHeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  mode: WritingMode;
  onModeChange: (newMode: WritingMode) => void;
  language: WritingLanguage;
  onLanguageChange: (newLanguage: WritingLanguage) => void;
  tone: WritingTone;
  onToneChange: (newTone: WritingTone) => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onOpenVersions: () => void;
  useRag: boolean;
  onToggleRag: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  title,
  onTitleChange,
  mode,
  onModeChange,
  language,
  onLanguageChange,
  tone,
  onToneChange,
  isSaving,
  hasUnsavedChanges,
  onOpenVersions,
  useRag,
  onToggleRag,
}) => {
  return (
    <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-2.5 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Document Title & Save status */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled Document..."
            className="w-full max-w-md bg-transparent text-lg font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded px-2 py-0.5 border border-transparent hover:border-slate-800 transition-colors"
          />

          {/* Save Status Badge */}
          <div className="flex items-center text-xs text-slate-400 shrink-0">
            {isSaving ? (
              <span className="flex items-center text-amber-400">
                <Clock className="h-3 w-3 mr-1 animate-spin" /> Saving...
              </span>
            ) : hasUnsavedChanges ? (
              <span className="flex items-center text-slate-400">
                <span className="h-2 w-2 rounded-full bg-amber-400/80 mr-1.5" /> Unsaved
              </span>
            ) : (
              <span className="flex items-center text-emerald-400">
                <Check className="h-3 w-3 mr-1" /> Saved
              </span>
            )}
          </div>
        </div>

        {/* Controls: Mode, Language, Tone, RAG & Versions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Writing Mode */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Mode:</span>
            <select
              value={mode}
              onChange={(e) => onModeChange(e.target.value as WritingMode)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="blog" className="bg-slate-900 text-white">Blog</option>
              <option value="article" className="bg-slate-900 text-white">Article</option>
              <option value="story" className="bg-slate-900 text-white">Story</option>
              <option value="movie_web_series" className="bg-slate-900 text-white">Movie / Web Series</option>
              <option value="screenplay" className="bg-slate-900 text-white">Screenplay Draft</option>
              <option value="custom" className="bg-slate-900 text-white">Custom</option>
            </select>
          </div>

          {/* Language Selector */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Lang:</span>
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as WritingLanguage)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="English" className="bg-slate-900 text-white">English</option>
              <option value="Hindi" className="bg-slate-900 text-white">Hindi (Devanagari)</option>
              <option value="Hinglish" className="bg-slate-900 text-white">Hinglish (Colloquial)</option>
            </select>
          </div>

          {/* Tone Selector */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Tone:</span>
            <select
              value={tone}
              onChange={(e) => onToneChange(e.target.value as WritingTone)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="Simple" className="bg-slate-900 text-white">Simple</option>
              <option value="Professional" className="bg-slate-900 text-white">Professional</option>
              <option value="Friendly" className="bg-slate-900 text-white">Friendly</option>
              <option value="Creative" className="bg-slate-900 text-white">Creative</option>
              <option value="Formal" className="bg-slate-900 text-white">Formal</option>
              <option value="Casual" className="bg-slate-900 text-white">Casual</option>
              <option value="Cinematic" className="bg-slate-900 text-white">Cinematic</option>
              <option value="Emotional" className="bg-slate-900 text-white">Emotional</option>
              <option value="Technical" className="bg-slate-900 text-white">Technical</option>
            </select>
          </div>

          {/* Open Knowledge Toggle */}
          <button
            onClick={onToggleRag}
            title={useRag ? "Open Knowledge Active (Guiding style, lore & tone)" : "Open Knowledge Disabled"}
            className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors ${
              useRag
                ? 'border-indigo-500/50 bg-indigo-950/40 text-indigo-300 font-medium'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className={`h-3 w-3 ${useRag ? 'text-indigo-400' : ''}`} />
            <span>Knowledge {useRag ? 'Active' : 'Off'}</span>
          </button>

          {/* Active Cloud AI Provider Badge */}
          <a
            href="/settings"
            title="Configure AI Models & Keys in Settings"
            className="flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-md border border-indigo-500/30 bg-indigo-950/30 text-indigo-300 hover:border-indigo-500/60 transition-colors"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium capitalize">{localStorage.getItem('custom_ai_provider') || 'OpenRouter'}</span>
          </a>

          {/* Version History Button */}
          <button
            onClick={onOpenVersions}
            className="flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-md border border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          >
            <History className="h-3.5 w-3.5 text-brand-400" />
            <span>Versions</span>
          </button>
        </div>
      </div>
    </div>
  );
};
