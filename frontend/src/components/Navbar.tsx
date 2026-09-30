import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  PenTool, 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  Settings, 
  LogOut, 
  PlusCircle, 
  User 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'Open Knowledge', path: '/references', icon: BookOpen },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="flex items-center space-x-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <PenTool className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white">AI Writing Studio</span>
              <span className="text-[10px] text-slate-400 -mt-1 font-mono tracking-wider">LOCAL & OPEN-SOURCE</span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800/80 text-brand-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/workspace/new')}
            className="hidden sm:inline-flex items-center space-x-2 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-500 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Document</span>
          </button>

          <Link
            to="/profile"
            className="flex items-center space-x-2 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
            title="User Profile"
          >
            <User className="h-3.5 w-3.5 text-brand-400" />
            <span className="max-w-[100px] truncate">{user?.username || user?.email?.split('@')[0]}</span>
          </Link>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/50 hover:bg-rose-950/20 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
