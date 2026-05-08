'use client';

import { useState } from 'react';
import Link from 'next/link';
import InteractiveParticles from '@/components/InteractiveParticles';

export default function HomePage() {
  // null = role selection, 'student' = student options, 'admin' = admin options
  const [role, setRole] = useState(null);

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .home-hero { padding-top: 48px !important; padding-bottom: 48px !important; }
          .home-hero-logo { height: 80px !important; }
          .home-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .home-grid-card { padding: 20px 16px !important; }
          .home-grid-card h3 { font-size: 1rem !important; }
          .home-grid-icon { height: 40px !important; }
        }
      `}</style>
      <section
        className="page-header home-hero"
        style={{
          paddingTop: '80px',
          paddingBottom: '80px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <InteractiveParticles />
        <div
          className="container"
          style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <img src="/soc2.png" alt="SOC Logo" className="home-hero-logo" style={{ height: '120px', width: 'auto' }} />
          </div>
          <h1 style={{ marginBottom: '8px' }}>
            <span>
              <span className="hau-text">HAU</span> Enrollment Queuing System
            </span>
          </h1>
          <p style={{ fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
            Holy Angel University · School of Computing
            <br />
            Digital enrollment queue management
          </p>
        </div>
      </section>

      <div className="container" style={{ marginTop: '40px', paddingBottom: '60px' }}>
        <div className="guide-wrapper" style={{ maxWidth: '640px', margin: '0 auto' }}>

          {/* ===== Step 1: Role Selection ===== */}
          {role === null && (
            <div className="guide-step" style={{ animation: 'slideUp 0.35s ease' }}>
              <div
                className="card"
                style={{ textAlign: 'center', padding: '40px 32px' }}
              >
                <h2
                  style={{
                    fontSize: '1.375rem',
                    fontWeight: 700,
                    color: 'var(--gray-900)',
                    marginBottom: '8px',
                  }}
                >
                  Welcome! How can we help you?
                </h2>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    color: 'var(--gray-500)',
                    marginBottom: '32px',
                  }}
                >
                  Select your role to get started.
                </p>

                <div
                  className="home-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                  }}
                >
                  {/* Student button */}
                  <button
                    id="role-student"
                    className="card"
                    onClick={() => setRole('student')}
                    style={{
                      cursor: 'pointer',
                      border: '2px solid var(--gray-200)',
                      padding: '28px 16px',
                      transition: 'all 0.2s ease',
                      background: 'white',
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
                    <div style={{ marginBottom: '12px' }}>
                      <img
                        src="/register-icon.svg"
                        alt="Student"
                        style={{ height: '48px', width: 'auto' }}
                      />
                    </div>
                    <h3
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: 'var(--gray-900)',
                        marginBottom: '4px',
                      }}
                    >
                      I'm a Student
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                      Register or track your queue
                    </p>
                  </button>

                  {/* Admin button */}
                  <button
                    id="role-admin"
                    className="card"
                    onClick={() => setRole('admin')}
                    style={{
                      cursor: 'pointer',
                      border: '2px solid var(--gray-200)',
                      padding: '28px 16px',
                      transition: 'all 0.2s ease',
                      background: 'white',
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
                    <div style={{ marginBottom: '12px' }}>
                      <img
                        src="/admin-icon.svg"
                        alt="Admin"
                        style={{ height: '48px', width: 'auto' }}
                      />
                    </div>
                    <h3
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: 'var(--gray-900)',
                        marginBottom: '4px',
                      }}
                    >
                      I'm an Admin
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                      Manage queues & dashboard
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== Step 2a: Student Options ===== */}
          {role === 'student' && (
            <div className="guide-step" style={{ animation: 'slideUp 0.35s ease' }}>
              <div
                className="card"
                style={{ textAlign: 'center', padding: '40px 32px' }}
              >
                <h2
                  style={{
                    fontSize: '1.375rem',
                    fontWeight: 700,
                    color: 'var(--gray-900)',
                    marginBottom: '8px',
                  }}
                >
                  What would you like to do?
                </h2>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    color: 'var(--gray-500)',
                    marginBottom: '32px',
                  }}
                >
                  Choose an option below.
                </p>

                <div
                  className="home-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                  }}
                >
                  {/* Register */}
                  <Link href="/register" id="option-register" style={{ textDecoration: 'none' }}>
                    <div
                      className="card"
                      style={{
                        cursor: 'pointer',
                        border: '2px solid var(--gray-200)',
                        padding: '28px 16px',
                        transition: 'all 0.2s ease',
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
                      <div style={{ marginBottom: '12px' }}>
                        <img
                          src="/register-icon.svg"
                          alt="Register"
                          style={{ height: '48px', width: 'auto' }}
                        />
                      </div>
                      <h3
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: 'var(--gray-900)',
                          marginBottom: '4px',
                        }}
                      >
                        Register
                      </h3>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                        Enter the enrollment queue
                      </p>
                    </div>
                  </Link>

                  {/* Find Queue */}
                  <Link href="/track" id="option-track" style={{ textDecoration: 'none' }}>
                    <div
                      className="card"
                      style={{
                        cursor: 'pointer',
                        border: '2px solid var(--gray-200)',
                        padding: '28px 16px',
                        transition: 'all 0.2s ease',
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
                      <div style={{ marginBottom: '12px' }}>
                        <img
                          src="/findqueue-icon.svg"
                          alt="Find Queue"
                          style={{ height: '48px', width: 'auto' }}
                        />
                      </div>
                      <h3
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: 'var(--gray-900)',
                          marginBottom: '4px',
                        }}
                      >
                        Find My Queue
                      </h3>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                        Track your real-time status
                      </p>
                    </div>
                  </Link>
                </div>

                <button
                  onClick={() => setRole(null)}
                  className="btn btn-secondary"
                  style={{ marginTop: '24px' }}
                >
                  ← Back
                </button>
              </div>
            </div>
          )}

          {/* ===== Step 2b: Admin Options ===== */}
          {role === 'admin' && (
            <div className="guide-step" style={{ animation: 'slideUp 0.35s ease' }}>
              <div
                className="card"
                style={{ textAlign: 'center', padding: '40px 32px' }}
              >
                <h2
                  style={{
                    fontSize: '1.375rem',
                    fontWeight: 700,
                    color: 'var(--gray-900)',
                    marginBottom: '8px',
                  }}
                >
                  Admin Options
                </h2>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    color: 'var(--gray-500)',
                    marginBottom: '32px',
                  }}
                >
                  Choose what you'd like to access.
                </p>

                <div
                  className="home-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                  }}
                >
                  {/* Queue Board */}
                  <Link href="/queue" id="option-queue" style={{ textDecoration: 'none' }}>
                    <div
                      className="card"
                      style={{
                        cursor: 'pointer',
                        border: '2px solid var(--gray-200)',
                        padding: '28px 16px',
                        transition: 'all 0.2s ease',
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
                      <div style={{ marginBottom: '12px' }}>
                        <img
                          src="/queueboard-icon.svg"
                          alt="Queue Board"
                          style={{ height: '48px', width: 'auto' }}
                        />
                      </div>
                      <h3
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: 'var(--gray-900)',
                          marginBottom: '4px',
                        }}
                      >
                        Display Queue
                      </h3>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                        View all active queues
                      </p>
                    </div>
                  </Link>

                  {/* Admin Dashboard (goes to login) */}
                  <Link href="/admin" id="option-admin" style={{ textDecoration: 'none' }}>
                    <div
                      className="card"
                      style={{
                        cursor: 'pointer',
                        border: '2px solid var(--gray-200)',
                        padding: '28px 16px',
                        transition: 'all 0.2s ease',
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
                      <div style={{ marginBottom: '12px' }}>
                        <img
                          src="/admin-icon.svg"
                          alt="Admin Dashboard"
                          style={{ height: '48px', width: 'auto' }}
                        />
                      </div>
                      <h3
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: 'var(--gray-900)',
                          marginBottom: '4px',
                        }}
                      >
                        Admin Dashboard
                      </h3>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                        Login to manage queues
                      </p>
                    </div>
                  </Link>
                </div>

                <button
                  onClick={() => setRole(null)}
                  className="btn btn-secondary"
                  style={{ marginTop: '24px' }}
                >
                  ← Back
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
