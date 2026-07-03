// src/pages/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E8F0', padding: '0 40px'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🧠</span>
            <span style={{ fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg,#4F46E5,#14B8A6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              NeuroMind
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '80px 40px', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: '#EEF2FF', color: '#4F46E5', padding: '6px 16px',
          borderRadius: '100px', fontSize: '13px', fontWeight: '600', marginBottom: '24px'
        }}>
          🧠 ADHD Cognitive Assessment Platform
        </div>
        <h1 style={{ fontSize: '52px', fontWeight: '900', lineHeight: 1.15, color: '#0F172A', marginBottom: '20px' }}>
          Understand Your<br />
          <span style={{ background: 'linear-gradient(135deg,#4F46E5,#14B8A6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Cognitive Profile
          </span>
        </h1>
        <p style={{ fontSize: '18px', color: '#64748B', marginBottom: '36px', maxWidth: '600px', margin: '0 auto 36px', lineHeight: '1.7' }}>
          NeuroMind provides clinically-inspired assessments to help identify ADHD-related cognitive patterns through 9 interactive tests.
        </p>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-primary btn-lg">Start Free Assessment →</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
        </div>
      </section>

      {/* Tests grid */}
      <section style={{ padding: '60px 40px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>9 Assessment Tests</h2>
        <p style={{ textAlign: 'center', color: '#64748B', marginBottom: '40px' }}>
          Each test measures a different cognitive domain
        </p>
        <div className="grid grid-3" style={{ gap: '16px' }}>
          {[
            ['📖', 'Story Comprehension', 'Reading focus & memory'],
            ['🧩', 'Memory Game', 'Working memory span'],
            ['🔷', 'Pattern Recognition', 'Visual-logical thinking'],
            ['⚡', 'Reaction Time', 'Processing speed'],
            ['🚦', 'Go / No-Go', 'Impulse control'],
            ['🌈', 'Stroop Test', 'Cognitive flexibility'],
            ['🔢', 'Sequence Recall', 'Short-term memory'],
            ['🔍', 'Visual Search', 'Selective attention'],
            ['⏱️', 'CPT Test', 'Sustained attention'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>{icon}</div>
              <h3 style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>{title}</h3>
              <p style={{ color: '#64748B', fontSize: '13px' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Risk levels */}
      <section style={{ padding: '60px 40px', background: 'white' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Clear Risk Classification</h2>
          <p style={{ color: '#64748B', marginBottom: '40px' }}>Based on your combined assessment scores</p>
          <div className="grid grid-3" style={{ gap: '20px' }}>
            {[
              { label: 'Stable', range: '80–100', icon: '✅', bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', desc: 'Cognitive performance within normal range.' },
              { label: 'Average', range: '50–79', icon: '⚠️', bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', desc: 'Some attention difficulties detected.' },
              { label: 'High Risk', range: '0–49', icon: '🚨', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', desc: 'Significant markers detected. Psychiatrist contact provided.' },
            ].map(r => (
              <div key={r.label} className="card" style={{ background: r.bg, borderColor: r.border }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>{r.icon}</div>
                <h3 style={{ fontWeight: '800', color: r.color, fontSize: '20px', marginBottom: '4px' }}>{r.label}</h3>
                <p style={{ fontWeight: '700', color: r.color, marginBottom: '8px' }}>Score: {r.range}</p>
                <p style={{ color: '#64748B', fontSize: '14px' }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '16px' }}>Ready to begin?</h2>
        <p style={{ color: '#64748B', fontSize: '18px', marginBottom: '32px' }}>Create a free account and complete your cognitive assessment today.</p>
        <Link to="/register" className="btn btn-primary btn-lg">Create Free Account →</Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #E2E8F0', padding: '24px 40px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
        <p>🧠 NeuroMind — ADHD Assessment Platform © 2024 | For educational purposes only. Not a medical diagnosis tool.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
