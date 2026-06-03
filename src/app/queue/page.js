'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { fetchQueuesDirectly } from '@/lib/supabase-client';
import './queue-board.css';

export default function QueueBoardPage() {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState('');
  const debounceTimer = useRef(null);
  const prevServing = useRef({}); // track previous serving numbers for flash animation
  const [flashCells, setFlashCells] = useState({}); // { queueId: true }

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initial load via API
  const fetchQueuesInitial = useCallback(async () => {
    try {
      const res = await fetch('/api/queue');
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error(data.error || 'Invalid response');
      setQueues(data);
      // Seed prev serving
      const map = {};
      data.forEach(q => { map[q.id] = q.current_serving; });
      prevServing.current = map;
    } catch (err) {
      console.error('Failed to load queues:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Realtime refresh — direct Supabase read
  const fetchQueuesRealtime = useCallback(async () => {
    try {
      const data = await fetchQueuesDirectly();
      // Detect which cells changed serving number
      const newFlash = {};
      data.forEach(q => {
        if (prevServing.current[q.id] !== undefined && prevServing.current[q.id] !== q.current_serving && q.current_serving) {
          newFlash[q.id] = true;
        }
        prevServing.current[q.id] = q.current_serving;
      });
      if (Object.keys(newFlash).length > 0) {
        setFlashCells(newFlash);
        setTimeout(() => setFlashCells({}), 1200);
      }
      setQueues(data);
    } catch (err) {
      console.error('Failed to refresh queues from Supabase:', err);
    }
  }, []);

  useEffect(() => {
    fetchQueuesInitial();

    const handleRealtimeChange = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(fetchQueuesRealtime, 300);
    };

    const channel = supabase
      .channel('board-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_configs' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, handleRealtimeChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [fetchQueuesInitial, fetchQueuesRealtime]);

  const yearSuffix = (y) => ['All', '1st', '2nd', '3rd', '4th'][y] || `${y}th`;
  const typeLabel = (t) => t === 'block_section' ? 'Block Section' : 'Irregular';

  // Group queues by enrollment type for display
  const blockQueues = queues
    .filter(q => q.enrollment_type === 'block_section')
    .sort((a, b) => a.year_level - b.year_level);
  const irregQueues = queues
    .filter(q => q.enrollment_type === 'irregular')
    .sort((a, b) => a.year_level - b.year_level);

  if (loading) {
    return (
      <div className="qb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px', borderTopColor: 'var(--qb-accent)' }}></div>
          <p style={{ color: 'var(--qb-text-muted)' }}>Loading queue board...</p>
        </div>
      </div>
    );
  }

  const renderQueueTable = (queueList, title) => {
    if (queueList.length === 0) return null;
    return (
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: 'var(--qb-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '12px',
          paddingLeft: '8px',
          borderLeft: '3px solid var(--qb-accent)',
        }}>
          {title}
        </h2>
        <table className="qb-matrix">
          <thead>
            <tr>
              <th>Year Level</th>
              <th>Now Serving</th>
              <th style={{ textAlign: 'center' }}>
                <span className="qb-dot qb-dot--waiting" style={{ marginRight: '4px' }}></span>
                Waiting
              </th>
              <th style={{ textAlign: 'center' }}>
                <span className="qb-dot qb-dot--done" style={{ marginRight: '4px' }}></span>
                Done
              </th>
            </tr>
          </thead>
          <tbody>
            {queueList.map(q => {
              const isActive = q.current_serving && q.current_serving > 0;
              const isFlashing = flashCells[q.id];
              return (
                <tr key={q.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--qb-accent)' }}>
                      {yearSuffix(q.year_level)} Year
                    </span>
                  </td>
                  <td>
                    <div className={`qb-cell ${isActive ? 'qb-cell--active' : ''} ${isFlashing ? 'qb-cell--flash' : ''}`}
                      style={{ display: 'inline-block', minWidth: '80px', textAlign: 'center' }}
                    >
                      <div className="qb-cell-number" style={{ fontSize: '1.5rem' }}>
                        {q.current_serving || '—'}
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    <span className="qb-cell-stat-value--waiting">{q.counts?.waiting || 0}</span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    <span className="qb-cell-stat-value--done">{q.counts?.completed || 0}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="qb">
      {/* Header */}
      <header className="qb-header">
        <div className="qb-header-left">
          <Link href="/" className="qb-back-btn" title="Back to Home">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <img src="/soc2.png" alt="SOC Logo" className="qb-logo" />
          <div>
            <div className="qb-header-title">
              <span className="qb-gold">HAU</span> Queue Board
            </div>
            <div className="qb-header-subtitle">School of Computing · Enrollment Queue Status</div>
          </div>
        </div>
        <div className="qb-header-right">
          <div className="qb-live-badge">
            <span className="qb-live-dot"></span>
            LIVE
          </div>
          <div className="qb-clock">{clock}</div>
        </div>
      </header>

      {/* Body */}
      <div className="qb-body">
        {queues.length === 0 ? (
          <div className="qb-empty-state">
            <div className="qb-empty-state-icon">📭</div>
            <div className="qb-empty-state-text">No queues at the moment</div>
            <div className="qb-empty-state-sub">Queues will appear here once enrollment schedules are created.</div>
          </div>
        ) : (
          <>
            {renderQueueTable(blockQueues, 'Block Section')}
            {renderQueueTable(irregQueues, 'Irregular / Free Select')}
          </>
        )}
      </div>
    </div>
  );
}
