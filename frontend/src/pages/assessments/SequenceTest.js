// src/pages/assessments/SequenceTest.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../utils/api';

const BUTTONS = [
  { id: 0, emoji: '🔴', color: '#EF4444', light: '#FEF2F2' },
  { id: 1, emoji: '🔵', color: '#3B82F6', light: '#EFF6FF' },
  { id: 2, emoji: '🟢', color: '#22C55E', light: '#F0FDF4' },
  { id: 3, emoji: '🟡', color: '#EAB308', light: '#FEFCE8' },
];

// Score: level reached out of max 10 levels = 10 points each = 100 max
const calcScore = (maxLevel) => Math.min(100, maxLevel * 10);

const SequenceTest = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('intro');
  const [sequence, setSequence] = useState([]);
  const [playerInput, setPlayerInput] = useState([]);
  const [activeBtn, setActiveBtn] = useState(null);
  const [level, setLevel] = useState(1);
  const [maxLevel, setMaxLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canInput, setCanInput] = useState(false);
  const [failed, setFailed] = useState(false);
  const [startTime] = useState(Date.now());

  const playSequence = async (seq) => {
    setCanInput(false);
    setIsPlaying(true);
    await new Promise(r => setTimeout(r, 600));
    for (let i = 0; i < seq.length; i++) {
      setActiveBtn(seq[i]);
      await new Promise(r => setTimeout(r, 500));
      setActiveBtn(null);
      await new Promise(r => setTimeout(r, 250));
    }
    setIsPlaying(false);
    setCanInput(true);
  };

  const startLevel = async (lvl) => {
    const newSeq = Array.from({ length: lvl }, () => Math.floor(Math.random() * 4));
    setSequence(newSeq);
    setPlayerInput([]);
    setFailed(false);
    setLevel(lvl);
    const newMax = Math.max(lvl, maxLevel);
    setMaxLevel(newMax);
    await playSequence(newSeq);
  };

  const handleButtonPress = async (btnId) => {
    if (!canInput || isPlaying) return;
    const newInput = [...playerInput, btnId];
    setPlayerInput(newInput);
    setActiveBtn(btnId);
    setTimeout(() => setActiveBtn(null), 200);

    const pos = newInput.length - 1;
    if (sequence[pos] !== btnId) {
      setFailed(true);
      setCanInput(false);
      setTimeout(() => finishTest(), 1200);
      return;
    }

    if (newInput.length === sequence.length) {
      setCanInput(false);
      await new Promise(r => setTimeout(r, 600));
      if (level >= 10) {
        finishTest();
      } else {
        startLevel(level + 1);
      }
    }
  };

  const finishTest = async () => {
    setPhase('done');
    const score = calcScore(maxLevel);
    const completionTime = Math.round((Date.now() - startTime) / 1000);
    try {
      await api.post('/assessments/sequence-recall-test', {
        max_sequence_length: maxLevel,
        score,
        completion_time: completionTime
      });
    } catch (e) { console.error(e); }
  };

  if (phase === 'done') {
    const score = calcScore(maxLevel);
    return (
      <AppLayout>
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg,#4F46E5,#14B8A6)', color: 'white', padding: '40px', border: 'none', marginBottom: '16px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔢</div>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Sequence Recall Complete!</h2>
            <div style={{ fontSize: '64px', fontWeight: '900' }}>{score}</div>
            <p style={{ opacity: 0.8 }}>Score / 100</p>
            <p style={{ opacity: 0.7, fontSize: '14px', marginTop: '8px' }}>Max sequence length: {maxLevel} steps</p>
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
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
          <div className="card" style={{ padding: '48px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔢</div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '12px' }}>Sequence Recall Test</h1>
            <p style={{ color: '#64748B', marginBottom: '16px' }}>
              Watch the buttons light up, then repeat the same sequence. Each level adds one more step!
            </p>
            <div className="card" style={{ background: '#F8FAFC', marginBottom: '20px', textAlign: 'left' }}>
              <p style={{ fontSize: '14px', color: '#64748B' }}>🏆 Scoring: Each level = 10 points (max 100)</p>
              <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>📈 Max 10 levels possible</p>
            </div>
            <button onClick={() => { setPhase('playing'); startLevel(1); }} className="btn btn-primary btn-lg btn-full">Start Test 🔢</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: '700', fontSize: '16px' }}>Level {level}</p>
              <p style={{ color: '#64748B', fontSize: '13px' }}>Sequence: {sequence.length} steps</p>
            </div>
            <div>
              <p style={{ fontWeight: '700', fontSize: '16px', color: '#4F46E5' }}>{calcScore(maxLevel)}/100</p>
              <p style={{ color: '#64748B', fontSize: '13px' }}>Current Score</p>
            </div>
          </div>
          <div style={{ marginTop: '12px', color: '#64748B', fontSize: '14px', fontWeight: '600' }}>
            {isPlaying ? '👀 Watch carefully...' : canInput ? '👆 Your turn! Repeat the sequence.' : failed ? '❌ Wrong! Game over.' : '⏳ Get ready...'}
          </div>
          {canInput && (
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '10px' }}>
              {sequence.map((_, i) => (
                <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: i < playerInput.length ? '#4F46E5' : '#E2E8F0' }} />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {BUTTONS.map(btn => (
            <button key={btn.id} onClick={() => handleButtonPress(btn.id)} disabled={!canInput}
              style={{
                height: '120px', border: 'none', borderRadius: '16px',
                background: activeBtn === btn.id ? btn.light : btn.color,
                fontSize: '48px', cursor: canInput ? 'pointer' : 'default',
                transition: 'all 0.1s ease',
                transform: activeBtn === btn.id ? 'scale(0.95)' : 'scale(1)',
                boxShadow: activeBtn === btn.id ? `0 0 30px ${btn.color}80` : '0 4px 12px rgba(0,0,0,0.15)',
                opacity: !canInput && activeBtn !== btn.id ? 0.7 : 1, fontFamily: 'inherit'
              }}>
              {btn.emoji}
            </button>
          ))}
        </div>

        {failed && <div className="alert alert-error">❌ Wrong! You reached level {level} — max sequence: {maxLevel} steps</div>}
        <button onClick={finishTest} className="btn btn-secondary btn-full" style={{ marginTop: '8px' }}>End Test & Save Score</button>
      </div>
    </AppLayout>
  );
};

export default SequenceTest;
