'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAdminContext } from '@/components/AdminShell';

export default function AdminsPage() {
  const { authFetch, showToast, session, isTemporaryAdmin } = useAdminContext();

  const [admins, setAdmins] = useState([]);
  const [loadingAction, setLoadingAction] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Create admin modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: '', password: '', currentPassword: '', is_temporary: false });

  // Delete admin modal
  const [showDeleteAdminModal, setShowDeleteAdminModal] = useState(false);
  const [deleteAdminTarget, setDeleteAdminTarget] = useState(null);
  const [deleteAdminPassword, setDeleteAdminPassword] = useState('');

  // Change password modal
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Fetch
  const fetchAdmins = useCallback(async () => {
    try {
      const res = await authFetch('/api/admins');
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const data = await res.json();
      setAdmins(data);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
    } finally {
      setInitialLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Handlers
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setLoadingAction('create-admin');
    try {
      const res = await authFetch('/api/admins', {
        method: 'POST',
        body: JSON.stringify(adminForm)
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const newAdmin = await res.json();
      setAdmins(prev => [...prev, newAdmin]);
      showToast('Admin created successfully');
      setShowAdminModal(false);
      setAdminForm({ email: '', password: '', currentPassword: '', is_temporary: false });
    } catch (err) {
      showToast(err.message || 'Failed to create admin', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const openDeleteAdmin = (admin) => {
    setDeleteAdminTarget(admin);
    setDeleteAdminPassword('');
    setShowDeleteAdminModal(true);
  };

  const handleDeleteAdmin = async (e) => {
    e.preventDefault();
    if (!deleteAdminTarget) return;
    setLoadingAction('delete-admin');
    try {
      const res = await authFetch(`/api/admins/${deleteAdminTarget.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ currentPassword: deleteAdminPassword })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setAdmins(prev => prev.filter(a => a.id !== deleteAdminTarget.id));
      showToast('Admin deleted successfully');
      setShowDeleteAdminModal(false);
      setDeleteAdminTarget(null);
      setDeleteAdminPassword('');
    } catch (err) {
      showToast(err.message || 'Failed to delete admin', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setLoadingAction('change-password');
    try {
      const res = await authFetch('/api/admins/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: changePasswordForm.currentPassword,
          newPassword: changePasswordForm.newPassword
        })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      showToast('Password changed successfully');
      setShowChangePasswordModal(false);
      setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  if (initialLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading admins...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Link href="/admin/dashboard" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">👥 Admin Users</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => {
              setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
              setShowChangePasswordModal(true);
            }}>
              🔑 Change Password
            </button>
            {!isTemporaryAdmin && (
              <button className="btn btn-primary" onClick={() => {
                setAdminForm({ email: '', password: '', currentPassword: '', is_temporary: false });
                setShowAdminModal(true);
              }}>
                + Add Admin
              </button>
            )}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#9ca3af', padding: '24px' }}>
                    No admin users found
                  </td>
                </tr>
              ) : (
                admins.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>
                      {a.email}
                      {a.id === session?.user?.id && (
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
                          color: 'var(--primary-700)',
                          fontWeight: 700
                        }}>You</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontWeight: 700,
                        background: a.is_temporary
                          ? 'linear-gradient(135deg, #fef3c7, #fde68a)'
                          : 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                        color: a.is_temporary ? '#92400e' : '#065f46'
                      }}>
                        {a.is_temporary ? 'Temporary' : 'Permanent'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                      {new Date(a.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      {a.id === session?.user?.id ? (
                        <span style={{ fontSize: '0.8125rem', color: '#9ca3af', fontStyle: 'italic' }}>Current account</span>
                      ) : isTemporaryAdmin ? (
                        <span style={{ fontSize: '0.8125rem', color: '#d1d5db', fontStyle: 'italic' }}>—</span>
                      ) : (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => openDeleteAdmin(a)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== CREATE ADMIN MODAL ===== */}
      {showAdminModal && (
        <div className="modal-overlay" onClick={() => setShowAdminModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create Admin User</h2>
            <form onSubmit={handleCreateAdmin}>
              <div className="form-group">
                <label className="form-label">New Admin Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="newadmin@hau.edu.ph"
                  value={adminForm.email}
                  onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Admin Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min. 6 characters"
                  value={adminForm.password}
                  onChange={e => setAdminForm(f => ({ ...f, password: e.target.value }))}
                  minLength={6}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '8px' }}>Account Type</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setAdminForm(f => ({ ...f, is_temporary: false }))}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `2px solid ${!adminForm.is_temporary ? '#10b981' : '#e5e7eb'}`,
                      background: !adminForm.is_temporary ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'white',
                      color: !adminForm.is_temporary ? '#065f46' : '#6b7280',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    🛡️ Permanent
                    <div style={{ fontWeight: 400, fontSize: '0.75rem', marginTop: '2px' }}>Full admin access</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminForm(f => ({ ...f, is_temporary: true }))}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `2px solid ${adminForm.is_temporary ? '#f59e0b' : '#e5e7eb'}`,
                      background: adminForm.is_temporary ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 'white',
                      color: adminForm.is_temporary ? '#92400e' : '#6b7280',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    ⏱️ Temporary
                    <div style={{ fontWeight: 400, fontSize: '0.75rem', marginTop: '2px' }}>Cannot add/delete admins</div>
                  </button>
                </div>
              </div>
              <div style={{
                margin: '20px 0 16px',
                padding: '16px',
                borderRadius: '10px',
                border: '2px solid #fbbf24',
                background: 'linear-gradient(135deg, #fffbeb, #fef3c7)'
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🔒 Identity Confirmation
                </div>
                <div style={{ fontSize: '0.8rem', color: '#a16207', marginBottom: '12px' }}>
                  Enter YOUR current password to confirm this action.
                </div>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Your current password"
                  value={adminForm.currentPassword}
                  onChange={e => setAdminForm(f => ({ ...f, currentPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdminModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loadingAction === 'create-admin'}>
                  {loadingAction === 'create-admin' ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE ADMIN MODAL ===== */}
      {showDeleteAdminModal && deleteAdminTarget && (
        <div className="modal-overlay" onClick={() => setShowDeleteAdminModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title" style={{ color: '#dc2626' }}>Delete Admin User</h2>
            <form onSubmit={handleDeleteAdmin}>
              <div style={{
                padding: '16px',
                borderRadius: '10px',
                border: '2px solid #fca5a5',
                background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#991b1b', fontWeight: 600, marginBottom: '4px' }}>
                  ⚠️ You are about to permanently delete:
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#7f1d1d' }}>
                  {deleteAdminTarget.email}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '8px' }}>
                  This action cannot be undone. The admin will lose all access immediately.
                </div>
              </div>
              <div style={{
                padding: '16px',
                borderRadius: '10px',
                border: '2px solid #fbbf24',
                background: 'linear-gradient(135deg, #fffbeb, #fef3c7)'
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🔒 Identity Confirmation
                </div>
                <div style={{ fontSize: '0.8rem', color: '#a16207', marginBottom: '12px' }}>
                  Enter YOUR current password to confirm deletion.
                </div>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Your current password"
                  value={deleteAdminPassword}
                  onChange={e => setDeleteAdminPassword(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteAdminModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={loadingAction === 'delete-admin'}
                >
                  {loadingAction === 'delete-admin' ? 'Deleting...' : '🗑️ Confirm Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== CHANGE PASSWORD MODAL ===== */}
      {showChangePasswordModal && (
        <div className="modal-overlay" onClick={() => setShowChangePasswordModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">🔑 Change Password</h2>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter your current password"
                  value={changePasswordForm.currentPassword}
                  onChange={e => setChangePasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min. 6 characters"
                  value={changePasswordForm.newPassword}
                  onChange={e => setChangePasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                  minLength={6}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Re-enter new password"
                  value={changePasswordForm.confirmPassword}
                  onChange={e => setChangePasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  minLength={6}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowChangePasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loadingAction === 'change-password'}>
                  {loadingAction === 'change-password' ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
