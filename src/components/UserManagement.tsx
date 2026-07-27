import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Company } from '../types';
import { Language, t } from '../lib/i18n';
import { UserCog, Users, Plus, Edit, Trash2, Shield, Building2, Save, Key, Eye, EyeOff } from 'lucide-react';

interface UserManagementProps {
  profile: Profile;
  companies: Company[];
  lang: Language;
  onUpdate: () => void;
}

const DEFAULT_PERMISSIONS = {
  vehicles: { view: true, add: false, edit: false, delete: false },
  drivers: { view: true, add: false, edit: false, delete: false },
  maintenance: { view: true, add: false, edit: false, delete: false },
  fuel: { view: true, add: false, edit: false, delete: false },
  checkout: { view: true, add: false, edit: false, delete: false },
  reports: { view: false, export: false },
  settings: { view: false, edit: false },
  users: { view: false, add: false, edit: false, delete: false }
};

export const UserManagement: React.FC<UserManagementProps> = ({ profile, companies, lang, onUpdate }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('user');
  const [formCompanyId, setFormCompanyId] = useState<string>('');
  const [formPermissions, setFormPermissions] = useState<any>(DEFAULT_PERMISSIONS);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormEmail('');
    setFormPassword('');
    setFormRole('user');
    setFormCompanyId('');
    setFormPermissions(DEFAULT_PERMISSIONS);
    setEditingUser(null);
  };

  const handleEditUser = (user: Profile) => {
    setEditingUser(user);
    setFormEmail(user.email);
    setFormPassword('');
    setFormRole(user.role || 'user');
    setFormCompanyId(user.company_id || '');
    setFormPermissions(user.permissions || DEFAULT_PERMISSIONS);
    setShowAddModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error('No session');

      if (editingUser) {
        const { error } = await supabase
          .from('profiles')
          .update({
            role: formRole,
            company_id: formCompanyId || null,
            permissions: formPermissions
          })
          .eq('id', editingUser.id);
        if (error) throw error;
      } else {
        const response = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            email: formEmail,
            password: formPassword,
            role: formRole,
            companyId: formCompanyId || null,
            permissions: formPermissions
          })
        });

        const text = await response.text();
        if (!response.ok) {
          let errorMsg = 'Server error';
          try {
            const json = JSON.parse(text);
            errorMsg = json.error || json.message || errorMsg;
          } catch (e) {
            errorMsg = text || errorMsg;
          }
          throw new Error(errorMsg);
        }
        const data = JSON.parse(text);
        if (data.error) throw new Error(data.error);
      }

      await loadUsers();
      setShowAddModal(false);
      resetForm();
      onUpdate();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t('confirmDeleteUser', lang))) return;
    setActionLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error('No session');

      console.log('Deleting user:', userId);
      console.log('Token:', session.access_token);

      const response = await fetch(`/api/admin/delete-user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const text = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', text);

      if (!response.ok) {
        let errorMsg = 'Server error';
        try {
          const json = JSON.parse(text);
          errorMsg = json.error || json.message || errorMsg;
        } catch (e) {
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }
      const data = JSON.parse(text);
      if (data.error) throw new Error(data.error);

      await loadUsers();
      onUpdate();
    } catch (err: any) {
      alert('❌ Error deleting user: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail || !resetPassword) {
      alert('Email and new password are required');
      return;
    }
    setActionLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error('No session');

      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: resetEmail,
          newPassword: resetPassword
        })
      });

      const text = await response.text();
      if (!response.ok) {
        let errorMsg = 'Server error';
        try {
          const json = JSON.parse(text);
          errorMsg = json.error || json.message || errorMsg;
        } catch (e) {
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }
      const data = JSON.parse(text);
      if (data.error) throw new Error(data.error);

      alert('✅ Password reset successfully for ' + resetEmail);
      setShowPasswordReset(false);
      setResetEmail('');
      setResetPassword('');
    } catch (err: any) {
      alert('❌ Error resetting password: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const togglePermission = (module: string, action: string) => {
    setFormPermissions((prev: any) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action]
      }
    }));
  };

  if (loading) return <div className="p-8 text-center text-slate-500">{t('loading', lang)}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCog className="w-6 h-6 text-blue-600" />
            {t('userManagement', lang)}
          </h2>
          <p className="text-xs text-slate-500">{t('userManagementSub', lang)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t('addUser', lang)}
          </button>
          <button
            onClick={() => setShowPasswordReset(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
          >
            <Key className="w-4 h-4" /> Reset Password
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-bold">
              <tr>
                <th className="p-4">{t('userEmail', lang)}</th>
                <th className="p-4">{t('userRole', lang)}</th>
                <th className="p-4">{t('userCompany', lang)}</th>
                <th className="p-4">{t('date', lang)}</th>
                <th className="p-4">{t('actions', lang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => {
                const isCurrentUser = u.id === profile.id;
                const companyName = companies.find(c => c.id === u.company_id)?.name || (u.company_id ? 'Unknown' : 'All Companies');

                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="p-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {u.email}
                      {isCurrentUser && (
                        <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                          {t('you', lang)}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        u.role === 'admin' ? 'bg-rose-100 text-rose-700' :
                        u.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                        u.role === 'disabled' ? 'bg-slate-200 text-slate-500' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {t(`role${u.role.charAt(0).toUpperCase() + u.role.slice(1)}`, lang) || u.role}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-300">
                      {u.company_id ? companyName : 'All Companies'}
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-mono">
                      {new Date(u.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                    <td className="p-4">
                      {!isCurrentUser && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleEditUser(u)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-bold"
                          >
                            {t('edit', lang)}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                          >
                            {t('delete', lang)}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingUser ? t('editUser', lang) : t('addUser', lang)}
              </h3>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('userEmail', lang)} *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    disabled={!!editingUser}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50"
                    placeholder="user@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('userPassword', lang)} {!editingUser && '*'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                    placeholder={editingUser ? 'Leave blank to keep current' : '••••••••'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('userRole', lang)}
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="admin">{t('roleAdmin', lang)}</option>
                    <option value="manager">{t('roleManager', lang)}</option>
                    <option value="user">{t('roleUser', lang)}</option>
                    <option value="disabled">{t('roleDisabled', lang)}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('userCompany', lang)}
                  </label>
                  <select
                    value={formCompanyId}
                    onChange={(e) => setFormCompanyId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="">All Companies</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Permissions Matrix */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  {t('permissionsLabel', lang)}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {Object.entries(formPermissions).map(([module, actions]: [string, any]) => (
                    <div key={module} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                      <div className="font-bold text-slate-700 dark:text-slate-300 capitalize mb-1">{module}</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.keys(actions).map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => togglePermission(module, action)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                              actions[action]
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                            }`}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600"
                >
                  {t('cancel', lang)}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {actionLoading ? 'Saving...' : t('save', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                Reset Password
              </h3>
              <button onClick={() => setShowPasswordReset(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">User Email *</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="user@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600"
                >
                  {t('cancel', lang)}
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs shadow transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  {actionLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};