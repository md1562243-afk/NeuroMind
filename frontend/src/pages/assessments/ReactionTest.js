// src/pages/assessments/ReactionTest.js
// Click as fast as possible when the green circle appears

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../utils/api';

const TOTAL_ROUNDS = 7;

const ReactionTest = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('intro'); // intro, waiting, ready, clicked, done
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [message, setMessage] = useState('');
  const [tooEarly, setTooEarly] = useState(false);
  const [saved, setSaved] = useState(false);
  const timeoutRef = useRef(null);

  const startWaiting = () => {
    setPhase('waiting');
    setTooEarly(false);
    setMessage('Wait for green...');
    // Random delay between 1.5 and 4 seconds
    const delay = 1500 + Math.random() * 2500;
    timeoutRef.current = setTimeout(() => {
      setPhase('ready');
      setStartTime(Date.now());
      setMessage('CLICK NOW!');
    }, delay);
  };

  const handleClick = () => {
    if (phase === 'intro') return;

    if (phase === 'waiting') {
      // Too early
      clearTimeout(timeoutRef.current);
      setTooEarly(true);
      setPhase('clicked');
      setMessage('Too early! Click to try again.');
      return;
    }

    if (phase === 'ready') {
      const reaction = Date.now() - startTime;
      const newTimes = [...times, reaction];
      setTimes(newTimes);
      setPhase('clicked');
      setMessage(`${reaction}ms — ${getReactionLabel(reaction)}`);

      if (newTimes.length >= TOTAL_ROUNDS) {
        setTimeout(() => finishTest(newTimes), 1000);
      }
    }

    if (phase === 'clicked') {
      if (round + 1 >= TOTAL_ROUNDS) {
        finishTest(times);
      } else {
        setRound(r => r + 1);
        startWaiting();
      }
    }
  };

  const getReactionLabel = (ms) => {
    if (ms < 200) return '⚡ Excellent!';
    if (ms < 300) return '✅ Good';
    if (ms < 500) return '👍 Average';
    return '🐢 Slow';
  };

  const calcScore = (reactionTimes) => {
    const avg = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    // Score out of 100: <200ms = 100, >700ms = 0
    return Math.max(0, Math.min(100, Math.round(((700 - avg) / 500) * 100)));
  };

  const finishTest = async (finalTimes) => {
    if (finalTimes.length === 0) return;
    setPhase('done');
    const avg = Math.round(finalTimes.reduce((a, b) => a + b, 0) / finalTimes.length);
    const score = calcScore(finalTimes);

    try {
      await api.post('/assessments/reaction-test', {
        avg_reaction_time: avg,
        score,
        total_attempts: finalTimes.length
      });
      setSaved(true);
    } catch (e) { console.error(e); }
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const validTimes = times.filter(t => t > 0);
  const avgTime = validTimes.length > 0
    ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
    : 0;
  const score = validTimes.length > 0 ? calcScore(validTimes) : 0;

  // DONE screen
  if (phase === 'done') {
    return (
      <AppLayout>
        <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
          <div className="card" style={{
            background: 'linear-gradient(135deg, #4F46E5, #14B8A6)',
            color: 'white', padding: '48px', border: 'none', marginBottom: '16px'
          }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>⚡</div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Reaction Test Complete!</h2>
            <div style={{ fontSize: '64px', fontWeight: '900', lineHeight: 1 }}>{score}</div>
            <p style={{ opacity: 0.8, marginTop: '4px' }}>Score / 100</p>
            <p style={{ opacity: 0.7, marginTop: '8px' }}>Average reaction: {avgTime}ms</p>
          </div>

          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '12px' }}>Your Reaction Times</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {validTimes.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px'
                }}>
                  <span style={{ color: '#64748B', fontSize: '14px' }}>Round {i + 1}</span>
                  <span style={{
                    fontWeight: '700',
                    color: t < 250 ? '#22C55E' : t < 400 ? '#F59E0B' : '#EF4444'
                  }}>{t}ms</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/assessments')} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ flex: 1 }}>Dashboard</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // INTRO screen
  if (phase === 'intro') {
    return (
      <AppLayout>
        <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
          <div className="card" style={{ padding: '48px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚡</div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px' }}>Reaction Time Test</h1>
            <p style={{ color: '#64748B', marginBottom: '8px' }}>
              A circle will appear on screen. Click it as fast as possible!
            </p>
            <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '14px' }}>
              {TOTAL_ROUNDS} rounds total. Don't click before it turns green.
            </p>
            <div className="card" style={{ background: '#F8FAFC', marginBottom: '24px', textAlign: 'left' }}>
              <p style={{ fontWeight: '700', marginBottom: '8px' }}>Score Guide:</p>
              <p style={{ fontSize: '14px', color: '#64748B' }}>⚡ &lt;200ms — Excellent</p>
              <p style={{ fontSize: '14px', color: '#64748B' }}>✅ 200–300ms — Good</p>
              <p style={{ fontSize: '14px', color: '#64748B' }}>👍 300–500ms — Average</p>
              <p style={{ fontSize: '14px', color: '#64748B' }}>🐢 &gt;500ms — Slow</p>
            </div>
            <button
              onClick={() => { startWaiting(); setPhase('waiting'); }}
              className="btn btn-primary btn-lg btn-full"
            >
              Start Test ⚡
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // GAME screen
  const isReady = phase === 'ready';
  const isClicked = phase === 'clicked';

  return (
    <AppLayout>
      <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>⚡ Reaction Test</h2>
            <span style={{ color: '#64748B', fontSize: '14px' }}>
              Round {Math.min(round + 1, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}
            </span>
          </div>
          <div className="progress-bar" style={{ marginTop: '12px' }}>
            <div className="progress-fill" style={{ width: `${(validTimes.length / TOTAL_ROUNDS) * 100}%` }} />
          </div>
        </div>

        {/* Click target */}
        <div
          onClick={handleClick}
          style={{
            height: '320px', borderRadius: '20px',
            background: isReady ? '#22C55E' : tooEarly ? '#EF4444' : '#1E293B',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'background 0.1s ease',
            marginBottom: '20px', userSelect: 'none'
          }}
        >
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: isReady ? '#16A34A' : tooEarly ? '#DC2626' : '#334155',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '40px', marginBottom: '16px',
            boxShadow: isReady ? '0 0 40px rgba(34,197,94,0.5)' : 'none',
            transition: 'all 0.2s'
          }}>
            {isReady ? '⚡' : tooEarly ? '❌' : '🔴'}
          </div>
          <p style={{
            color: 'white', fontSize: '20px', fontWeight: '700'
          }}>
            {isReady ? 'CLICK NOW!' : tooEarly ? 'Too Early!' : isClicked ? message : 'Wait for green...'}
          </p>
          {isClicked && !tooEarly && times.length > 0 && (
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', marginTop: '8px' }}>
              {times[times.length - 1]}ms — Click to continue
            </p>
          )}
        </div>

        {/* Recent times */}
        {validTimes.length > 0 && (
          <div className="card">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {validTimes.map((t, i) => (
                <span key={i} style={{
                  padding: '4px 12px', borderRadius: '100px',
                  background: t < 250 ? '#F0FDF4' : t < 400 ? '#FFFBEB' : '#FEF2F2',
                  color: t < 250 ? '#16A34A' : t < 400 ? '#D97706' : '#DC2626',
                  fontWeight: '700', fontSize: '13px'
                }}>{t}ms</span>
              ))}
            </div>
            <p style={{ textAlign: 'center', marginTop: '8px', color: '#64748B', fontSize: '13px' }}>
              Avg: {avgTime}ms
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ReactionTest;
