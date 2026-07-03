// src/components/layout/AppLayout.js
// Main layout with sidebar for authenticated pages

import React from 'react';
import Sidebar from './Sidebar';

const AppLayout = ({ children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main content area (offset by sidebar width) */}
      <main style={{
        marginLeft: '260px',
        flex: 1,
        padding: '28px',
        minHeight: '100vh'
      }}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
