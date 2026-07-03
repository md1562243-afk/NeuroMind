// src/pages/AssessmentsPage.js
// Overview of all available assessments

import React from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';

const ASSESSMENTS = [
  {
    path: '/assessments/story',
    icon: '📖',
    title: 'Story Comprehension',
    description: 'Read a story and answer 5 comprehension questions. Tests reading focus and memory.',
    duration: '5–8 min',
    difficulty: 'Easy',
    color: '#4F46E5'
  },
  {
    path: '/assessments/memory',
    icon: '🧩',
    title: 'Memory Game',
    description: 'Match pairs of cards across 5 levels. Tests working memory and concentration.',
    duration: '3–7 min',
    difficulty: 'Medium',
    color: '#14B8A6'
  },
  {
    path: '/assessments/pattern',
    icon: '🔷',
    title: 'Pattern Recognition',
    description: 'Identify what comes next in visual and numeric sequences.',
    duration: '3–5 min',
    difficulty: 'Medium',
    color: '#6366F1'
  },
  {
    path: '/assessments/reaction',
    icon: '⚡',
    title: 'Reaction Time Test',
    description: 'Click as fast as possible when the target appears. 7 rounds.',
    duration: '2–3 min',
    difficulty: 'Easy',
    color: '#F59E0B'
  },
  {
    path: '/assessments/gonogo',
    icon: '🚦',
    title: 'Go / No-Go Test',
    description: 'Respond to green, ignore red. Tests impulse control and inhibition.',
    duration: '3–4 min',
    difficulty: 'Medium',
    color: '#22C55E'
  },
  {
    path: '/assessments/stroop',
    icon: '🌈',
    title: 'Stroop Test',
    description: 'Name the ink color of color words, not the word itself. Classic attention test.',
    duration: '3–5 min',
    difficulty: 'Hard',
    color: '#EC4899'
  },
  {
    path: '/assessments/sequence',
    icon: '🔢',
    title: 'Sequence Recall',
    description: 'Remember and repeat growing button sequences. Tests working memory span.',
    duration: '3–6 min',
    difficulty: 'Hard',
    color: '#8B5CF6'
  },
  {
    path: '/assessments/visual-search',
    icon: '🔍',
    title: 'Visual Search Test',
    description: 'Find a target symbol in a grid of distractors. Tests selective attention.',
    duration: '3–5 min',
    difficulty: 'Medium',
    color: '#0EA5E9'
  },
  {
    path: '/assessments/cpt',
    icon: '⏱️',
    title: 'Continuous Performance Test',
    description: 'Press only when you see the target letter X for 60 seconds. Tests sustained attention.',
    duration: '1 min',
    difficulty: 'Hard',
    color: '#EF4444'
  }
];

const difficultyColor = (d) => d === 'Easy' ? '#22C55E' : d === 'Medium' ? '#F59E0B' : '#EF4444';
const difficultyBg = (d) => d === 'Easy' ? '#F0FDF4' : d === 'Medium' ? '#FFFBEB' : '#FEF2F2';

const AssessmentsPage = () => {
  return (
    <AppLayout>
      <div>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>
            Assessments
          </h1>
          <p style={{ color: '#64748B' }}>
            Complete all 9 tests to generate your comprehensive ADHD assessment report.
          </p>
        </div>

        {/* Progress banner */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #4F46E5, #14B8A6)',
          color: 'white', marginBottom: '28px', border: 'none'
        }}>
          <h3 style={{ fontWeight: '700', marginBottom: '4px' }}>🎯 How it works</h3>
          <p style={{ opacity: 0.85, fontSize: '14px', marginBottom: '12px' }}>
            Complete the assessments below. After finishing, go to the Dashboard and click "Generate ADHD Report" 
            to calculate your final score and risk level.
          </p>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: '600' }}>
              ✅ Stable: 80–100
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: '600' }}>
              ⚠️ Average: 50–79
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: '600' }}>
              🚨 High Risk: 0–49
            </div>
          </div>
        </div>

        {/* Assessment grid */}
        <div className="grid grid-3" style={{ gap: '16px' }}>
          {ASSESSMENTS.map(a => (
            <Link key={a.path} to={a.path} style={{ textDecoration: 'none' }}>
              <div
                className="card card-hover"
                style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{
                  width: '52px', height: '52px',
                  background: `${a.color}18`,
                  borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '26px'
                }}>
                  {a.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px', color: '#0F172A' }}>
                    {a.title}
                  </h3>
                  <p style={{ color: '#64748B', fontSize: '13px', lineHeight: '1.5' }}>
                    {a.description}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{
                    background: '#F1F5F9', color: '#64748B',
                    padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '600'
                  }}>⏱ {a.duration}</span>
                  <span style={{
                    background: difficultyBg(a.difficulty), color: difficultyColor(a.difficulty),
                    padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '600'
                  }}>{a.difficulty}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default AssessmentsPage;
