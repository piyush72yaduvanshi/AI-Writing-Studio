import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BookOpen, 
  Upload, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Globe,
  Download,
  Eye,
  X,
  Copy,
  Check,
  FileCode,
  Sparkles
} from 'lucide-react';
import { referencesApi } from '../api/references';
import { ReferenceUploadModal } from '../components/ReferenceUploadModal';
import { WritingReference } from '../types/reference';

export const ReferencesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewingRef, setViewingRef] = useState<WritingReference | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: references = [], isLoading } = useQuery({
    queryKey: ['references', selectedCategory],
    queryFn: () => referencesApi.list(selectedCategory || undefined),
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasProcessing = data?.some((r) => r.status === 'PROCESSING' || r.status === 'PENDING');
      return hasProcessing ? 1000 : false;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => referencesApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => referencesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references'] });
    },
  });

  const reindexMutation = useMutation({
    mutationFn: (id: string) => referencesApi.reindex(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references'] });
    },
  });

  const handleDelete = (ref: WritingReference) => {
    if (ref.is_global) {
      alert('Global system knowledge entries cannot be deleted.');
      return;
    }
    if (window.confirm(`Delete Open Knowledge entry "${ref.title}"?`)) {
      deleteMutation.mutate(ref.id);
    }
  };

  const handleReindex = (id: string) => {
    reindexMutation.mutate(id);
  };

  const handleExportOKF = () => {
    const exportData = {
      format: 'OPEN_KNOWLEDGE_FORMAT',
      version: '1.0',
      exported_at: new Date().toISOString(),
      knowledge_entries: references.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        is_global: r.is_global,
        content: r.text_content,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `open_knowledge_vault_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyKnowledgeDirective = (ref: WritingReference) => {
    const directive = `### [OPEN KNOWLEDGE DIRECTIVE: ${ref.title.toUpperCase()}]\nCategory: ${ref.category}\n\n${ref.text_content}`;
    navigator.clipboard.writeText(directive);
    setCopiedId(ref.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'storytelling':
      case 'story_bible':
        return <span className="text-[10px] font-semibold text-purple-400 bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded-full">Story Bible & Lore</span>;
      case 'screenplay_rules':
      case 'blueprint':
        return <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">Screenplay Blueprint</span>;
      case 'blog_standards':
        return <span className="text-[10px] font-semibold text-blue-400 bg-blue-950/40 border border-blue-800/40 px-2 py-0.5 rounded-full">Blog Framework</span>;
      case 'guidelines':
      case 'style_guide':
        return <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded-full">Style & Voice</span>;
      case 'lexicon':
        return <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">Lexicon & Slang</span>;
      default:
        return <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/40 border border-slate-700/40 px-2 py-0.5 rounded-full">Open Knowledge</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center text-[10px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Active in AI
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center text-[10px] font-medium text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
            <Clock className="h-3 w-3 mr-1 animate-spin" /> Ingesting...
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center text-[10px] font-medium text-rose-400 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded-full">
            <AlertCircle className="h-3 w-3 mr-1" /> Re-index Needed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            Ready
          </span>
        );
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">Open Knowledge Vault</h1>
            <span className="text-[10px] font-mono bg-indigo-950/70 text-indigo-400 border border-indigo-800/50 px-2.5 py-0.5 rounded-full flex items-center">
              <Sparkles className="h-3 w-3 mr-1 text-indigo-400" />
              OPEN KNOWLEDGE FORMAT (OKF)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Curate style guidelines, story bibles, character lore, and genre blueprints. These knowledge units are transparently injected into prompts to enforce exact voice, pacing, and formatting.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportOKF}
            className="flex items-center space-x-1.5 text-xs px-3 py-2 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            title="Export full Knowledge Base as JSON"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export OKF</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center space-x-2 text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>+ Add Knowledge Entry</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 pt-1">
        {[
          { id: '', label: 'All Knowledge' },
          { id: 'guidelines', label: 'Style & Voice' },
          { id: 'storytelling', label: 'Story Bibles & Lore' },
          { id: 'screenplay_rules', label: 'Screenplay Blueprints' },
          { id: 'blog_standards', label: 'Blog Frameworks' },
          { id: 'user_custom', label: 'Custom User Docs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`text-xs px-3.5 py-1.5 rounded-lg border transition-colors ${
              selectedCategory === tab.id
                ? 'bg-indigo-600/10 border-indigo-500/60 text-indigo-300 font-semibold'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Knowledge Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900/30 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : references.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
          <BookOpen className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No Open Knowledge entries found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Add your custom writing bibles, Hinglish style guidelines, or screenplay templates to guide the AI.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-4 text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
          >
            Create First Entry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {references.map((ref) => (
            <div
              key={ref.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col justify-between hover:border-slate-700/80 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                    {ref.is_global && (
                      <span className="text-[10px] font-semibold text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full flex items-center">
                        <Globe className="h-2.5 w-2.5 mr-1" /> Global Preset
                      </span>
                    )}
                    {getCategoryBadge(ref.category)}
                  </div>
                  {getStatusBadge(ref.status)}
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                  {ref.title}
                </h3>

                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed font-sans">
                  {ref.text_content || 'No text extracted.'}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px] text-slate-400 flex items-center">
                  <FileCode className="h-3 w-3 mr-1 text-slate-400" />
                  {ref.chunk_count > 0 ? `${ref.chunk_count} Knowledge Units` : '1 Directive'}
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleCopyKnowledgeDirective(ref)}
                    className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Copy Open Knowledge Directive"
                  >
                    {copiedId === ref.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => setViewingRef(ref)}
                    className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors"
                    title="Read Full Knowledge Entry"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleReindex(ref.id)}
                    className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors"
                    title="Sync / Re-index Knowledge"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>

                  {!ref.is_global && (
                    <button
                      onClick={() => handleDelete(ref)}
                      className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Knowledge Entry Modal */}
      {viewingRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <div>
                <h3 className="text-base font-bold text-white">{viewingRef.title}</h3>
                <span className="text-xs text-indigo-400 font-mono mt-0.5 block">
                  Category: {viewingRef.category}
                </span>
              </div>
              <button
                onClick={() => setViewingRef(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono text-slate-300 leading-relaxed bg-slate-950/40">
              <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200">
                {viewingRef.text_content}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Injected into prompts when Open Knowledge is active.
              </span>
              <button
                onClick={() => {
                  handleCopyKnowledgeDirective(viewingRef);
                  setViewingRef(null);
                }}
                className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Directive</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload/Add Knowledge Modal */}
      <ReferenceUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={(formData) => uploadMutation.mutateAsync(formData)}
      />
    </div>
  );
};
