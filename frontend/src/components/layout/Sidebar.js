// src/components/layout/Sidebar.js
// Left sidebar navigation for authenticated users

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Navigation items
const NAV_ITEMS = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/assessments', icon: '🧪', label: 'Assessments' },
  { path: '/assessments/story', icon: '📖', label: 'Story Test' },
  { path: '/assessments/memory', icon: '🧩', label: 'Memory Game' },
  { path: '/assessments/pattern', icon: '🔷', label: 'Pattern Test' },
  { path: '/assessments/reaction', icon: '⚡', label: 'Reaction Test' },
  { path: '/assessments/gonogo', icon: '🚦', label: 'Go/No-Go Test' },
  { path: '/assessments/stroop', icon: '🌈', label: 'Stroop Test' },
  { path: '/assessments/sequence', icon: '🔢', label: 'Sequence Recall' },
  { path: '/assessments/visual-search', icon: '🔍', label: 'Visual Search' },
  { path: '/assessments/cpt', icon: '⏱️', label: 'CPT Test' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

const Sidebar = ({ mobile = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: '260px',
      minHeight: '100vh',
      background: '#FFFFFF',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0,
      overflowY: 'auto',
      zIndex: 100
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #4F46E5, #14B8A6)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px'
          }}>🧠</div>
          <span style={{
            fontSize: '18px', fontWeight: '800',
            background: 'linear-gradient(135deg, #4F46E5, #14B8A6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>NeuroMind</span>
        </Link>
        {mobile && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        )}
      </div>

      {/* User info */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(135deg, #EEF2FF, #F0FDFA)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'linear-gradient(135deg, #4F46E5, #14B8A6)',
            borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '700', fontSize: '16px'
          }}>
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p style={{ fontWeight: '600', fontSize: '14px', color: '#0F172A', marginBottom: '2px' }}>
              {user?.full_name || 'User'}
            </p>
            <p style={{ fontSize: '12px', color: '#64748B' }}>{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '12px 12px', flex: 1 }}>
        {/* Dashboard & Assessments header */}
        <p style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', padding: '8px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Main
        </p>
        {NAV_ITEMS.slice(0, 2).map(item => (
          <NavLink key={item.path} item={item} currentPath={location.pathname} />
        ))}

        <p style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', padding: '16px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Tests
        </p>
        {NAV_ITEMS.slice(2, -1).map(item => (
          <NavLink key={item.path} item={item} currentPath={location.pathname} />
        ))}

        <p style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', padding: '16px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Account
        </p>
        {NAV_ITEMS.slice(-1).map(item => (
          <NavLink key={item.path} item={item} currentPath={location.pathname} />
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '10px 12px',
            background: 'var(--high-risk-bg)',
            color: 'var(--high-risk)',
            border: '1px solid #FECACA',
            borderRadius: '10px', cursor: 'pointer',
            fontSize: '14px', fontWeight: '600',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
};

// Individual nav link component
const NavLink = ({ item, currentPath }) => {
  const isActive = currentPath === item.path;

  return (
    <Link
      to={item.path}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 12px', borderRadius: '10px',
        textDecoration: 'none', marginBottom: '2px',
        background: isActive ? 'linear-gradient(135deg, #EEF2FF, #F0FDFA)' : 'transparent',
        color: isActive ? '#4F46E5' : '#64748B',
        fontWeight: isActive ? '600' : '400',
        fontSize: '14px',
        transition: 'all 0.15s ease',
        borderLeft: isActive ? '3px solid #4F46E5' : '3px solid transparent'
      }}
    >
      <span style={{ fontSize: '16px' }}>{item.icon}</span>
      {item.label}
    </Link>
  );
};

export default Sidebar;
