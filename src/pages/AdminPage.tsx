import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminLogin } from '../components/admin/AdminLogin';
import { AdminLayout, AdminTab } from '../components/admin/AdminLayout';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AdminMovies } from '../components/admin/AdminMovies';
import { AdminSeries } from '../components/admin/AdminSeries';
import { AdminSources } from '../components/admin/AdminSources';
import { AdminMedia } from '../components/admin/AdminMedia';
import { AdminHomepage } from '../components/admin/AdminHomepage';
import { AdminSettings } from '../components/admin/AdminSettings';
import { AdminAudit } from '../components/admin/AdminAudit';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminPage: React.FC = () => {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#040508] flex flex-col items-center justify-center space-y-3 text-white">
        <div className="w-10 h-10 rounded-full border-2 border-red-600/30 border-t-red-600 animate-spin" />
        <p className="text-xs text-zinc-400">Verifying administrative credentials...</p>
      </div>
    );
  }

  // If not logged in -> Show dedicated Admin Login
  if (!user) {
    return <AdminLogin onSuccess={() => {}} />;
  }

  // If logged in but unauthorized -> Show Access Denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#040508] flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full p-8 rounded-2xl bg-zinc-950 border border-red-500/20 shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-display">
            Access Denied
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            This account ({user.email}) does not have Studio Administrator authorization for CINEXUS.
          </p>
          <div className="flex gap-3 pt-3">
            <Link
              to="/"
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </Link>
            <button
              onClick={() => logout()}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white uppercase transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated + Authorized Administrator Workspace
  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && <AdminDashboard onNavigate={setActiveTab} />}
      {activeTab === 'movies' && <AdminMovies />}
      {activeTab === 'series' && <AdminSeries />}
      {activeTab === 'sources' && <AdminSources />}
      {activeTab === 'media' && <AdminMedia />}
      {activeTab === 'homepage' && <AdminHomepage />}
      {activeTab === 'collections' && <AdminMovies />}
      {activeTab === 'users' && <AdminAudit />}
      {activeTab === 'reviews' && <AdminAudit />}
      {activeTab === 'analytics' && <AdminDashboard onNavigate={setActiveTab} />}
      {activeTab === 'seo' && <AdminSettings />}
      {activeTab === 'settings' && <AdminSettings />}
      {activeTab === 'security' && <AdminSettings />}
      {activeTab === 'audit' && <AdminAudit />}
    </AdminLayout>
  );
};
