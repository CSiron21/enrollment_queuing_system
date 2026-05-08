'use client';

import Link from 'next/link';

const menuItems = [
  { href: '/admin/dashboard/queues', emoji: '📋', title: 'Queues', desc: 'Manage Students' },
  { href: '/admin/dashboard/schedules', emoji: '📅', title: 'Schedules', desc: 'Handle Enrollment Schedules' },
  { href: '/admin/dashboard/courses', emoji: '📚', title: 'Courses', desc: 'Add/Remove Courses' },
  { href: '/admin/dashboard/admins', emoji: '👥', title: 'Admins', desc: 'Access Control' },
];

export default function DashboardMenuPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 0 60px' }}>
      <div style={{ animation: 'slideUp 0.35s ease' }}>
        <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '8px' }}>
            Welcome back! What would you like to manage?
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--gray-500)', marginBottom: '32px' }}>
            Select an option below to get started.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {menuItems.map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div
                  className="card"
                  style={{
                    cursor: 'pointer',
                    border: '2px solid var(--gray-200)',
                    padding: '28px 16px',
                    transition: 'all 0.2s ease',
                    background: 'white',
                    height: '100%',
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
                  <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{item.emoji}</div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '4px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
