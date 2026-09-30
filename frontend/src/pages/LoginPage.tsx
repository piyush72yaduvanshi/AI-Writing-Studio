import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2 text-center">Welcome Back</h2>
      <p className="text-xs text-slate-400 mb-6 text-center">
        Sign in to access your local writing workspace & documents.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 flex items-start space-x-2 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="writer@example.com"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
          <div className="relative">
            <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-brand-500/20 disabled:opacity-50 transition-all"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setEmail('admin@aiwritingstudio.local');
            setPassword('StudioPassword123!');
          }}
          className="w-full py-2 px-3 rounded-lg border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-300 text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
        >
          <span>⚡ Fill Admin Credentials (admin@aiwritingstudio.local)</span>
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300">
          Create one now
        </Link>
      </div>
    </div>
  );
};
