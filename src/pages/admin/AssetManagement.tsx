import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

export interface RenewableAsset {
  _id?: string;
  assetId: string;
  siteName: 'Kutch' | 'Banaskantha';
  type: 'solar' | 'wind';
  capacityMW: number;
  lat: number;
  long: number;
  installDate?: string;
  status: 'operational' | 'degraded' | 'maintenance' | 'offline';
  createdBy?: string;
  updatedAt?: string;
}

export const AssetManagement: React.FC = () => {
  const { token, role } = useAuth();
  const isAdmin = role === 'admin';

  const [assets, setAssets] = useState<RenewableAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterSite, setFilterSite] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<RenewableAsset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<RenewableAsset | null>(null);

  // Form state
  const [formAssetId, setFormAssetId] = useState('');
  const [formSiteName, setFormSiteName] = useState<'Kutch' | 'Banaskantha'>('Kutch');
  const [formType, setFormType] = useState<'solar' | 'wind'>('solar');
  const [formCapacity, setFormCapacity] = useState('5.0');
  const [formLat, setFormLat] = useState('23.73');
  const [formLong, setFormLong] = useState('69.86');
  const [formStatus, setFormStatus] = useState<'operational' | 'degraded' | 'maintenance' | 'offline'>('operational');

  const fetchAssets = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/assets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAssets(data.assets || []);
      } else {
        setError(data.error || 'Failed to fetch assets');
      }
    } catch (err) {
      setError('Network error loading assets');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const openEditModal = (asset: RenewableAsset) => {
    setEditingAsset(asset);
    setFormAssetId(asset.assetId);
    setFormSiteName(asset.siteName);
    setFormType(asset.type);
    setFormCapacity(String(asset.capacityMW));
    setFormLat(String(asset.lat));
    setFormLong(String(asset.long));
    setFormStatus(asset.status);
    setShowAddModal(true);
  };

  const openCreateModal = () => {
    setEditingAsset(null);
    setFormAssetId(formType === 'solar' ? 'KT-PV-' + Math.floor(10 + Math.random() * 90) : 'KT-WT-' + Math.floor(10 + Math.random() * 90));
    setFormSiteName('Kutch');
    setFormType('solar');
    setFormCapacity('5.0');
    setFormLat('23.73');
    setFormLong('69.86');
    setFormStatus('operational');
    setShowAddModal(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSuccessMsg(null);

    const payload = {
      assetId: formAssetId.trim(),
      siteName: formSiteName,
      type: formType,
      capacityMW: parseFloat(formCapacity),
      lat: parseFloat(formLat),
      long: parseFloat(formLong),
      status: formStatus,
    };

    try {
      let res: Response;
      if (editingAsset) {
        res = await fetch(`/api/assets/${editingAsset.assetId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Asset saved successfully');
        setShowAddModal(false);
        fetchAssets();
      } else {
        setError(data.error || 'Failed to save asset');
      }
    } catch (e) {
      setError('Network error saving asset');
    }
  };

  const handleDeleteAsset = async () => {
    if (!deletingAsset || !token) return;
    try {
      const res = await fetch(`/api/assets/${deletingAsset.assetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Asset deleted');
        setDeletingAsset(null);
        fetchAssets();
      } else {
        setError(data.error || 'Failed to delete asset');
      }
    } catch (e) {
      setError('Network error deleting asset');
    }
  };

  const handleSeedSamples = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/assets/seed-sample', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        fetchAssets();
      } else {
        setError(data.error || 'Failed to seed sample assets');
      }
    } catch (e) {
      setError('Network error seeding sample assets');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter((a) => {
    if (filterSite !== 'all' && a.siteName !== filterSite) return false;
    if (filterType !== 'all' && a.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏭</span>
            <h1 className="text-xl font-bold text-white">Hybrid Asset Management</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            MongoDB-backed inventory of Solar PV arrays and Wind Turbines across Kutch and Banaskantha
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSeedSamples}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-amber-300 transition-colors"
            >
              🌱 Seed Sample Park
            </button>
            <button
              onClick={openCreateModal}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium text-white transition-colors shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
            >
              <span>+</span> Add Renewable Asset
            </button>
          </div>
        )}
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

      {/* Onboarding Empty State (Prompt 20) */}
      {assets.length === 0 && !loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-2xl">
          <div className="w-16 h-16 bg-blue-950 border border-blue-800/60 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ☀️
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No assets yet</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            No assets yet — add your first Kutch or Banaskantha asset to get started
          </p>
          {isAdmin ? (
            <div className="flex gap-3 justify-center">
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium text-white transition-all shadow-lg shadow-blue-600/30"
              >
                + Add First Asset
              </button>
              <button
                onClick={handleSeedSamples}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-amber-300 transition-all"
              >
                Seed Kutch & Banaskantha Demo Park (13 Assets)
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Contact an administrator to add renewable assets to the platform.</p>
          )}
        </div>
      )}

      {/* Filter Bar */}
      {assets.length > 0 && (
        <div className="flex items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Site:</span>
              <select
                value={filterSite}
                onChange={(e) => setFilterSite(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              >
                <option value="all">All Sites ({assets.length})</option>
                <option value="Kutch">Kutch</option>
                <option value="Banaskantha">Banaskantha</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Type:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
              >
                <option value="all">All Types</option>
                <option value="solar">Solar PV</option>
                <option value="wind">Wind Turbine</option>
              </select>
            </div>
          </div>

          <div className="text-slate-400">
            Showing <strong className="text-white">{filteredAssets.length}</strong> of {assets.length} assets
          </div>
        </div>
      )}

      {/* Asset Table */}
      {assets.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Asset ID</th>
                  <th className="py-3 px-4">Site</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Coordinates</th>
                  <th className="py-3 px-4">Status</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAssets.map((asset) => (
                  <tr key={asset.assetId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      <div className="flex items-center gap-2">
                        <span>{asset.type === 'solar' ? '☀️' : '💨'}</span>
                        <span>{asset.assetId}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-300">{asset.siteName}</span>
                    </td>
                    <td className="py-3.5 px-4 uppercase text-[11px] font-semibold text-slate-400">
                      {asset.type}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                      {asset.capacityMW} MW
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {asset.lat.toFixed(3)}, {asset.long.toFixed(3)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          asset.status === 'operational'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                            : asset.status === 'degraded'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                            : asset.status === 'maintenance'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800/50'
                            : 'bg-red-950 text-red-400 border border-red-800/50'
                        }`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(asset)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingAsset(asset)}
                          className="px-2.5 py-1 rounded bg-red-950/70 hover:bg-red-900 border border-red-800 text-xs text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{editingAsset ? '✏️ Edit Asset' : '➕ Add Renewable Asset'}</span>
            </h3>

            <form onSubmit={handleSaveAsset} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 uppercase font-semibold mb-1">Asset ID</label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingAsset)}
                  value={formAssetId}
                  onChange={(e) => setFormAssetId(e.target.value)}
                  placeholder="KT-WT-01 or BK-PV-01"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase font-semibold mb-1">Site</label>
                  <select
                    value={formSiteName}
                    onChange={(e) => {
                      const s = e.target.value as 'Kutch' | 'Banaskantha';
                      setFormSiteName(s);
                      if (s === 'Kutch') {
                        setFormLat('23.73');
                        setFormLong('69.86');
                      } else {
                        setFormLat('24.17');
                        setFormLong('72.44');
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Kutch">Kutch</option>
                    <option value="Banaskantha">Banaskantha</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-semibold mb-1">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as 'solar' | 'wind')}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="solar">Solar PV</option>
                    <option value="wind">Wind Turbine</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase font-semibold mb-1">Capacity (MW)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase font-semibold mb-1">Lat</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase font-semibold mb-1">Long</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formLong}
                    onChange={(e) => setFormLong(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-semibold mb-1">Operational Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="operational">Operational</option>
                  <option value="degraded">Degraded</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-lg shadow-blue-600/30"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>⚠️</span>
              <span>Confirm Delete Asset</span>
            </h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete asset <strong className="text-white">{deletingAsset.assetId}</strong> ({deletingAsset.siteName}, {deletingAsset.type})?
            </p>
            <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeletingAsset(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAsset}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium"
              >
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManagement;
