import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Sprout,
  Search,
  Calendar,
  Mail,
  UserPlus,
  Trash2,
  X,
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';

export const UserManagement: React.FC = () => {
  const { users, addUser, updateUserRole, deleteUser, currentUser } = useAgriStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'farmer'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'farmer'>('farmer');

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.uid || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter(u => u.role === 'admin').length;
  const farmerCount = users.filter(u => u.role === 'farmer').length;

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;
    addUser({ email: email.trim(), full_name: fullName.trim(), role, assigned_farm_ids: [] });
    setFullName(''); setEmail(''); setRole('farmer');
    setShowAddModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="at-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-lg)',
              background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users style={{ width: 18, height: 18, color: '#6366f1' }} />
            </div>
            User Management
          </h1>
          <p className="at-page-subtitle">
            Manage system access roles and user accounts &bull;{' '}
            <span className="at-badge info" style={{ fontSize: 10, verticalAlign: 'middle' }}>Admin Only</span>
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="at-btn" id="at-add-user-btn"
          style={{ background: '#6366f1', color: 'white', border: 'none', boxShadow: '0 4px 14px rgba(99,102,241,0.25)', fontWeight: 700 }}>
          <UserPlus style={{ width: 15, height: 15 }} />
          Add New User
        </button>
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Accounts', val: users.length, icon: <Users style={{ width: 16, height: 16, color: 'var(--color-text-muted)' }} />, bg: 'var(--color-surface-muted)' },
          { label: 'Administrators', val: adminCount, icon: <ShieldCheck style={{ width: 16, height: 16, color: '#6366f1' }} />, bg: '#ede9fe' },
          { label: 'Field Workers', val: farmerCount, icon: <Sprout style={{ width: 16, height: 16, color: 'var(--color-primary)' }} />, bg: 'var(--color-primary-muted)' },
        ].map(m => (
          <div key={m.label} className="at-metric-card">
            <div className="at-metric-label">
              {m.label}
              <div className="at-metric-icon" style={{ background: m.bg }}>{m.icon}</div>
            </div>
            <div className="at-metric-value">{m.val}</div>
          </div>
        ))}
      </div>

      {/* ── Search + Filter ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div className="at-search" style={{ flex: 1, minWidth: 200, maxWidth: 340 }}>
          <Search className="at-search-icon" style={{ width: 15, height: 15 }} />
          <input className="at-input" type="text" placeholder="Search by name, email, or UID..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: 34 }} aria-label="Search users" />
        </div>
        <div className="at-tabs" style={{ width: 'auto', gap: 2 }}>
          {(['all', 'admin', 'farmer'] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`at-tab${roleFilter === r ? ' active' : ''}`}>
              {r === 'all' ? 'All Roles' : r === 'admin' ? 'Admins' : 'Field Workers'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="at-table-wrap">
        <table className="at-table">
          <thead>
            <tr>
              <th>User Identity</th>
              <th>Role</th>
              <th>System UID</th>
              <th>Joined</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--color-text-muted)' }}>
                  No matching users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => {
                const isCurrent = u.uid === currentUser?.uid;
                const isAdminUser = u.role === 'admin';
                const initials = (u.full_name?.charAt(0) || 'U').toUpperCase();

                return (
                  <tr key={u.uid}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 'var(--radius-lg)',
                          background: isAdminUser ? '#6366f1' : 'var(--color-primary)',
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 14, flexShrink: 0,
                        }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 13 }}>
                            {u.full_name || 'AgriTwin User'}
                            {isCurrent && (
                              <span style={{ fontSize: 10, background: 'var(--color-text-primary)', color: 'white', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace' }}>
                                You
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
                            <Mail style={{ width: 11, height: 11 }} />
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {isAdminUser ? (
                        <span className="at-badge info" style={{ fontSize: 11 }}>
                          <ShieldCheck style={{ width: 11, height: 11 }} />
                          Administrator
                        </span>
                      ) : (
                        <span className="at-badge success" style={{ fontSize: 11 }}>
                          <Sprout style={{ width: 11, height: 11 }} />
                          Field Worker
                        </span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--color-text-muted)' }}>{u.uid}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
                        <Calendar style={{ width: 11, height: 11 }} />
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => updateUserRole(u.uid, isAdminUser ? 'farmer' : 'admin')}
                          className={`at-btn at-btn-sm ${isAdminUser ? 'at-btn-secondary' : 'at-btn-secondary'}`}
                          style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px' }}
                        >
                          {isAdminUser ? 'Set as Worker' : 'Promote to Admin'}
                        </button>
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => { if (confirm(`Delete ${u.full_name}?`)) deleteUser(u.uid); }}
                            className="at-btn-icon"
                            style={{ width: 30, height: 30, color: 'var(--color-text-muted)' }}
                            title="Delete user"
                          >
                            <Trash2 style={{ width: 13, height: 13 }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Add User Modal ── */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)',
            maxWidth: 440, width: '100%', padding: 28,
            boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)',
            position: 'relative',
          }}>
            <button type="button" onClick={() => setShowAddModal(false)}
              className="at-btn-icon" style={{ position: 'absolute', top: 16, right: 16 }}>
              <X style={{ width: 15, height: 15 }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-xl)', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus style={{ width: 20, height: 20, color: '#6366f1' }} />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>Provision New User</h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Create an authenticated system user profile</p>
              </div>
            </div>

            <form onSubmit={handleAddUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="at-label">Full Name</label>
                <input type="text" required placeholder="e.g. Ramesh Patil" value={fullName}
                  onChange={e => setFullName(e.target.value)} className="at-input" />
              </div>
              <div>
                <label className="at-label">Email Address</label>
                <input type="email" required placeholder="ramesh@agritwin.com" value={email}
                  onChange={e => setEmail(e.target.value)} className="at-input" />
              </div>
              <div>
                <label className="at-label">Initial Access Role</label>
                <select value={role} onChange={e => setRole(e.target.value as any)} className="at-input at-select">
                  <option value="farmer">Field Worker / Farmer</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--color-border-muted)', paddingTop: 16 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="at-btn at-btn-ghost">Cancel</button>
                <button type="submit" className="at-btn" id="at-create-user-submit"
                  style={{ background: '#6366f1', color: 'white', border: 'none', boxShadow: '0 4px 14px rgba(99,102,241,0.25)' }}>
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
