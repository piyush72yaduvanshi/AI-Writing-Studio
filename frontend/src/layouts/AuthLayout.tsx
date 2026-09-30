import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { PenTool, ShieldCheck, Cpu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5 mb-4 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
            <PenTool className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">AI Writing Studio</span>
        </Link>
        <div className="flex items-center justify-center space-x-4 text-[11px] text-slate-400 mb-6">
          <span className="flex items-center text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" /> 100% Local Inference
          </span>
          <span className="flex items-center text-indigo-400">
            <Cpu className="h-3.5 w-3.5 mr-1" /> No Paid APIs Required
          </span>
        </div>
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/80 border border-slate-800 py-8 px-4 shadow-2xl rounded-2xl sm:px-10 backdrop-blur-xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
