import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  PlusCircle, 
  Search, 
  Copy, 
  Trash2
} from 'lucide-react';
import { documentsApi } from '../api/documents';
import { DocumentItem } from '../types/document';

export const DocumentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [sortBy, setSortBy] = useState('-updated_at');

  const { data, isLoading } = useQuery({
    queryKey: ['documents', { search, mode: modeFilter, language: languageFilter, sort_by: sortBy }],
    queryFn: () => documentsApi.list({
      search: search.trim() || undefined,
      mode: modeFilter || undefined,
      language: languageFilter || undefined,
      sort_by: sortBy,
    }),
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => documentsApi.duplicate(id),
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      navigate(`/workspace/${newDoc.id}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const handleDelete = (doc: DocumentItem) => {
    if (window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(doc.id);
    }
  };

  const handleDuplicate = (doc: DocumentItem) => {
    duplicateMutation.mutate(doc.id);
  };

  const documents = data?.results || [];

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Your Documents</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage, organize, duplicate, and filter your writing drafts and scripts.
          </p>
        </div>

        <button
          onClick={() => navigate('/workspace/new')}
          className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Document</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 border border-slate-800 p-3 rounded-xl">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or content..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Mode Filter */}
        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
        >
          <option value="">All Modes</option>
          <option value="blog">Blog</option>
          <option value="article">Article</option>
          <option value="story">Story</option>
          <option value="movie_web_series">Movie / Web Series</option>
          <option value="screenplay">Screenplay Draft</option>
        </select>

        {/* Language Filter */}
        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
        >
          <option value="">All Languages</option>
          <option value="English">English</option>
          <option value="Hindi">Hindi</option>
          <option value="Hinglish">Hinglish</option>
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
        >
          <option value="-updated_at">Recently Updated</option>
          <option value="updated_at">Oldest Updated</option>
          <option value="-created_at">Recently Created</option>
          <option value="title">Title (A-Z)</option>
        </select>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
          <FileText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No documents found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || modeFilter || languageFilter
              ? 'Try adjusting your search criteria or clearing filters.'
              : 'Create your first piece of creative writing or article now!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:border-slate-700 hover:bg-slate-900/70 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">
                    {doc.mode}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(doc.updated_at).toLocaleDateString()}
                  </span>
                </div>

                <Link to={`/workspace/${doc.id}`} className="block">
                  <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
                    {doc.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400 font-serif leading-relaxed line-clamp-3">
                    {doc.snippet || 'Empty draft ready for writing...'}
                  </p>
                </Link>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-mono">
                  {doc.word_count} words • {doc.language}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDuplicate(doc)}
                    title="Duplicate document"
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    title="Delete document"
                    className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
