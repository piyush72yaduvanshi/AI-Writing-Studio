import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PenTool, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Languages, 
  Clapperboard, 
  BookOpen, 
  ArrowRight,
  Database
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-md shadow-brand-500/20">
              <PenTool className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">AI Writing Studio</span>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 transition-colors shadow-sm"
              >
                <span>Go to Studio</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center space-x-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 transition-colors shadow-sm"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-24 border-b border-slate-900">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 text-xs font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Modern Multi-Provider AI • Cloud-First & Self-Hosted • Open Knowledge Format</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            The Writing Workspace Built for <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Creative Storytellers & Authors
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Write naturally in your authentic voice — whether in English, Hindi, or conversational Hinglish. 
            AI Writing Studio refines structure, fixes grammar, drafts screenplays, and formats publication-ready prose with blazing-fast multi-provider intelligence.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? "/workspace/new" : "/register"}
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:from-brand-500 hover:to-indigo-500 transition-all hover:scale-105"
            >
              <PenTool className="h-4 w-4" />
              <span>Launch Studio Editor</span>
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 rounded-xl border border-slate-800 bg-slate-900/60 px-6 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            >
              <span>View on GitHub</span>
            </a>
          </div>

          {/* Privacy & Hardware badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Private & Secure Workspace</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Cpu className="h-4 w-4 text-indigo-400" />
              <span>OpenRouter • Gemini • OpenAI Ready</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Languages className="h-4 w-4 text-amber-400" />
              <span>English, Hindi & Hinglish</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Engineered for Focused Writing
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Not a generic chat window. A dedicated dual-pane workspace designed for blogs, screenplay drafts, and long-form narratives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                  <Clapperboard className="h-5 w-5 text-rose-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Screenplay Draft Format</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Turn rough scene notes and dialogues into clean screenplay draft layout with uppercase sluglines, action beats, and formatted character cues.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                INT. CAFE - NIGHT
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  <BookOpen className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Hinglish Creative Fiction</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Write emotional Hinglish thoughts without translating first. The model understands mixed Roman Hindi idioms and transforms them into evocative prose.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                Preserves cultural nuance & stakes
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <Database className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Open Knowledge Format & Library</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload style guidelines, character bibles, and story rules in Open Knowledge Format (JSON, Markdown, PDF, DOCX). Indexed in Qdrant with sub-second retrieval.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                Normalized Vector Indexing via Qdrant
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <p>AI Writing Studio — Released under the permissive MIT Open-Source License.</p>
      </footer>
    </div>
  );
};
