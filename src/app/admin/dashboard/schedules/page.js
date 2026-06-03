'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAdminContext } from '@/components/AdminShell';

export default function SchedulesPage() {
  const { authFetch, showToast } = useAdminContext();

  const [schedules, setSchedules] = useState([]);
  const [loadingAction, setLoadingAction] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    enrollment_type: 'block_section',
    year_level: '1',
    schedule_date: '',
    start_time: '',
    end_time: ''
  });

  // Helpers
  const yearSuffix = (y) => ['All', '1st', '2nd', '3rd', '4th'][y] || `${y}th`;
  const typeLabel = (t) => t === 'block_section' ? 'Block Section' : 'Irregular';
  const formatTime = (time) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${m} ${ampm}`;
  };

  // Fetch
  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch(`/api/schedules?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) setSchedules(data);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Handlers
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setLoadingAction('save-schedule');
    try {
      let res;
      if (editingSchedule) {
        res = await authFetch(`/api/schedules/${editingSchedule.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...scheduleForm,
            year_level: parseInt(scheduleForm.year_level)
          })
        });
      } else {
        res = await authFetch('/api/schedules', {
          method: 'POST',
          body: JSON.stringify({
            ...scheduleForm,
            year_level: parseInt(scheduleForm.year_level)
          })
        });
      }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }

      const savedSchedule = await res.json();

      if (editingSchedule) {
        setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? savedSchedule : s));
      } else {
        setSchedules(prev => [...prev, savedSchedule]);
      }

      showToast(editingSchedule ? 'Schedule updated' : 'Schedule created');
      setShowScheduleModal(false);
      setEditingSchedule(null);
      setScheduleForm({
        enrollment_type: 'block_section', year_level: '1',
        schedule_date: '', start_time: '', end_time: ''
      });
    } catch (err) {
      showToast(err.message || 'Failed to save schedule', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!confirm('Delete this schedule? This will also remove associated queue entries.')) return;
    setLoadingAction(`delete-s-${id}`);
    try {
      const res = await authFetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setSchedules(prev => prev.filter(s => s.id !== id));
      showToast('Schedule deleted');
    } catch (err) {
      showToast(err.message || 'Failed to delete schedule', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteAllSchedules = async () => {
    if (!confirm('Delete ALL schedules? This will also remove all associated queue entries. This action cannot be undone.')) return;
    setLoadingAction('delete-all-schedules');
    try {
      const res = await authFetch('/api/schedules', { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setSchedules([]);
      showToast('All schedules deleted');
    } catch (err) {
      showToast(err.message || 'Failed to delete all schedules', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const openEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      enrollment_type: schedule.enrollment_type,
      year_level: String(schedule.year_level),
      schedule_date: schedule.schedule_date,
      start_time: schedule.start_time,
      end_time: schedule.end_time
    });
    setShowScheduleModal(true);
  };

  if (initialLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading schedules...</p>
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
          <h3 className="card-title">📅 Enrollment Schedules</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {schedules.length > 0 && (
              <button
                className="btn btn-danger"
                onClick={handleDeleteAllSchedules}
                disabled={loadingAction === 'delete-all-schedules'}
              >
                {loadingAction === 'delete-all-schedules' ? 'Deleting...' : '🗑 Delete All'}
              </button>
            )}
            <button className="btn btn-primary" onClick={() => {
              setEditingSchedule(null);
              setScheduleForm({
                enrollment_type: 'block_section', year_level: '1',
                schedule_date: '', start_time: '', end_time: ''
              });
              setShowScheduleModal(true);
            }}>
              + Add Schedule
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Year Level</th>
                <th>Date</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#9ca3af', padding: '24px' }}>
                    No schedules created yet
                  </td>
                </tr>
              ) : (
                schedules.map(s => (
                  <tr key={s.id}>
                    <td>{typeLabel(s.enrollment_type)}</td>
                    <td>{yearSuffix(s.year_level)} Year</td>
                    <td>{s.schedule_date}</td>
                    <td>{formatTime(s.start_time)} — {formatTime(s.end_time)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditSchedule(s)}>
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteSchedule(s.id)}
                          disabled={loadingAction === `delete-s-${s.id}`}
                        >
                          {loadingAction === `delete-s-${s.id}` ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== SCHEDULE MODAL ===== */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
            </h2>
            <form onSubmit={handleSaveSchedule}>
              <div className="form-group">
                <label className="form-label">Enrollment Type</label>
                <select
                  className="form-select"
                  value={scheduleForm.enrollment_type || ''}
                  onChange={e => setScheduleForm(f => ({ ...f, enrollment_type: e.target.value }))}
                  required
                >
                  <option value="block_section">Block Section</option>
                  <option value="irregular">Irregular / Free Select</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year Level</label>
                <select
                  className="form-select"
                  value={scheduleForm.year_level || ''}
                  onChange={e => setScheduleForm(f => ({ ...f, year_level: e.target.value }))}
                  required
                >
                  <option value="0">All Levels</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={scheduleForm.schedule_date}
                  onChange={e => setScheduleForm(f => ({ ...f, schedule_date: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={scheduleForm.start_time}
                    onChange={e => setScheduleForm(f => ({ ...f, start_time: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={scheduleForm.end_time}
                    onChange={e => setScheduleForm(f => ({ ...f, end_time: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loadingAction === 'save-schedule'}>
                  {loadingAction === 'save-schedule' ? 'Saving...' : editingSchedule ? 'Save Changes' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
