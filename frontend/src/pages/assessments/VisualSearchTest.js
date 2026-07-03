// src/pages/assessments/VisualSearchTest.js
// Find the target symbol among distractors

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../utils/api';

const TOTAL_ROUNDS = 10;

const generateGrid = (target, size) => {
  const distractors = ['★', '▲', '■', '●', '♦', '▼', '◆', '▸', '◀', '✦'].filter(s => s !== target);
  const cells = Array.from({ length: size * size }, (_, i) => ({
    id: i,
    symbol: distractors[Math.floor(Math.random() * distractors.length)],
    isTarget: false
  }));
  // Place target at random position
  const targetPos = Math.floor(Math.random() * cells.length);
  cells[targetPos] = { ...cells[targetPos], symbol: target, isTarget: true };
  return cells;
};

const TARGETS = ['★', '▲', '■', '●', '♦'];

const VisualSearchTest = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('intro');
  const [round, setRound] = useState(0);
  const [grid, setGrid] = useState([]);
  const [target, setTarget] = useState(TARGETS[0]);
  const [selected, setSelected] = useState(null);
  const [searchTimes, setSearchTimes] = useState([]);
  const [correctFinds, setCorrectFinds] = useState(0);
  const [timer, setTimer] = useState(10);
  const [roundStart, setRoundStart] = useState(Date.now());
  const [startTime] = useState(Date.now());
  const timerRef = useRef(null);
  const gridSize = Math.min(6, 4 + Math.floor(round / 3)); // grows over rounds

  const startRound = (roundNum) => {
    const t = TARGETS[roundNum % TARGETS.length];
    setTarget(t);
    setGrid(generateGrid(t, gridSize));
    setSelected(null);
    setTimer(10);
    setRoundStart(Date.now());
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSelect(null); // auto-miss
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [round, phase]);

  const handleSelect = (cell) => {
    if (selected !== null) return;
    clearInterval(timerRef.current);
    setSelected(cell?.id ?? -1);
    const searchTime = Date.now() - roundStart;
    const isCorrect = cell?.isTarget ?? false;
    if (isCorrect) setCorrectFinds(c => c + 1);
    setSearchTimes(t => [...t, searchTime]);

    setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound >= TOTAL_ROUNDS) finishTest(isCorrect);
      else { setRound(nextRound); startRound(nextRound); }
    }, 800);
  };

  const finishTest = async (lastCorrect) => {
    setPhase('done');
    const totalCorrect = lastCorrect ? correctFinds + 1 : correctFinds;
    const avgTime = searchTimes.length > 0
      ? Math.round(searchTimes.reduce((a,b) => a+b, 0) / searchTimes.length) : 5000;
    const score = Math.round((totalCorrect / TOTAL_ROUNDS) * 70 + Math.max(0, (5000 - avgTime) / 100));
    const clamped = Math.max(0, Math.min(100, score));
    try {
      await api.post('/assessments/visual-search-test', {
        correct_finds: totalCorrect, total_targets: TOTAL_ROUNDS,
        avg_search_time: avgTime / 1000, score: clamped,
        completion_time: Math.round((Date.now() - startTime) / 1000)
      });
    } catch (e) { console.error(e); }
  };

  if (phase === 'done') {
    const avgTime = searchTimes.length > 0 ? Math.round(searchTimes.reduce((a,b)=>a+b,0)/searchTimes.length) : 0;
    const score = Math.max(0, Math.min(100, Math.round((correctFinds/TOTAL_ROUNDS)*70 + Math.max(0,(5000-avgTime)/100))));
    return (
      <AppLayout>
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg,#4F46E5,#14B8A6)', color: 'white', padding: '40px', border: 'none', marginBottom: '16px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Visual Search Complete!</h2>
            <div style={{ fontSize: '64px', fontWeight: '900' }}>{score}</div>
            <p style={{ opacity: 0.8 }}>{correctFinds}/{TOTAL_ROUNDS} found • Avg {(avgTime/1000).toFixed(1)}s</p>
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
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '12px' }}>Visual Search Test</h1>
            <p style={{ color: '#64748B', marginBottom: '24px' }}>
              Find and click the target symbol among distractors. The grid gets bigger each round!
            </p>
            <button onClick={() => { setPhase('playing'); startRound(0); }} className="btn btn-primary btn-lg btn-full">Start Test 🔍</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>🔍 Visual Search</h2>
              <p style={{ color: '#64748B', fontSize: '13px' }}>Round {round + 1}/{TOTAL_ROUNDS}</p>
            </div>
            <div style={{
              background: timer <= 3 ? '#FEF2F2' : '#EEF2FF',
              padding: '6px 16px', borderRadius: '100px',
              fontWeight: '700', color: timer <= 3 ? '#EF4444' : '#4F46E5', fontSize: '16px'
            }}>⏱ {timer}s</div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }} />
          </div>
        </div>

        {/* Target */}
        <div className="card" style={{ textAlign: 'center', marginBottom: '16px', padding: '16px' }}>
          <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '8px' }}>Find this symbol:</p>
          <div style={{
            fontSize: '56px', fontWeight: '900', color: '#4F46E5',
            padding: '12px', background: '#EEF2FF', borderRadius: '12px',
            display: 'inline-block', minWidth: '80px'
          }}>{target}</div>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: '6px', marginBottom: '16px'
        }}>
          {grid.map(cell => {
            let bg = 'white';
            let border = '1px solid #E2E8F0';
            if (selected !== null) {
              if (cell.isTarget) { bg = '#F0FDF4'; border = '2px solid #22C55E'; }
              else if (cell.id === selected && !cell.isTarget) { bg = '#FEF2F2'; border = '2px solid #EF4444'; }
            }
            return (
              <button
                key={cell.id}
                onClick={() => handleSelect(cell)}
                disabled={selected !== null}
                style={{
                  aspectRatio: '1', fontSize: '22px', border, borderRadius: '8px',
                  background: bg, cursor: selected !== null ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', fontFamily: 'inherit',
                  color: cell.isTarget && selected !== null ? '#16A34A' : '#0F172A'
                }}
              >
                {cell.symbol}
              </button>
            );
          })}
        </div>
        <p style={{ textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
          ✅ Found: {correctFinds}
        </p>
      </div>
    </AppLayout>
  );
};

export default VisualSearchTest;
