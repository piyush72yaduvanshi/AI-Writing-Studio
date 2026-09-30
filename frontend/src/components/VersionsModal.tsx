import React, { useState } from 'react';
import { X, History, RotateCcw } from 'lucide-react';
import { DocumentVersion } from '../types/document';

interface VersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: DocumentVersion[];
  onRestore: (versionId: string) => Promise<void>;
  onCreateCheckpoint: (summary: string) => Promise<void>;
}

export const VersionsModal: React.FC<VersionsModalProps> = ({
  isOpen,
  onClose,
  versions,
  onRestore,
  onCreateCheckpoint,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [checkpointSummary, setCheckpointSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRestore = async (versionId: string) => {
    if (window.confirm('Restore this version? A backup checkpoint of your current state will be created automatically.')) {
      setIsSubmitting(true);
      try {
        await onRestore(versionId);
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkpointSummary.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateCheckpoint(checkpointSummary.trim());
      setCheckpointSummary('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="flex flex-col h-[85vh] w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-brand-400" />
            <h3 className="text-base font-semibold text-white">Document Version History</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Create Manual Checkpoint */}
        <div className="border-b border-slate-800 bg-slate-950/50 px-6 py-3">
          <form onSubmit={handleCreateSnapshot} className="flex gap-2">
            <input
              type="text"
              value={checkpointSummary}
              onChange={(e) => setCheckpointSummary(e.target.value)}
              placeholder="Save current state as named snapshot (e.g. 'Completed Scene 1')..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={isSubmitting || !checkpointSummary.trim()}
              className="bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-medium px-3 py-1.5 rounded-md"
            >
              Save Snapshot
            </button>
          </form>
        </div>

        {/* Content Body: Split list & preview */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Version List */}
          <div className="w-full md:w-80 overflow-y-auto p-4 space-y-2">
            {versions.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                No saved versions yet. Versions are created automatically during major AI transformations or manually above.
              </p>
            ) : (
              versions.map((ver) => {
                const isSelected = selectedVersion?.id === ver.id;
                return (
                  <div
                    key={ver.id}
                    onClick={() => setSelectedVersion(ver)}
                    className={`cursor-pointer rounded-lg p-3 text-left border transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-950/20'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">v{ver.version_number}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(ver.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-300 truncate">{ver.change_summary}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {ver.content.split(/\s+/).filter(Boolean).length} words
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Preview Pane */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/30">
            {selectedVersion ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-2.5 bg-slate-900/40">
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      Version {selectedVersion.version_number}: {selectedVersion.change_summary}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Saved on {new Date(selectedVersion.created_at).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRestore(selectedVersion.id)}
                    disabled={isSubmitting}
                    className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restore This Version</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 font-serif text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedVersion.content || (
                    <span className="italic text-slate-500">No draft content in this version.</span>
                  )}

                  {selectedVersion.ai_result && (
                    <div className="mt-6 pt-6 border-t border-slate-800">
                      <h5 className="text-xs font-sans font-semibold uppercase text-indigo-400 mb-2">AI Result at this version:</h5>
                      <div className="text-slate-300">{selectedVersion.ai_result}</div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-500 text-xs">
                Select a version on the left to preview its content and restore it.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
