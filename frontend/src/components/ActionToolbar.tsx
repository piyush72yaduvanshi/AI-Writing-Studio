import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCheck, 
  RefreshCw, 
  Languages, 
  Clapperboard, 
  BookOpen, 
  Send,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { AIAction } from '../types/ai';

interface ActionToolbarProps {
  onAction: (action: AIAction, customInstruction?: string) => void;
  isGenerating: boolean;
  contentLength: number;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  onAction,
  isGenerating,
  contentLength,
}) => {
  const [customInstruction, setCustomInstruction] = useState('');
  const [showMoreActions, setShowMoreActions] = useState(false);

  const handleActionClick = (action: AIAction) => {
    onAction(action, customInstruction.trim() || undefined);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInstruction.trim() || isGenerating) return;
    onAction('improve', customInstruction.trim());
  };

  const hasContent = contentLength > 0;

  return (
    <div className="border-t border-slate-800 bg-slate-950 p-3 sm:p-4">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {/* Custom Instruction Bar */}
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="Custom instructions (optional, e.g., 'Make dialogue snarkier', 'Emphasize the mystery')..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          {customInstruction.trim() && (
            <button
              type="submit"
              disabled={isGenerating || !hasContent}
              className="bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 disabled:opacity-50 transition-colors"
            >
              <Send className="h-3 w-3" />
              <span>Apply</span>
            </button>
          )}
        </form>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleActionClick('improve')}
            disabled={isGenerating || !hasContent}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm disabled:opacity-40 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Improve Writing</span>
          </button>

          <button
            onClick={() => handleActionClick('fix_grammar')}
            disabled={isGenerating || !hasContent}
            className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Fix Grammar</span>
          </button>

          <button
            onClick={() => handleActionClick('rewrite')}
            disabled={isGenerating || !hasContent}
            className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
            <span>Rewrite</span>
          </button>

          <button
            onClick={() => handleActionClick('translate')}
            disabled={isGenerating || !hasContent}
            className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
          >
            <Languages className="h-3.5 w-3.5 text-blue-400" />
            <span>Translate</span>
          </button>

          <button
            onClick={() => handleActionClick('convert_to_screenplay')}
            disabled={isGenerating || !hasContent}
            className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
          >
            <Clapperboard className="h-3.5 w-3.5 text-rose-400" />
            <span>Screenplay Draft</span>
          </button>

          <button
            onClick={() => handleActionClick('convert_to_story')}
            disabled={isGenerating || !hasContent}
            className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5 text-purple-400" />
            <span>Story Mode</span>
          </button>

          <button
            onClick={() => setShowMoreActions(!showMoreActions)}
            className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 text-xs px-2 py-1.5 ml-auto transition-colors"
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span>More Actions</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${showMoreActions ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Secondary Expandable Action Buttons */}
        {showMoreActions && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 animate-in fade-in slide-in-from-top-1">
            <button
              onClick={() => handleActionClick('simplify')}
              disabled={isGenerating || !hasContent}
              className="text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-800 disabled:opacity-40"
            >
              Simplify
            </button>
            <button
              onClick={() => handleActionClick('expand')}
              disabled={isGenerating || !hasContent}
              className="text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-800 disabled:opacity-40"
            >
              Expand
            </button>
            <button
              onClick={() => handleActionClick('shorten')}
              disabled={isGenerating || !hasContent}
              className="text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-800 disabled:opacity-40"
            >
              Shorten
            </button>
            <button
              onClick={() => handleActionClick('summarize')}
              disabled={isGenerating || !hasContent}
              className="text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-800 disabled:opacity-40"
            >
              Summarize
            </button>
            <button
              onClick={() => handleActionClick('generate_title')}
              disabled={isGenerating || !hasContent}
              className="text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-800 disabled:opacity-40"
            >
              Generate Title
            </button>
            <button
              onClick={() => handleActionClick('generate_intro')}
              disabled={isGenerating || !hasContent}
              className="text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-800 disabled:opacity-40"
            >
              Generate Introduction
            </button>
            <button
              onClick={() => handleActionClick('generate_conclusion')}
              disabled={isGenerating || !hasContent}
              className="text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-800 disabled:opacity-40"
            >
              Generate Conclusion
            </button>
            <button
              onClick={() => handleActionClick('generate_outline')}
              disabled={isGenerating || !hasContent}
              className="text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-800 disabled:opacity-40"
            >
              Generate Outline
            </button>
            <button
              onClick={() => handleActionClick('convert_to_blog')}
              disabled={isGenerating || !hasContent}
              className="text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-800 disabled:opacity-40"
            >
              Convert to Blog Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
