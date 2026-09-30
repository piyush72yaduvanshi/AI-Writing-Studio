import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth';
import { Check, AlertCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [username, setUsername] = useState(user?.username || '');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferred_language || 'English');
  const [preferredTone, setPreferredTone] = useState(user?.preferred_tone || 'Simple');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await authApi.updateMe({
        username: username.trim() || undefined,
        preferred_language: preferredLanguage as any,
        preferred_tone: preferredTone,
      });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Author Profile & Defaults</h1>
        <p className="text-xs text-slate-400 mt-1">
          Customize your writing preferences and default studio presets.
        </p>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center space-x-2 text-xs text-emerald-300">
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Profile defaults updated successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center space-x-2 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Author Name / Pen Name</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Default Output Language</label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (Devanagari)</option>
              <option value="Hinglish">Hinglish (Colloquial)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Default Writing Tone</label>
            <select
              value={preferredTone}
              onChange={(e) => setPreferredTone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="Simple">Simple</option>
              <option value="Professional">Professional</option>
              <option value="Friendly">Friendly</option>
              <option value="Creative">Creative</option>
              <option value="Formal">Formal</option>
              <option value="Casual">Casual</option>
              <option value="Cinematic">Cinematic</option>
              <option value="Emotional">Emotional</option>
              <option value="Technical">Technical</option>
            </select>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-sm disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};
