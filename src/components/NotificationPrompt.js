'use client';

import { useState, useEffect } from 'react';

const DISMISS_KEY = 'notif_prompt_dismissed';

/**
 * A gentle, non-blocking banner that encourages (but does not force)
 * students to enable browser notifications.
 * 
 * - Auto-hides if notifications are already granted or unsupported
 * - Dismissible via ✕ button (persists in sessionStorage)
 * - Shows feedback after permission request (granted/denied)
 */
export default function NotificationPrompt() {
  const [permissionState, setPermissionState] = useState('default'); // 'default' | 'granted' | 'denied'
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash
  const [supported, setSupported] = useState(false);
  const [justActioned, setJustActioned] = useState(false); // true after user clicks enable

  useEffect(() => {
    // Check browser support
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setSupported(false);
      return;
    }

    setSupported(true);
    setPermissionState(Notification.permission);

    // If already granted, no need to show the prompt
    if (Notification.permission === 'granted') {
      setDismissed(true);
      return;
    }

    // Check if user has dismissed this session
    const wasDismissed = sessionStorage.getItem(DISMISS_KEY);
    setDismissed(!!wasDismissed);
  }, []);

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      setJustActioned(true);

      if (permission === 'granted') {
        // Show a test notification
        new Notification('Notifications Enabled! ✅', {
          body: 'You\'ll be notified when your queue turn is near.',
          icon: '/soc2.png',
        });
        // Auto-dismiss after a short delay
        setTimeout(() => setDismissed(true), 3000);
      }
    } catch {
      // Some browsers may throw on requestPermission
      setPermissionState('denied');
      setJustActioned(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, 'true');
  };

  // Don't render if: not supported, already granted (and not just actioned), or dismissed
  if (!supported) return null;
  if (permissionState === 'granted' && !justActioned) return null;
  if (dismissed) return null;

  return (
    <div
      id="notification-prompt"
      style={{
        marginBottom: '16px',
        padding: '14px 18px',
        borderRadius: '12px',
        border: '2px solid #93c5fd',
        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        position: 'relative',
        animation: 'slideUp 0.35s ease',
      }}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification prompt"
        style={{
          position: 'absolute',
          top: '8px',
          right: '10px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.1rem',
          color: '#6b7280',
          padding: '2px 6px',
          borderRadius: '4px',
          lineHeight: 1,
        }}
      >
        ✕
      </button>

      <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🔔</span>

      <div style={{ flex: 1, paddingRight: '20px' }}>
        {/* Default state — prompt to enable */}
        {permissionState === 'default' && !justActioned && (
          <>
            <div style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#1e40af',
              marginBottom: '4px',
            }}>
              Stay notified when your turn is near!
            </div>
            <div style={{
              fontSize: '0.85rem',
              color: '#1d4ed8',
              lineHeight: 1.5,
              marginBottom: '10px',
            }}>
              Enable browser notifications to get an alert when you&apos;re within 5 students of being served. You won&apos;t miss your turn!
            </div>
            <button
              onClick={handleEnable}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.3)';
              }}
            >
              🔔 Enable Notifications
            </button>
          </>
        )}

        {/* Granted state */}
        {permissionState === 'granted' && justActioned && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#166534',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}>
            <span style={{ fontSize: '1.2rem' }}>✅</span>
            Notifications enabled! You&apos;ll be alerted when your turn is near.
          </div>
        )}

        {/* Denied state */}
        {permissionState === 'denied' && (
          <>
            <div style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#92400e',
              marginBottom: '4px',
            }}>
              Notifications are blocked
            </div>
            <div style={{
              fontSize: '0.85rem',
              color: '#78350f',
              lineHeight: 1.5,
            }}>
              To enable notifications, click the lock/info icon in your browser&apos;s address bar, find &quot;Notifications&quot;, and set it to &quot;Allow&quot;. Then reload this page.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
