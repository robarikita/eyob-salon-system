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

interface BranchAdminItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  roleId: string | null;
  roleName: string;
  branch: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  } | null;
  permissions: PermissionItem[];
}

export const RolesManagementPage: React.FC = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'OWNER';

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [branchAdmins, setBranchAdmins] = useState<BranchAdminItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<BranchAdminItem | null>(null);
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
      const [rolesRes, permsRes, adminsRes] = await Promise.all([
        fetch('/api/v1/admin/roles', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/v1/admin/permissions', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/v1/admin/branch-admins', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();
      const adminsData = await adminsRes.json();

      if (rolesData.status === 'success') {
        setRoles(rolesData.data);
        if (rolesData.data.length > 0 && !selectedRole && !selectedAdmin) {
          setSelectedRole(rolesData.data[0]);
          setSelectedPermIds(rolesData.data[0].permissions.map((p: any) => p.permission.id));
        }
      }
      if (permsData.status === 'success') {
        setPermissions(permsData.data);
      }
      if (adminsData.status === 'success') {
        setBranchAdmins(adminsData.data || []);
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
    setSelectedAdmin(null);
    setSelectedRole(role);
    setSelectedPermIds(role.permissions.map((p) => p.permission.id));
    setNotification(null);
  };

  const handleEditAdminPermissions = (admin: BranchAdminItem) => {
    setSelectedRole(null);
    setSelectedAdmin(admin);
    setSelectedPermIds(admin.permissions.map((p) => p.id));
    setNotification(null);
    const matrixEl = document.getElementById('permissions-matrix-section');
    if (matrixEl) {
      matrixEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const togglePermission = (permId: string) => {
    if (!isOwner) return;
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSavePermissions = async () => {
    if ((!selectedRole && !selectedAdmin) || !isOwner) return;
    setSaving(true);
    try {
      const url = selectedAdmin
        ? `/api/v1/admin/branch-admins/${selectedAdmin.id}/permissions`
        : `/api/v1/admin/roles/${selectedRole!.id}/permissions`;

      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissionIds: selectedPermIds }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setNotification(
          selectedAdmin
            ? `Independent permissions saved for ${selectedAdmin.name} (${selectedAdmin.branch?.name || 'Branch'}).`
            : `Permissions updated successfully for ${selectedRole!.name}.`
        );
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
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2C2724]">
          <div>
            <h1 className="text-2xl font-serif text-[#FAF7F2] font-medium tracking-wide">
              Roles & Permissions / ሚናዎች እና ፈቃዶች
            </h1>
            <p className="text-xs text-[#A8A29E] mt-0.5">
              Granular access control, branch administrator scoping, and permission enforcement.
            </p>
          </div>
          {isOwner && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#c29f2f] text-[#0E0B09] rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add_moderator</span>
              <span>Create Role / አዲስ ሚና</span>
            </button>
          )}
        </div>

        {notification && (
          <div className="p-3.5 bg-[#181412] border border-[#D4AF37]/50 text-[#D4AF37] rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-stone-400 hover:text-white">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* SECTION 1: Branch Administrators & Access Scope Table */}
        <div className="bg-[#181412] border border-[#2C2724] rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2C2724]">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#D4AF37]">shield_person</span>
              <div>
                <h2 className="text-base font-serif font-bold text-[#FAF7F2] tracking-wide">
                  Branch Administrators & Access Scope / የቅርንጫፍ አስተዳዳሪዎች
                </h2>
                <p className="text-[11px] text-[#A8A29E]">
                  Active salon branch managers and their granted granular capabilities.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-[#D4AF37] bg-[#231D1A] px-2.5 py-1 rounded-lg border border-[#3E3834]">
              {branchAdmins.length} Administrators
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2C2724] text-[#A8A29E] font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Administrator</th>
                  <th className="py-2.5 px-3">Assigned Branch</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Granular Permissions</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C2724]/60">
                {branchAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-500 italic">
                      No branch administrators provisioned yet.
                    </td>
                  </tr>
                ) : (
                  branchAdmins.map((admin) => {
                    const isEditing = selectedAdmin?.id === admin.id;
                    return (
                      <tr
                        key={admin.id}
                        className={`transition-colors ${
                          isEditing
                            ? 'bg-[#231D1A] border-l-2 border-l-[#D4AF37]'
                            : 'hover:bg-[#231D1A]/50'
                        }`}
                      >
                        {/* Name & Email */}
                        <td className="py-3 px-3">
                          <p className="font-semibold text-[#FAF7F2]">{admin.name}</p>
                          <p className="text-[11px] text-[#D4AF37] font-mono">{admin.email}</p>
                          {admin.phone && (
                            <p className="text-[10px] text-[#A8A29E] font-mono">{admin.phone}</p>
                          )}
                        </td>

                        {/* Assigned Branch */}
                        <td className="py-3 px-3">
                          {admin.branch ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#181412] text-[#FAF7F2] border border-[#3E3834]">
                              <span className="material-symbols-outlined text-xs text-[#D4AF37]">location_on</span>
                              {admin.branch.name}
                            </span>
                          ) : (
                            <span className="text-stone-500 italic">Unassigned</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active / ንቁ
                          </span>
                        </td>

                        {/* Permissions Chips */}
                        <td className="py-3 px-3 max-w-md">
                          <div className="flex flex-wrap gap-1.5">
                            {admin.permissions.map((p) => (
                              <span
                                key={p.id}
                                className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#181412] text-[#FAF7F2]/90 border border-[#3E3834]"
                                title={p.description}
                              >
                                {p.name}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          {isOwner && (
                            <button
                              onClick={() => handleEditAdminPermissions(admin)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                isEditing
                                  ? 'bg-[#D4AF37] text-[#0E0B09] font-bold'
                                  : 'bg-[#231D1A] hover:bg-[#D4AF37] hover:text-[#0E0B09] text-[#D4AF37] border border-[#D4AF37]/40'
                              }`}
                            >
                              <span className="material-symbols-outlined text-xs">tune</span>
                              <span>{isEditing ? 'Editing / በመቀየር ላይ' : 'Edit Permissions / ፍቃድ ቀይር'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: Master Roles & Permission Matrix */}
        <div id="permissions-matrix-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Roles List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A8A29E] block px-1">
              Roles / ሚናዎች ({roles.length})
            </span>
            <div className="space-y-2">
              {loading ? (
                <div className="p-8 text-center text-xs text-[#A8A29E]">Loading roles...</div>
              ) : (
                roles.map((r) => {
                  const isSelected = selectedRole?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRole(r)}
                      className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#181412] border-[#D4AF37] shadow-lg ring-1 ring-[#D4AF37]'
                          : 'bg-[#181412]/60 hover:bg-[#181412] border-[#2C2724]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-[#FAF7F2]">{r.name}</span>
                        {r.isSystemRole && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#231D1A] text-[#D4AF37] border border-[#3E3834] font-mono">
                            System
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#A8A29E] line-clamp-1">{r.description || 'No description'}</p>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-[#A8A29E]">
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
          <div className="lg:col-span-8 bg-[#181412] rounded-xl border border-[#2C2724] p-6 shadow-xl flex flex-col justify-between space-y-6">
            {selectedAdmin || selectedRole ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2C2724]">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[#FAF7F2] flex items-center gap-2">
                      <span>
                        {selectedAdmin
                          ? `${selectedAdmin.name} (${selectedAdmin.branch?.name || 'Branch'})`
                          : selectedRole?.name}
                      </span>
                      <span className="text-xs font-normal text-[#A8A29E]">
                        ({selectedPermIds.length} of {permissions.length} active)
                      </span>
                    </h2>
                    <p className="text-xs text-[#A8A29E] mt-0.5">
                      {selectedAdmin
                        ? 'Independent per-branch administrator permissions. Changes update an isolated branch role without affecting others.'
                        : (selectedRole?.description || 'System standard role')}
                    </p>
                  </div>

                  {isOwner && (
                    <button
                      onClick={handleSavePermissions}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#c29f2f] text-[#0E0B09] font-bold text-xs uppercase tracking-wider transition shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {saving ? 'Saving...' : 'Save Changes / መዝግብ'}
                    </button>
                  )}
                </div>

                {/* Permissions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {permissions.map((perm) => {
                    const isChecked = selectedPermIds.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`p-3 rounded-lg border text-xs flex items-start gap-3 transition-colors ${
                          !isOwner ? 'cursor-default' : 'cursor-pointer'
                        } ${
                          isChecked
                            ? 'bg-[#231D1A] border-[#D4AF37]/50 text-[#FAF7F2]'
                            : 'bg-[#120F0D] border-[#2C2724] text-[#A8A29E] hover:border-stone-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!isOwner}
                          onChange={() => {}}
                          className="mt-0.5 accent-[#D4AF37] cursor-pointer"
                        />
                        <div>
                          <p className={`font-semibold ${isChecked ? 'text-[#FAF7F2]' : 'text-stone-400'}`}>
                            {perm.name}
                          </p>
                          <p className="text-[11px] text-[#A8A29E] mt-0.5">{perm.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-[#A8A29E]">Select a role to inspect permissions</div>
            )}
          </div>
        </div>

        {/* Create Role Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[#181412] border border-[#2C2724] text-[#FAF7F2] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2C2724]">
                <h3 className="text-base font-serif font-bold text-[#D4AF37]">Create Custom Role</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#A8A29E] mb-1">
                    Role Identifier / የስራ ሚና ስም *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full bg-[#231D1A] border border-[#3E3834] rounded-lg px-3 py-2 text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
                    placeholder="e.g. FLOOR_SUPERVISOR"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#A8A29E] mb-1">
                    Description / መግለጫ
                  </label>
                  <textarea
                    rows={2}
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    className="w-full bg-[#231D1A] border border-[#3E3834] rounded-lg px-3 py-2 text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
                    placeholder="Brief description of responsibilities"
                  />
                </div>

                <div className="pt-3 border-t border-[#2C2724] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-[#231D1A] hover:bg-[#2C2724] text-stone-300 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#D4AF37] hover:bg-[#c29f2f] text-[#0E0B09] rounded-lg font-bold uppercase tracking-wider transition shadow-md"
                  >
                    Create Role
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
