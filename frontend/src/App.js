// src/App.js
// Main application with React Router setup

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AssessmentsPage from './pages/AssessmentsPage';
import ProfilePage from './pages/ProfilePage';

// Assessment games
import StoryTest from './pages/assessments/StoryTest';
import MemoryGame from './pages/assessments/MemoryGame';
import PatternTest from './pages/assessments/PatternTest';
import ReactionTest from './pages/assessments/ReactionTest';
import GoNoGoTest from './pages/assessments/GoNoGoTest';
import StroopTest from './pages/assessments/StroopTest';
import SequenceTest from './pages/assessments/SequenceTest';
import VisualSearchTest from './pages/assessments/VisualSearchTest';
import CPTTest from './pages/assessments/CPTTest';

import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes — require login */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/assessments" element={
            <ProtectedRoute><AssessmentsPage /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />

          {/* Assessment routes */}
          <Route path="/assessments/story" element={
            <ProtectedRoute><StoryTest /></ProtectedRoute>
          } />
          <Route path="/assessments/memory" element={
            <ProtectedRoute><MemoryGame /></ProtectedRoute>
          } />
          <Route path="/assessments/pattern" element={
            <ProtectedRoute><PatternTest /></ProtectedRoute>
          } />
          <Route path="/assessments/reaction" element={
            <ProtectedRoute><ReactionTest /></ProtectedRoute>
          } />
          <Route path="/assessments/gonogo" element={
            <ProtectedRoute><GoNoGoTest /></ProtectedRoute>
          } />
          <Route path="/assessments/stroop" element={
            <ProtectedRoute><StroopTest /></ProtectedRoute>
          } />
          <Route path="/assessments/sequence" element={
            <ProtectedRoute><SequenceTest /></ProtectedRoute>
          } />
          <Route path="/assessments/visual-search" element={
            <ProtectedRoute><VisualSearchTest /></ProtectedRoute>
          } />
          <Route path="/assessments/cpt" element={
            <ProtectedRoute><CPTTest /></ProtectedRoute>
          } />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
