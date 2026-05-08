'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAdminContext } from '@/components/AdminShell';

export default function CoursesPage() {
  const { authFetch, showToast } = useAdminContext();

  const [courses, setCourses] = useState([]);
  const [loadingAction, setLoadingAction] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ code: '', name: '' });

  // Fetch
  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) setCourses(data);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Handlers
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setLoadingAction('save-course');
    try {
      const res = await authFetch('/api/courses', {
        method: 'POST',
        body: JSON.stringify(courseForm)
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }

      const savedCourse = await res.json();
      setCourses(prev => [...prev, savedCourse]);

      showToast('Course created');
      setShowCourseModal(false);
      setCourseForm({ code: '', name: '' });
    } catch (err) {
      showToast(err.message || 'Failed to save course', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm('Delete this course?')) return;
    setLoadingAction(`delete-c-${id}`);
    try {
      const res = await authFetch(`/api/courses/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setCourses(prev => prev.filter(c => c.id !== id));
      showToast('Course deleted');
    } catch (err) {
      showToast(err.message || 'Failed to delete course', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  if (initialLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading courses...</p>
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
          <h3 className="card-title">📚 Courses / Programs</h3>
          <button className="btn btn-primary" onClick={() => {
            setCourseForm({ code: '', name: '' });
            setShowCourseModal(true);
          }}>
            + Add Course
          </button>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', color: '#9ca3af', padding: '24px' }}>
                    No courses added yet
                  </td>
                </tr>
              ) : (
                courses.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>{c.code}</td>
                    <td>{c.name}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteCourse(c.id)}
                        disabled={loadingAction === `delete-c-${c.id}`}
                      >
                        {loadingAction === `delete-c-${c.id}` ? '...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== COURSE MODAL ===== */}
      {showCourseModal && (
        <div className="modal-overlay" onClick={() => setShowCourseModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Add Course</h2>
            <form onSubmit={handleSaveCourse}>
              <div className="form-group">
                <label className="form-label">Course Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. BSCS"
                  value={courseForm.code}
                  onChange={e => setCourseForm(f => ({ ...f, code: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Course Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. BS Computer Science"
                  value={courseForm.name}
                  onChange={e => setCourseForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCourseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loadingAction === 'save-course'}>
                  {loadingAction === 'save-course' ? 'Saving...' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
