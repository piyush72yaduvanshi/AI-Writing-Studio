import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';
import { ReferenceCategory } from '../types/reference';

interface ReferenceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload?: (formData: FormData) => Promise<any>;
}

export const ReferenceUploadModal: React.FC<ReferenceUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReferenceCategory>('guidelines');
  const [textContent, setTextContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a descriptive title for this Open Knowledge entry.');
      return;
    }
    if (!file && !textContent.trim()) {
      setError('Please attach a file (.txt, .md, .pdf, .docx) or paste knowledge directives.');
      return;
    }

    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('category', category);
    if (textContent.trim()) formData.append('text_content', textContent.trim());
    if (file) formData.append('file', file);
    formData.append('async_index', 'true');

    try {
      if (onUpload) {
        await onUpload(formData);
      }
      onClose();
      setTitle('');
      setTextContent('');
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save Open Knowledge entry.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-semibold text-white">Add Open Knowledge Entry</h3>
              <p className="text-[11px] text-slate-400">Attach style rules, story bibles, or formatting blueprints</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Knowledge Entry Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Bollywood Screenplay Standard, Hinglish Tone Guidelines"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Knowledge Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReferenceCategory)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="guidelines">Style & Voice Guidelines</option>
              <option value="storytelling">Story Bible & Character Lore</option>
              <option value="screenplay_rules">Screenplay & Scene Blueprint</option>
              <option value="blog_standards">Blog & Article Blueprint</option>
              <option value="formatting">Formatting Examples & Lexicon</option>
              <option value="user_custom">Custom Author Knowledge</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Upload Document File (.txt, .md, .pdf, .docx)
            </label>
            <input
              type="file"
              accept=".txt,.md,.markdown,.pdf,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
            />
            {file && (
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Or Paste Markdown Knowledge Directives
            </label>
            <textarea
              rows={4}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste style rules, character bibles, scene conventions, or vocabulary guidelines here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors shadow-md shadow-indigo-600/20"
            >
              {isUploading ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-1" />
                  <span>Saving Entry...</span>
                </>
              ) : (
                <span>Save to Knowledge Vault</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
