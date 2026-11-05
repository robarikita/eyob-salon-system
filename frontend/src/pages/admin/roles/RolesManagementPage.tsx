import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { useAuth } from '../../../context/AuthContext';

interface PermissionItem {
  id: string;
  name: string;
  description: string;
}

interface RoleItem {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  branch: { name: string } | null;
  _count: { users: number };
  permissions: { permission: PermissionItem }[];
}

export const RolesManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('eyob_auth_token');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/v1/admin/roles', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/v1/admin/permissions', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();

      if (rolesData.status === 'success') {
        setRoles(rolesData.data);
        if (rolesData.data.length > 0 && !selectedRole) {
          setSelectedRole(rolesData.data[0]);
          setSelectedPermIds(rolesData.data[0].permissions.map((p: any) => p.permission.id));
        }
      }
      if (permsData.status === 'success') {
        setPermissions(permsData.data);
      }
    } catch (err) {
      console.error('Failed to load RBAC data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectRole = (role: RoleItem) => {
    setSelectedRole(role);
    setSelectedPermIds(role.permissions.map((p) => p.permission.id));
    setNotification(null);
  };

  const togglePermission = (permId: string) => {
    if (user?.role !== 'OWNER') return;
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRole || user?.role !== 'OWNER') return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/roles/${selectedRole.id}/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissionIds: selectedPermIds }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setNotification('Permissions updated successfully.');
        await fetchData();
      } else {
        alert(data.message || 'Update failed');
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    try {
      const res = await fetch('/api/v1/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newRoleName.trim(),
          description: newRoleDesc.trim(),
          permissionIds: selectedPermIds,
        }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        setShowCreateModal(false);
        setNewRoleName('');
        setNewRoleDesc('');
        await fetchData();
      } else {
        alert(data.message || 'Creation failed');
      }
    } catch (err) {
      console.error('Create error:', err);
    }
  };

  return (
    <AdminLayout activePath="/admin/roles">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E2DD]">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1C1C19]">Roles & Permissions</h1>
            <p className="text-xs text-stone-500 mt-0.5">Dynamic granular permission control and role governance</p>
          </div>
          {user?.role === 'OWNER' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#C59A3F] text-black font-semibold text-xs tracking-wide transition shadow-sm self-start sm:self-auto cursor-pointer"
            >
              + Create Role
            </button>
          )}
        </div>

        {notification && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs">
            {notification}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Roles List (4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block px-1">
              Roles ({roles.length})
            </span>
            <div className="space-y-2">
              {loading ? (
                <div className="p-6 text-center text-xs text-stone-400">Loading roles...</div>
              ) : (
                roles.map((r) => {
                  const isSelected = selectedRole?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRole(r)}
                      className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-[#D4AF37] shadow-md ring-1 ring-[#D4AF37]'
                          : 'bg-white/70 hover:bg-white border-[#E5E2DD]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-stone-900">{r.name}</span>
                        {r.isSystemRole && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-600 font-medium">
                            System
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-1">{r.description || 'No description'}</p>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-stone-400">
                        <span>{r._count.users} Users</span>
                        <span>{r.permissions.length} Permissions</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Permissions Matrix (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-[#E5E2DD] p-6 shadow-sm flex flex-col justify-between">
            {selectedRole ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                      <span>{selectedRole.name}</span>
                      <span className="text-xs font-normal text-stone-500">
                        ({selectedPermIds.length} of {permissions.length} active)
                      </span>
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">{selectedRole.description}</p>
                  </div>
                  {user?.role === 'OWNER' && (
                    <button
                      onClick={handleSavePermissions}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-[#181412] hover:bg-[#25201C] text-[#D4AF37] border border-[#D4AF37]/50 font-bold text-xs tracking-wide transition disabled:opacity-50 cursor-pointer"
                    >
                      {saving ? 'Saving...' : 'Save Permissions'}
                    </button>
                  )}
                </div>

                {/* Permissions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {permissions.map((p) => {
                    const isGranted = selectedPermIds.includes(p.id);
                    const canEdit = user?.role === 'OWNER';
                    return (
                      <div
                        key={p.id}
                        onClick={() => canEdit && togglePermission(p.id)}
                        className={`p-3.5 rounded-lg border transition flex items-start justify-between gap-3 ${
                          canEdit ? 'cursor-pointer' : 'cursor-default'
                        } ${
                          isGranted
                            ? 'bg-amber-50/60 border-amber-300/80 text-stone-900'
                            : 'bg-stone-50/50 border-stone-200 text-stone-400'
                        }`}
                      >
                        <div>
                          <span className="font-mono text-xs font-bold block">{p.name}</span>
                          <span className="text-[11px] leading-tight text-stone-500 block mt-0.5">
                            {p.description}
                          </span>
                        </div>
                        <span
                          className={`material-symbols-outlined text-lg ${
                            isGranted ? 'text-amber-600' : 'text-stone-300'
                          }`}
                        >
                          {isGranted ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-stone-400">Select a role to inspect permissions</div>
            )}
          </div>
        </div>

        {/* Create Role Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <h3 className="font-bold text-base text-stone-900">Create Custom Role</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRole} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Role Name</label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g. SENIOR_COLORIST"
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Description</label>
                  <input
                    type="text"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    placeholder="Role responsibilities..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-bold hover:bg-[#C59A3F]"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default RolesManagementPage;
