'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAdminContext } from '@/components/AdminShell';
import { supabase } from '@/lib/supabase';
import { fetchQueuesDirectly, fetchQueueEntriesDirectly } from '@/lib/supabase-client';

export default function QueuesPage() {
  const { authFetch, showToast } = useAdminContext();

  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const selectedQueueRef = useRef(null);
  const debounceTimer = useRef(null);
  const [queueEntries, setQueueEntries] = useState([]);
  const [batchSize, setBatchSize] = useState(1);
  const [loadingAction, setLoadingAction] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Helpers
  const yearSuffix = (y) => ['', '1st', '2nd', '3rd', '4th'][y] || `${y}th`;
  const typeLabel = (t) => t === 'block_section' ? 'Block Section' : 'Irregular';

  // --- Data fetching ---
  const fetchQueuesAPI = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) setQueues(data);
    } catch (err) {
      console.error('Failed to fetch queues:', err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  const fetchQueueEntries = useCallback(async (config) => {
    try {
      const params = new URLSearchParams({
        schedule_id: config.schedule_id,
        year_level: config.year_level,
        enrollment_type: config.enrollment_type
      });
      const res = await fetch(`/api/queue-entries?${params}&t=${Date.now()}`);
      const data = await res.json();
      if (Array.isArray(data)) setQueueEntries(data);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    }
  }, []);

  // Direct Supabase reads for Realtime handler
  const fetchQueuesRealtime = useCallback(async () => {
    try {
      const data = await fetchQueuesDirectly();
      setQueues(data);
    } catch (err) {
      console.error('Failed to refresh queues from Supabase:', err);
    }
  }, []);

  const fetchQueueEntriesRealtime = useCallback(async (config) => {
    try {
      const data = await fetchQueueEntriesDirectly({
        schedule_id: config.schedule_id,
        year_level: config.year_level,
        enrollment_type: config.enrollment_type
      });
      if (Array.isArray(data)) setQueueEntries(data);
    } catch (err) {
      console.error('Failed to refresh entries from Supabase:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchQueuesAPI();
  }, [fetchQueuesAPI]);

  // Keep ref in sync
  useEffect(() => {
    selectedQueueRef.current = selectedQueue;
  }, [selectedQueue]);

  // Realtime subscriptions (debounced)
  useEffect(() => {
    const handleRealtimeChange = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        fetchQueuesRealtime();
        if (selectedQueueRef.current) fetchQueueEntriesRealtime(selectedQueueRef.current);
      }, 300);
    };

    const channel = supabase
      .channel('admin-queue-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_configs' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, handleRealtimeChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [fetchQueuesRealtime, fetchQueueEntriesRealtime]);

  // Polling fallback
  useEffect(() => {
    if (!selectedQueue) return;
    const pollInterval = setInterval(() => {
      fetchQueuesRealtime();
      if (selectedQueueRef.current) fetchQueueEntriesRealtime(selectedQueueRef.current);
    }, 5000);
    return () => clearInterval(pollInterval);
  }, [selectedQueue, fetchQueuesRealtime, fetchQueueEntriesRealtime]);

  // --- Handlers ---
  const handleCallNext = async (configId) => {
    const count = batchSize;
    setLoadingAction('call-next');

    const waitingEntries = queueEntries
      .filter(e => e.status === 'waiting')
      .sort((a, b) => a.queue_number - b.queue_number)
      .slice(0, count);

    if (waitingEntries.length > 0) {
      const waitingIds = new Set(waitingEntries.map(e => e.id));
      setQueueEntries(prev => prev.map(e => waitingIds.has(e.id) ? { ...e, status: 'serving' } : e));
      const lastEntry = waitingEntries[waitingEntries.length - 1];
      const updateData = (q) => {
        if (q.id === configId) {
          return {
            ...q,
            current_serving: lastEntry.queue_number,
            counts: {
              ...q.counts,
              waiting: Math.max(0, (q.counts?.waiting || 0) - waitingEntries.length),
              serving: (q.counts?.serving || 0) + waitingEntries.length
            }
          };
        }
        return q;
      };
      setQueues(prev => prev.map(updateData));
      if (selectedQueue && selectedQueue.id === configId) setSelectedQueue(prev => updateData(prev));
    }

    try {
      const res = await authFetch('/api/queue/next', {
        method: 'POST',
        body: JSON.stringify({ configId, count })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const result = await res.json();
      const called = result.called || 0;
      if (called === 0) {
        showToast('No more students waiting', 'error');
      } else {
        showToast(`Called ${called} student${called > 1 ? 's' : ''} successfully`);
      }
    } catch (err) {
      showToast(err.message || 'Failed to call next', 'error');
      fetchQueuesAPI();
      if (selectedQueue) fetchQueueEntries(selectedQueue);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStatusChange = async (entryId, action) => {
    setLoadingAction(`${action}-${entryId}`);

    const newStatus = action === 'complete' ? 'completed' : 'skipped';
    setQueueEntries(prev => prev.map(e => e.id === entryId ? { ...e, status: newStatus } : e));
    if (selectedQueue) {
      const prevEntry = queueEntries.find(e => e.id === entryId);
      const wasServing = prevEntry?.status === 'serving';
      const wasSkipped = prevEntry?.status === 'skipped';
      const updateData = (q) => {
        if (q.id === selectedQueue.id) {
          const counts = { ...q.counts };
          if (action === 'complete') {
            counts.completed = (counts.completed || 0) + 1;
            if (wasServing) counts.serving = Math.max(0, (counts.serving || 0) - 1);
            if (wasSkipped) counts.skipped = Math.max(0, (counts.skipped || 0) - 1);
          } else {
            counts.skipped = (counts.skipped || 0) + 1;
            if (wasServing) counts.serving = Math.max(0, (counts.serving || 0) - 1);
          }
          return { ...q, counts };
        }
        return q;
      };
      setQueues(prev => prev.map(updateData));
      setSelectedQueue(prev => updateData(prev));
    }

    try {
      const res = await authFetch('/api/queue/status', {
        method: 'POST',
        body: JSON.stringify({ entryId, action })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      showToast(`Student ${action === 'complete' ? 'completed' : 'skipped'} successfully`);
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
      fetchQueuesAPI();
      if (selectedQueue) fetchQueueEntries(selectedQueue);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteEntry = async (entryId, studentName) => {
    if (!confirm(`Remove "${studentName}" from the queue? This will mark them as a no-show.`)) return;
    setLoadingAction(`delete-${entryId}`);

    setQueueEntries(prev => prev.filter(e => e.id !== entryId));
    if (selectedQueue) {
      const prevEntry = queueEntries.find(e => e.id === entryId);
      const updateData = (q) => {
        if (q.id === selectedQueue.id) {
          const counts = { ...q.counts };
          if (prevEntry?.status === 'serving') counts.serving = Math.max(0, (counts.serving || 0) - 1);
          if (prevEntry?.status === 'skipped') counts.skipped = Math.max(0, (counts.skipped || 0) - 1);
          return { ...q, counts };
        }
        return q;
      };
      setQueues(prev => prev.map(updateData));
      setSelectedQueue(prev => updateData(prev));
    }

    try {
      const res = await authFetch('/api/queue/status', {
        method: 'POST',
        body: JSON.stringify({ entryId, action: 'delete' })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      showToast(`${studentName} removed from queue`);
    } catch (err) {
      showToast(err.message || 'Failed to remove student', 'error');
      fetchQueuesAPI();
      if (selectedQueue) fetchQueueEntries(selectedQueue);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSelectQueue = (q) => {
    setSelectedQueue(q);
    fetchQueueEntries(q);
  };

  // Stats
  const totalQueues = queues.length;
  const totalWaiting = queues.reduce((sum, q) => sum + (q.counts?.waiting || 0), 0);
  const totalServing = queues.reduce((sum, q) => sum + (q.counts?.serving || 0), 0);
  const totalCompleted = queues.reduce((sum, q) => sum + (q.counts?.completed || 0), 0);

  if (initialLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading queues...</p>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .admin-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-queue-header { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .admin-queue-controls { width: 100% !important; }
          .admin-queue-controls button { flex: 1 !important; }
          .admin-queue-ministats { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
          .admin-queue-ministats > div { flex: none !important; min-width: 0 !important; }
          .admin-queue-ministats .stat-value { font-size: 1.25rem !important; }
          .admin-queue-ministats .stat-label { font-size: 0.6rem !important; }
          .admin-queue-table-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; margin: 0 -16px !important; padding: 0 16px !important; }
          .admin-queue-table-wrap .table { min-width: 480px !important; }
          .admin-entry-actions { flex-wrap: nowrap !important; }
          .admin-entry-actions .btn { padding: 4px 8px !important; font-size: 0.75rem !important; }
          .queue-select-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ marginBottom: '16px' }}>
        {selectedQueue ? (
          <button onClick={() => { setSelectedQueue(null); setQueueEntries([]); }} className="btn btn-secondary btn-sm">
            ← Back to Queue List
          </button>
        ) : (
          <Link href="/admin/dashboard" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-4 admin-stat-grid" style={{ marginBottom: '24px' }}>
        <div className="card stat-card">
          <div className="stat-value">{totalQueues}</div>
          <div className="stat-label">Total Queues</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: '#3b82f6' }}>{totalWaiting}</div>
          <div className="stat-label">Waiting</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: '#f59e0b' }}>{totalServing}</div>
          <div className="stat-label">Serving</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: '#10b981' }}>{totalCompleted}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      {/* ===== STEP 1: Queue Selection ===== */}
      {!selectedQueue && (
        <div style={{ animation: 'slideUp 0.35s ease' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '16px' }}>
            Select a Queue to Manage
          </h2>
          {queues.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-text">No queues created yet</p>
              <p style={{ fontSize: '0.8125rem', color: '#9ca3af', marginTop: '4px' }}>
                Create schedules first, then students can register into queues
              </p>
            </div>
          ) : (
            <div className="queue-select-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {queues.map(q => (
                <div
                  key={q.id}
                  onClick={() => handleSelectQueue(q)}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    border: '2px solid var(--gray-200)',
                    padding: '24px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-500)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(234,107,34,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gray-200)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                      {yearSuffix(q.year_level)} Year
                    </h3>
                    <span className={`badge ${q.counts?.waiting ? 'badge-waiting' : 'badge-inactive'}`}>
                      {q.counts?.waiting || 0} waiting
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '8px' }}>
                    {typeLabel(q.enrollment_type)}
                  </p>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
                    Currently serving: <strong style={{ color: 'var(--primary-600)' }}>#{q.current_serving || 0}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== STEP 2: Student Management ===== */}
      {selectedQueue && (
        <div style={{ animation: 'slideUp 0.35s ease' }}>
          <div className="card">
            <div className="card-header admin-queue-header">
              <h3 className="card-title" style={{ fontSize: '1.25rem' }}>
                {yearSuffix(selectedQueue.year_level)} Year — {typeLabel(selectedQueue.enrollment_type)}
              </h3>
              <div className="admin-queue-controls" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <select
                  id="batch-size-select"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1.5px solid #d1d5db',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    background: 'white',
                    cursor: 'pointer',
                    color: '#374151',
                    minWidth: '52px',
                    textAlign: 'center'
                  }}
                >
                  {[1, 3, 5, 10, 20].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <button
                  className="btn btn-primary"
                  onClick={() => handleCallNext(selectedQueue.id)}
                  disabled={loadingAction === 'call-next'}
                >
                  {loadingAction === 'call-next'
                    ? 'Calling...'
                    : `▶ Call Next${batchSize > 1 ? ` ${batchSize}` : ''}`}
                </button>
              </div>
            </div>

            <div className="admin-queue-ministats" style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div className="stat-card card" style={{ flex: 1, padding: '12px' }}>
                <div className="stat-value" style={{ fontSize: '1.75rem', color: '#6366f1' }}>
                  {selectedQueue.current_serving ? `#${selectedQueue.current_serving}` : '—'}
                </div>
                <div className="stat-label" style={{ fontSize: '0.6875rem' }}>Ticket Called</div>
              </div>
              <div className="stat-card card" style={{ flex: 1, padding: '12px' }}>
                <div className="stat-value" style={{ fontSize: '1.75rem', color: '#3b82f6' }}>
                  {selectedQueue.counts?.waiting || 0}
                </div>
                <div className="stat-label" style={{ fontSize: '0.6875rem' }}>Waiting</div>
              </div>
              <div className="stat-card card" style={{ flex: 1, padding: '12px' }}>
                <div className="stat-value" style={{ fontSize: '1.75rem', color: '#10b981' }}>
                  {selectedQueue.counts?.completed || 0}
                </div>
                <div className="stat-label" style={{ fontSize: '0.6875rem' }}>Done</div>
              </div>
            </div>

            {/* Queue entries table */}
            <div className="admin-queue-table-wrap" style={{ overflowX: 'auto' }}>
              <div className="table-wrapper">
                <table className="table">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>ID</th>
                      <th>Course</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueEntries.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: '#9ca3af', padding: '24px' }}>
                          No entries in this queue
                        </td>
                      </tr>
                    ) : (
                      [...queueEntries]
                        .filter(entry => entry.status !== 'removed')
                        .sort((a, b) => {
                          const order = { serving: 0, skipped: 1, waiting: 2, completed: 3 };
                          return (order[a.status] ?? 4) - (order[b.status] ?? 4);
                        })
                        .map(entry => (
                          <tr key={entry.id}>
                            <td style={{ fontWeight: 700 }}>{entry.queue_number}</td>
                            <td>{entry.student_name}</td>
                            <td style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{entry.student_id}</td>
                            <td style={{ fontSize: '0.8125rem' }}>{entry.courses?.code || '—'}</td>
                            <td>
                              <span className={`badge ${entry.status === 'skipped' ? 'badge-serving' : `badge-${entry.status}`}`}>
                                {entry.status === 'skipped' ? 'in progress' : entry.status}
                              </span>
                            </td>
                            <td>
                              {entry.status === 'serving' && (
                                <div className="admin-entry-actions" style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleStatusChange(entry.id, 'complete')}
                                    disabled={loadingAction === `complete-${entry.id}`}
                                  >
                                    {loadingAction === `complete-${entry.id}` ? '...' : '✓ Done'}
                                  </button>
                                  <button
                                    className="btn btn-warning btn-sm"
                                    onClick={() => handleStatusChange(entry.id, 'skip')}
                                    disabled={loadingAction === `skip-${entry.id}`}
                                  >
                                    {loadingAction === `skip-${entry.id}` ? '...' : 'Skip'}
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteEntry(entry.id, entry.student_name)}
                                    disabled={loadingAction === `delete-${entry.id}`}
                                  >
                                    {loadingAction === `delete-${entry.id}` ? '...' : '🗑'}
                                  </button>
                                </div>
                              )}
                              {entry.status === 'skipped' && (
                                <div className="admin-entry-actions" style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleStatusChange(entry.id, 'complete')}
                                    disabled={loadingAction === `complete-${entry.id}`}
                                  >
                                    {loadingAction === `complete-${entry.id}` ? '...' : '✓ Done'}
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteEntry(entry.id, entry.student_name)}
                                    disabled={loadingAction === `delete-${entry.id}`}
                                  >
                                    {loadingAction === `delete-${entry.id}` ? '...' : '🗑'}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
