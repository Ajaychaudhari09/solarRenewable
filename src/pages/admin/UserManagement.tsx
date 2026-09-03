import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  status: 'active' | 'disabled';
  lastLogin?: string;
  createdAt: string;
}

export const UserManagement: React.FC = () => {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Confirmation modal state
  const [pendingAction, setPendingAction] = useState<{
    type: 'role' | 'status';
    user: AdminUser;
    newValue: string;
  } | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const url = search ? `/api/users?search=${encodeURIComponent(search)}` : '/api/users';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err: any) {
      setError('Network error fetching users');
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const confirmAction = async () => {
    if (!pendingAction || !token) return;
    const { type, user, newValue } = pendingAction;
    setPendingAction(null);
    setError(null);
    setSuccessMsg(null);

    try {
      let res: Response;
      if (type === 'role') {
        res = await fetch(`/api/users/${user._id}/role`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newValue }),
        });
      } else {
        res = await fetch(`/api/users/${user._id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newValue }),
        });
      }

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Action completed successfully');
        await fetchUsers();
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (e: any) {
      setError('Network error during operation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <h1 className="text-xl font-bold text-white">User Management & Access Control</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Admin console for managing user accounts, role-based access, and account status
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
            />
            <span className="absolute left-2.5 top-2 text-slate-500 text-xs">🔍</span>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center justify-between">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">✕</button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No users found matching query.
                  </td>
                </tr>
              )}
              {users.map((u) => {
                const isSelf = currentUser?.id === u._id;
                return (
                  <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-slate-300">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div>{u.name}</div>
                        {isSelf && (
                          <span className="text-[10px] text-blue-400 font-mono">(You)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        disabled={isSelf}
                        onChange={(e) =>
                          setPendingAction({
                            type: 'role',
                            user: u,
                            newValue: e.target.value,
                          })
                        }
                        className={`px-2 py-1 rounded text-xs font-medium border bg-slate-950 focus:outline-none ${
                          u.role === 'admin'
                            ? 'border-amber-700/60 text-amber-300'
                            : u.role === 'operator'
                            ? 'border-emerald-700/60 text-emerald-300'
                            : 'border-blue-700/60 text-blue-300'
                        }`}
                      >
                        <option value="admin">👑 Admin</option>
                        <option value="operator">⚙️ Operator</option>
                        <option value="viewer">👁️ Viewer</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          u.status === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                            : 'bg-red-950 text-red-400 border border-red-800/50'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        disabled={isSelf}
                        onClick={() =>
                          setPendingAction({
                            type: 'status',
                            user: u,
                            newValue: u.status === 'active' ? 'disabled' : 'active',
                          })
                        }
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          u.status === 'active'
                            ? 'bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-300 disabled:opacity-30'
                            : 'bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 disabled:opacity-30'
                        }`}
                      >
                        {u.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>⚠️</span>
              <span>Confirm {pendingAction.type === 'role' ? 'Role Change' : 'Account Status Change'}</span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to{' '}
              {pendingAction.type === 'role' ? (
                <>
                  change the role of <strong className="text-white">{pendingAction.user.name}</strong> from{' '}
                  <span className="text-slate-400 uppercase">{pendingAction.user.role}</span> to{' '}
                  <strong className="text-amber-400 uppercase">{pendingAction.newValue}</strong>?
                </>
              ) : (
                <>
                  <strong className="text-white">{pendingAction.newValue === 'disabled' ? 'DISABLE' : 'RE-ENABLE'}</strong> the account for{' '}
                  <strong className="text-white">{pendingAction.user.name}</strong> ({pendingAction.user.email})?
                  {pendingAction.newValue === 'disabled' && (
                    <span className="block text-red-400 mt-1">
                      This user will be blocked from logging into the platform immediately.
                    </span>
                  )}
                </>
              )}
            </p>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setPendingAction(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors shadow-lg shadow-blue-600/30"
              >
                Confirm & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
