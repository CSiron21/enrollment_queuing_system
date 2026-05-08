'use client';

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const AdminContext = createContext(null);
export const useAdminContext = () => useContext(AdminContext);

export default function AdminShell({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // Admin profile
  const [myProfile, setMyProfile] = useState(null);
  const isTemporaryAdmin = myProfile?.is_temporary === true;



  // Auth check + auto-refresh listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/admin');
      } else {
        setSession(session);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        router.push('/admin');
      } else if (newSession) {
        setSession(newSession);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Authenticated fetch helper
  const authFetch = useCallback(async (url, options = {}) => {
    const { data: { session: freshSession } } = await supabase.auth.getSession();
    const token = freshSession?.access_token || session?.access_token;

    if (!token) {
      router.push('/admin');
      throw new Error('Session expired. Please log in again.');
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
  }, [session, router]);

  // Profile
  const fetchMyProfile = useCallback(async () => {
    try {
      const res = await authFetch('/api/admins/me');
      if (!res.ok) return;
      const data = await res.json();
      setMyProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  }, [authFetch]);

  useEffect(() => {
    if (session) fetchMyProfile();
  }, [session, fetchMyProfile]);

  // Toast helper
  const showToast = useCallback((message, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // Handlers
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin');
  };



  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ session, authFetch, showToast, myProfile, isTemporaryAdmin }}>
      <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
        {/* Toast notification */}
        {toast && (
          <div
            onClick={() => setToast(null)}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 9999,
              padding: '14px 24px',
              borderRadius: '10px',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem',
              background: toast.type === 'error'
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'linear-gradient(135deg, #22c55e, #16a34a)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              animation: 'slideIn 0.3s ease-out',
              maxWidth: '400px'
            }}
          >
            {toast.type === 'error' ? '❌' : '✅'} {toast.message}
          </div>
        )}

        <style>{`
          @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @media (max-width: 768px) {
            .admin-topbar { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; padding: 12px 16px !important; }
            .admin-topbar-actions { justify-content: flex-start !important; flex-wrap: wrap !important; gap: 8px !important; }
            .admin-topbar h1 { font-size: 1.1rem !important; }
            .admin-topbar-email { font-size: 0.8rem !important; display: block !important; word-break: break-all !important; margin-bottom: 4px !important; }
            .card { overflow: hidden !important; }
          }
        `}</style>

        {/* Top bar */}
        <div className="admin-topbar" style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <Link href="/admin/dashboard" style={{ textDecoration: 'none' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-800)', cursor: 'pointer' }}>
              ⚙️ Admin Dashboard
            </h1>
          </Link>
          <div className="admin-topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span className="admin-topbar-email" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {session?.user?.email}
              {isTemporaryAdmin && (
                <span style={{
                  marginLeft: '6px',
                  fontSize: '0.65rem',
                  padding: '2px 7px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: '#78350f',
                  fontWeight: 700
                }}>Temporary</span>
              )}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* Main content */}
        <div className="container" style={{ padding: '24px 16px' }}>
          {children}
        </div>


      </div>
    </AdminContext.Provider>
  );
}
