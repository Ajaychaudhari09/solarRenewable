import React from 'react';
import { useAuth } from '../context/AuthContext';

interface AccessDeniedProps {
  requiredRole?: string;
  onNavigate?: (tab: string) => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ requiredRole = 'admin', onNavigate }) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full bg-slate-900 border border-red-800/60 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-950/80 border border-red-700/50 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">
          🚫
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-slate-400 text-sm mb-6">
          This area requires <span className="text-amber-400 font-semibold uppercase">{requiredRole}</span> privileges.
          Your current account (<span className="text-slate-300">{user?.email}</span>) has the{' '}
          <span className="text-blue-400 font-semibold uppercase">{user?.role || 'viewer'}</span> role.
        </p>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-6 text-left text-xs text-slate-400 space-y-1.5">
          <div className="font-semibold text-slate-300">Role Permissions:</div>
          <div>• <span className="text-blue-400">Viewer</span>: Read-only access to dashboard, assets, and forecasts</div>
          <div>• <span className="text-emerald-400">Operator</span>: Viewer + acknowledge tickets & grid recommendations</div>
          <div>• <span className="text-amber-400">Admin</span>: Operator + full user management & asset CRUD</div>
        </div>

        <div className="flex gap-3 justify-center">
          {onNavigate && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          )}
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
