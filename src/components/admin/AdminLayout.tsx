import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../common/Logo';
import {
  LayoutDashboard,
  Film,
  Tv,
  Radio,
  Image,
  Layers,
  Sparkles,
  Users,
  MessageSquare,
  BarChart3,
  Globe,
  Settings,
  Shield,
  FileText,
  Activity,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type AdminTab =
  | 'dashboard'
  | 'movies'
  | 'series'
  | 'sources'
  | 'media'
  | 'homepage'
  | 'collections'
  | 'users'
  | 'reviews'
  | 'analytics'
  | 'seo'
  | 'settings'
  | 'security'
  | 'audit';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ activeTab, onTabChange, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: { id: AdminTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'movies', label: 'Feature Films', icon: Film },
    { id: 'series', label: 'TV & Anime Series', icon: Tv },
    { id: 'sources', label: 'Streaming Sources', icon: Radio },
    { id: 'media', label: 'Media Library', icon: Image },
    { id: 'homepage', label: 'Homepage Rails', icon: Layers },
    { id: 'collections', label: 'Collections', icon: Sparkles },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'reviews', label: 'Reviews Moderation', icon: MessageSquare },
    { id: 'analytics', label: 'Real Analytics', icon: BarChart3 },
    { id: 'seo', label: 'SEO & Metadata', icon: Globe },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
    { id: 'security', label: 'Admin Security', icon: Shield },
    { id: 'audit', label: 'Activity Logs', icon: Activity }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0a0d14] border-b border-white/10 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg bg-white/5 text-zinc-300"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Logo size="xs" showSubtitle={false} />
        </div>
        <Link to="/" target="_blank" className="p-2 text-zinc-400 hover:text-white" title="View Public Site">
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* Admin Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#090c13] border-r border-white/10 flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Header */}
          <div className="p-5 border-b border-white/10 flex flex-col items-start gap-1">
            <Logo size="sm" showSubtitle={false} />
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
              Master CMS Console
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-red-600 text-white font-semibold shadow-lg shadow-red-950/40'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-white/10 space-y-1.5 bg-[#07090e]">
          <Link
            to="/"
            target="_blank"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              <span>Live Public Site</span>
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Studio</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 min-w-0 bg-[#07090e] p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-screen">
        {children}
      </main>

    </div>
  );
};
