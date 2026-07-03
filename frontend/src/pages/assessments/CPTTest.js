// src/pages/assessments/CPTTest.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../utils/api';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const TARGET = 'X';
const DURATION = 60;
const INTERVAL = 1200;

const CPTTest = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('intro');
  const [currentLetter, setCurrentLetter] = useState('');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [pressed, setPressed] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [finalStats, setFinalStats] = useState(null);
  const [finalScore, setFinalScore] = useState(0);

  // Refs to avoid stale closure bugs
  const statsRef = useRef({ hits: 0, misses: 0, false_alarms: 0, total_shown: 0 });
  const letterRef = useRef('');
  const pressedRef = useRef(false);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);
  const phaseRef = useRef('intro');
  const startTime = useRef(null);

  const showNextLetter = () => {
    if (phaseRef.current === 'done') return;
    const isTarget = Math.random() < 0.25;
    const letter = isTarget
      ? TARGET
      : LETTERS.filter(l => l !== TARGET)[Math.floor(Math.random() * (LETTERS.length - 1))];

    pressedRef.current = false;
    setPressed(false);
    setFeedback('');
    setCurrentLetter(letter);
    letterRef.current = letter;
    statsRef.current.total_shown += 1;

    // Check for miss after interval
    setTimeout(() => {
      if (phaseRef.current === 'done') return;
      if (letterRef.current === TARGET && !pressedRef.current) {
        statsRef.current.misses += 1;
        setFeedback('miss');
      }
    }, INTERVAL - 100);
  };

  const handlePress = () => {
    if (phaseRef.current !== 'playing') return;
    if (pressedRef.current) return;
    pressedRef.current = true;
    setPressed(true);

    if (letterRef.current === TARGET) {
      statsRef.current.hits += 1;
      setFeedback('hit');
    } else {
      statsRef.current.false_alarms += 1;
      setFeedback('false_alarm');
    }
  };

  const finishTest = async () => {
    if (phaseRef.current === 'done') return;
    phaseRef.current = 'done';
    setPhase('done');
    clearInterval(intervalRef.current);
    clearInterval(timerRef.current);
    setCurrentLetter('');

    const s = statsRef.current;
    const totalTargets = s.hits + s.misses;
    const hitRate = totalTargets > 0 ? (s.hits / totalTargets) * 100 : 0;
    // Score = hit rate minus penalty for false alarms
    const raw = hitRate - (s.false_alarms * 5);
    const score = Math.min(100, Math.max(0, Math.round(raw)));

    setFinalStats({ ...s });
    setFinalScore(score);

    try {
      await api.post('/assessments/continuous-performance-test', {
        hits: s.hits,
        misses: s.misses,
        false_alarms: s.false_alarms,
        hit_rate: Math.round(hitRate),
        score,
        completion_time: DURATION
      });
    } catch (e) { console.error(e); }
  };

  const startTest = () => {
    phaseRef.current = 'playing';
    statsRef.current = { hits: 0, misses: 0, false_alarms: 0, total_shown: 0 };
    startTime.current = Date.now();
    setPhase('playing');
    setTimeLeft(DURATION);

    intervalRef.current = setInterval(showNextLetter, INTERVAL);

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          finishTest();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => () => {
    clearInterval(intervalRef.current);
    clearInterval(timerRef.current);
  }, []);

  if (phase === 'done' && finalStats) {
    const totalTargets = finalStats.hits + finalStats.misses;
    const hitRate = totalTargets > 0 ? Math.round((finalStats.hits / totalTargets) * 100) : 0;
    return (
      <AppLayout>
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg,#4F46E5,#14B8A6)', color: 'white', padding: '40px', border: 'none', marginBottom: '16px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏱️</div>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>CPT Complete!</h2>
            <div style={{ fontSize: '64px', fontWeight: '900' }}>{finalScore}</div>
            <p style={{ opacity: 0.8 }}>Score / 100</p>
            <p style={{ opacity: 0.7, fontSize: '14px', marginTop: '4px' }}>Hit Rate: {hitRate}%</p>
          </div>
          <div className="card" style={{ marginBottom: '16px', textAlign: 'left' }}>
            {[
              ['✅ Hits (correct X press)', finalStats.hits],
              ['❌ Misses (missed X)', finalStats.misses],
              ['⚠️ False Alarms (pressed wrong)', finalStats.false_alarms],
              ['📊 Hit Rate', `${hitRate}%`]
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B', fontSize: '14px' }}>{label}</span>
                <span style={{ fontWeight: '700' }}>{val}</span>
              </div>
            ))}
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
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏱️</div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '12px' }}>Continuous Performance Test</h1>
            <div className="card" style={{ background: '#F8FAFC', marginBottom: '20px', padding: '20px' }}>
              <p style={{ fontSize: '48px', fontWeight: '900', color: '#4F46E5', marginBottom: '8px' }}>X</p>
              <p style={{ color: '#64748B', fontSize: '14px' }}>
                Press <strong>ONLY</strong> when you see the letter <strong style={{ color: '#4F46E5' }}>X</strong>. Ignore all other letters!
              </p>
            </div>
            <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '14px' }}>{DURATION} seconds • Stay focused!</p>
            <button onClick={startTest} className="btn btn-primary btn-lg btn-full">Start Test ⏱️</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const bgColor = feedback === 'hit' ? '#22C55E' : feedback === 'false_alarm' ? '#EF4444' : feedback === 'miss' ? '#F59E0B' : '#1E293B';

  return (
    <AppLayout>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: '700' }}>
              <span style={{ color: '#22C55E' }}>✅ {statsRef.current.hits}</span>
              <span style={{ color: '#EF4444' }}>⚠️ {statsRef.current.false_alarms}</span>
              <span style={{ color: '#F59E0B' }}>💨 {statsRef.current.misses}</span>
            </div>
            <span style={{ fontWeight: '700', color: timeLeft <= 10 ? '#EF4444' : '#4F46E5', fontSize: '16px' }}>⏱ {timeLeft}s</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((DURATION - timeLeft) / DURATION) * 100}%` }} />
          </div>
        </div>

        <div onClick={handlePress} style={{
          height: '320px', borderRadius: '20px', background: bgColor,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'background 0.1s ease', userSelect: 'none', marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '120px', fontWeight: '900', lineHeight: 1,
            color: currentLetter === TARGET ? '#fff' : 'rgba(255,255,255,0.7)',
            textShadow: currentLetter === TARGET ? '0 0 30px rgba(255,255,255,0.5)' : 'none'
          }}>
            {currentLetter || '·'}
          </div>
          {feedback && (
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', fontWeight: '700', marginTop: '8px' }}>
              {feedback === 'hit' ? '✅ Correct!' : feedback === 'false_alarm' ? '❌ Wrong letter!' : feedback === 'miss' ? '💨 Missed X!' : ''}
            </p>
          )}
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '10px' }}>
            Press when you see <strong style={{ color: '#4F46E5', fontSize: '20px' }}>X</strong>
          </p>
          <button onClick={handlePress} style={{
            padding: '16px 48px',
            background: pressed ? '#E2E8F0' : 'linear-gradient(135deg,#4F46E5,#14B8A6)',
            color: pressed ? '#64748B' : 'white', border: 'none', borderRadius: '12px',
            fontSize: '18px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit'
          }}>
            {pressed ? '✓ Pressed' : 'PRESS'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default CPTTest;
