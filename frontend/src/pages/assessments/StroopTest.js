// src/pages/assessments/StroopTest.js
// Name the COLOR of the word, not the word itself

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../utils/api';

const COLORS = [
  { name: 'RED', hex: '#EF4444' },
  { name: 'BLUE', hex: '#3B82F6' },
  { name: 'GREEN', hex: '#22C55E' },
  { name: 'YELLOW', hex: '#EAB308' },
  { name: 'PURPLE', hex: '#A855F7' },
];

const TOTAL = 20;

const generateItem = () => {
  const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  let inkColor;
  do { inkColor = COLORS[Math.floor(Math.random() * COLORS.length)]; }
  while (inkColor.name === wordColor.name);
  return { word: wordColor.name, inkColor };
};

const StroopTest = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('intro');
  const [items] = useState(() => Array.from({ length: TOTAL }, generateItem));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [responseTimes, setResponseTimes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [startTime] = useState(Date.now());
  const [itemStart, setItemStart] = useState(null);
  const [shuffledOptions, setShuffledOptions] = useState([]);

  useEffect(() => {
    if (phase === 'playing') {
      setItemStart(Date.now());
      setSelected(null);
      setShuffledOptions([...COLORS].sort(() => Math.random() - 0.5));
    }
  }, [currentIdx, phase]);

  const handleAnswer = async (colorName) => {
    if (selected) return;
    const rt = Date.now() - itemStart;
    setSelected(colorName);
    const isCorrect = colorName === items[currentIdx].inkColor.name;
    if (isCorrect) setCorrect(c => c + 1);
    setResponseTimes(r => [...r, rt]);

    setTimeout(async () => {
      if (currentIdx + 1 >= TOTAL) {
        setPhase('done');
        const avgRT = Math.round(responseTimes.concat(rt).reduce((a, b) => a + b, 0) / TOTAL);
        const finalCorrect = isCorrect ? correct + 1 : correct;
        // Score based on accuracy only (no time penalty)
        const clampedScore = Math.min(100, Math.max(0, Math.round((finalCorrect / TOTAL) * 100)));
        try {
          await api.post('/assessments/stroop-test', {
            correct_answers: finalCorrect,
            total_questions: TOTAL,
            avg_response_time: avgRT,
            score: clampedScore,
            completion_time: Math.round((Date.now() - startTime) / 1000)
          });
        } catch (e) { console.error(e); }
      } else {
        setCurrentIdx(i => i + 1);
      }
    }, 600);
  };

  if (phase === 'done') {
    const avgRT = responseTimes.length > 0 ? Math.round(responseTimes.reduce((a,b)=>a+b,0)/responseTimes.length) : 0;
    const score = Math.min(100, Math.max(0, Math.round((correct/TOTAL)*100)));
    return (
      <AppLayout>
        <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg,#4F46E5,#14B8A6)', color: 'white', padding: '40px', border: 'none', marginBottom: '16px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌈</div>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Stroop Test Complete!</h2>
            <div style={{ fontSize: '64px', fontWeight: '900' }}>{score}</div>
            <p style={{ opacity: 0.8 }}>{correct}/{TOTAL} correct • Avg {avgRT}ms</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/assessments')} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ flex: 1 }}>Dashboard</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (phase === 'intro') {
    return (
      <AppLayout>
        <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
          <div className="card" style={{ padding: '48px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌈</div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '12px' }}>Stroop Test</h1>
            <p style={{ color: '#64748B', marginBottom: '16px' }}>
              You'll see a color word written in a different ink color.
            </p>
            <div className="card" style={{ background: '#F8FAFC', marginBottom: '16px', padding: '20px' }}>
              <p style={{ fontSize: '36px', fontWeight: '900', color: '#22C55E', marginBottom: '8px' }}>RED</p>
              <p style={{ color: '#64748B', fontSize: '14px' }}>
                Click <strong>GREEN</strong> (the ink color), NOT "red" (the word)
              </p>
            </div>
            <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '14px' }}>{TOTAL} items. Be fast and accurate!</p>
            <button onClick={() => setPhase('playing')} className="btn btn-primary btn-lg btn-full">Start Test 🌈</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const item = items[currentIdx];
  return (
    <AppLayout>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#64748B' }}>{currentIdx + 1}/{TOTAL}</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#22C55E' }}>✅ {correct}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(currentIdx / TOTAL) * 100}%` }} />
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', marginBottom: '20px', padding: '48px' }}>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px', fontWeight: '600' }}>
            What COLOR is this word written in?
          </p>
          <p style={{
            fontSize: '72px', fontWeight: '900', lineHeight: 1,
            color: item.inkColor.hex,
            letterSpacing: '2px'
          }}>
            {item.word}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {shuffledOptions.map(color => {
            let border = '2px solid #E2E8F0';
            let bg = 'white';
            if (selected) {
              if (color.name === item.inkColor.name) { border = '2px solid #22C55E'; bg = '#F0FDF4'; }
              else if (color.name === selected) { border = '2px solid #EF4444'; bg = '#FEF2F2'; }
            }
            return (
              <button
                key={color.name}
                onClick={() => handleAnswer(color.name)}
                disabled={!!selected}
                style={{
                  padding: '18px', border, borderRadius: '12px', background: bg,
                  cursor: selected ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  fontFamily: 'inherit', transition: 'all 0.2s'
                }}
              >
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: color.hex, flexShrink: 0 }} />
                <span style={{ fontWeight: '700', fontSize: '15px', color: '#0F172A' }}>{color.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default StroopTest;
