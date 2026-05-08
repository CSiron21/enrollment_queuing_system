'use client';

import { useState } from 'react';

const developers = [
  {
    name: 'Clark Siron',
    role: 'Lead Dev, Fullstack Dev',
    github: 'https://github.com/CSiron21',
  },
  {
    name: 'Carlo Siron',
    role: 'Frontend Dev',
    github: 'https://github.com/CSiron21',
  },
  {
    name: 'Jasper Andrew Chan',
    role: 'Frontend Dev',
    github: 'https://github.com/Jasper-Andrew-L-Chan',
  },
];

export default function DevCredits() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        className="dev-credits-btn"
        onClick={() => setOpen(true)}
        aria-label="Developer Credits"
        title="Developer Credits"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 18l2-2-2-2" />
          <path d="M8 18l-2-2 2-2" />
          <path d="M14.5 4l-5 16" />
        </svg>
      </button>

      {/* Modal Overlay */}
      {open && (
        <div className="dev-credits-overlay" onClick={() => setOpen(false)}>
          <div className="dev-credits-modal" onClick={(e) => e.stopPropagation()}>
            <button className="dev-credits-close" onClick={() => setOpen(false)} aria-label="Close">
              ✕
            </button>
            <h3 className="dev-credits-title">Meet the Developers</h3>
            <p className="dev-credits-subtitle">Designed & Developed by:</p>
            <ul className="dev-credits-list">
              {developers.map((dev) => (
                <li key={dev.name} className="dev-credits-card">
                  <div className="dev-credits-avatar">
                    {dev.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="dev-credits-info">
                    <span className="dev-credits-name">{dev.name}</span>
                    <span className="dev-credits-role">{dev.role}</span>
                  </div>
                  <a
                    href={dev.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dev-credits-gh"
                    aria-label={`${dev.name} GitHub`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
