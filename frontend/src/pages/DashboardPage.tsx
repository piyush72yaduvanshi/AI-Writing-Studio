import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  PlusCircle, 
  Sparkles, 
  BookOpen, 
  Clapperboard, 
  ArrowUpRight,
  Cpu,
  Layers
} from 'lucide-react';
import { documentsApi } from '../api/documents';
import { aiApi } from '../api/ai';
import { useAuth } from '../contexts/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch recent documents
  const { data: documentsData, isLoading: docsLoading } = useQuery({
    queryKey: ['recent-documents'],
    queryFn: () => documentsApi.list({ sort_by: '-updated_at', page: 1 }),
  });

  // Fetch AI audit history
  const { data: aiHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['ai-history'],
    queryFn: () => aiApi.getHistory(),
  });

  // Fetch AI config
  const { data: aiConfig } = useQuery({
    queryKey: ['ai-config'],
    queryFn: () => aiApi.getConfig(),
  });

  const totalDocuments = documentsData?.count || 0;
  const recentDocs = documentsData?.results?.slice(0, 5) || [];
  const recentActions = aiHistory?.slice(0, 6) || [];

  const handleQuickCreate = async (mode: string) => {
    try {
      const modeTitles: Record<string, string> = {
        blog: 'New Blog Post Draft',
        article: 'New Article Outline',
        story: 'New Creative Story Draft',
        screenplay: 'New Screenplay Scene Draft',
        movie_web_series: 'New Series / Movie Outline',
      };
      const newDoc = await documentsApi.create({
        title: modeTitles[mode] || 'Untitled Draft',
        mode: mode as any,
        language: user?.preferred_language || 'English',
        tone: (user?.preferred_tone as any) || 'Simple',
      });
      navigate(`/workspace/${newDoc.id}`);
    } catch (err) {
      console.error('Failed to create document:', err);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {user?.first_name || user?.username || 'Writer'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
            <span>Cloud-First AI Studio</span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              <span className="uppercase font-semibold">{aiConfig?.provider || 'OpenRouter'}</span>&nbsp;Online
            </span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-indigo-400 font-medium">
              {aiConfig?.configured_model || 'deepseek/deepseek-chat'}
            </span>
          </p>
        </div>

        <button
          onClick={() => navigate('/workspace/new')}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-500/20 transition-all hover:scale-105"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Start New Writing</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Documents</span>
            <div className="text-2xl font-bold text-white mt-1">{totalDocuments}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <FileText className="h-5 w-5 text-brand-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">AI Transformations</span>
            <div className="text-2xl font-bold text-white mt-1">{aiHistory?.length || 0}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-indigo-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Active AI Engine</span>
            <div className="text-lg font-bold text-white mt-1 flex items-center">
              <span className="h-2 w-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
              <span className="capitalize">{aiConfig?.provider || 'OpenRouter'}</span>
            </div>
            <div className="text-[11px] font-mono text-indigo-400 mt-0.5 truncate max-w-[160px]" title={aiConfig?.configured_model || 'deepseek/deepseek-chat'}>
              {aiConfig?.configured_model || 'deepseek/deepseek-chat'}
            </div>
          </div>
          <Link
            to="/settings"
            title="Configure AI Providers & Models in Settings"
            className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/50 flex items-center justify-center transition-all hover:scale-105"
          >
            <Cpu className="h-5 w-5 text-indigo-400" />
          </Link>
        </div>
      </div>

      {/* Quick Launch Writing Mode Presets */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Quick Start by Writing Mode
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => handleQuickCreate('blog')}
            className="group flex flex-col p-4 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900 hover:border-slate-700 text-left transition-all"
          >
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <FileText className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-xs font-bold text-white">Blog Post</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Headings, hook, CTA</span>
          </button>

          <button
            onClick={() => handleQuickCreate('story')}
            className="group flex flex-col p-4 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900 hover:border-slate-700 text-left transition-all"
          >
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <BookOpen className="h-4 w-4 text-purple-400" />
            </div>
            <span className="text-xs font-bold text-white">Story / Fiction</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Hinglish & prose</span>
          </button>

          <button
            onClick={() => handleQuickCreate('screenplay')}
            className="group flex flex-col p-4 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900 hover:border-slate-700 text-left transition-all"
          >
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Clapperboard className="h-4 w-4 text-rose-400" />
            </div>
            <span className="text-xs font-bold text-white">Screenplay Draft</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Sluglines & dialogue</span>
          </button>

          <button
            onClick={() => handleQuickCreate('movie_web_series')}
            className="group flex flex-col p-4 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900 hover:border-slate-700 text-left transition-all"
          >
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Layers className="h-4 w-4 text-amber-400" />
            </div>
            <span className="text-xs font-bold text-white">Movie / Series Arc</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Acts, loglines, episodes</span>
          </button>
        </div>
      </div>

      {/* Main 2-column: Recent Documents & Recent AI Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Documents */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Recent Documents</h3>
            <Link to="/documents" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center">
              <span>View All</span>
              <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>

          <div className="flex-1 space-y-2.5">
            {docsLoading ? (
              <p className="text-xs text-slate-500 py-6 text-center">Loading recent documents...</p>
            ) : recentDocs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No documents yet. Create your first draft above!</p>
              </div>
            ) : (
              recentDocs.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/workspace/${doc.id}`}
                  className="block p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200 truncate">{doc.title}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(doc.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate font-serif">
                    {doc.snippet || 'Blank draft...'}
                  </p>
                  <div className="mt-2 flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded capitalize">{doc.mode}</span>
                    <span>{doc.language}</span>
                    <span>• {doc.word_count} words</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent AI Activity Log */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Recent AI Operations</h3>
            <span className="text-[10px] text-slate-500 font-mono">LOCAL AUDIT</span>
          </div>

          <div className="flex-1 space-y-2.5">
            {historyLoading ? (
              <p className="text-xs text-slate-500 py-6 text-center">Loading AI activity...</p>
            ) : recentActions.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No AI operations executed yet.</p>
              </div>
            ) : (
              recentActions.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200 capitalize">
                      {log.action.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {log.document_title ? `Doc: ${log.document_title}` : 'Draft conversion'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-1.5 py-0.5 rounded">
                      {(log.duration_ms / 1000).toFixed(1)}s
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {log.output_tokens} tokens
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
