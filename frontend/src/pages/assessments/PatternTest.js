// src/pages/assessments/PatternTest.js
// Pattern recognition using shapes, colors, symbols and numbers

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../utils/api';

// Pattern elements to use
const SHAPES = ['🔴', '🔵', '🟢', '🟡', '🟠', '🟣'];
const SYMBOLS = ['★', '▲', '■', '●', '♦', '▼'];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

// Generate a unique pattern sequence
let lastPattern = null;

const generatePattern = () => {
  const types = ['color_shape', 'symbol', 'number_sequence', 'alternating'];
  let type = types[Math.floor(Math.random() * types.length)];

  let sequence, correct, options;

  if (type === 'color_shape') {
    // Pattern: red, blue, red, blue, ?
    const s1 = SHAPES[Math.floor(Math.random() * 3)];
    const s2 = SHAPES[Math.floor(Math.random() * 3 + 3)];
    const pattern = [s1, s2, s1, s2];
    correct = s1; // Pattern continues
    const wrongOptions = SHAPES.filter(s => s !== s1 && s !== s2).slice(0, 2);
    options = [correct, wrongOptions[0], wrongOptions[1], s2].sort(() => Math.random() - 0.5);
    sequence = [...pattern, '?'];
  } else if (type === 'symbol') {
    // Repeating symbol pattern: ★▲■★▲?
    const sym1 = SYMBOLS[Math.floor(Math.random() * 2)];
    const sym2 = SYMBOLS[Math.floor(Math.random() * 2 + 2)];
    const sym3 = SYMBOLS[Math.floor(Math.random() * 2 + 4)];
    const pattern = [sym1, sym2, sym3, sym1, sym2];
    correct = sym3;
    const wrong = SYMBOLS.filter(s => s !== sym1 && s !== sym2 && s !== sym3).slice(0, 3);
    options = [correct, ...wrong].sort(() => Math.random() - 0.5);
    sequence = [...pattern, '?'];
  } else if (type === 'number_sequence') {
    // Arithmetic sequence: 2, 4, 6, 8, ?
    const start = Math.floor(Math.random() * 4) + 1;
    const step = Math.floor(Math.random() * 3) + 1;
    const nums = [start, start + step, start + 2 * step, start + 3 * step];
    correct = start + 4 * step;
    const wrong = [correct - 1, correct + 1, correct + step];
    options = [correct, ...wrong].sort(() => Math.random() - 0.5);
    sequence = [...nums, '?'];
  } else {
    // Alternating: big, small, big, small, ?
    const big = ['⭕', '🔶', '🔷'];
    const small = ['⚪', '🔸', '🔹'];
    const b = big[Math.floor(Math.random() * 3)];
    const s = small[Math.floor(Math.random() * 3)];
    const pattern = [b, s, b, s];
    correct = b;
    options = [correct, s, big[1], small[1]].sort(() => Math.random() - 0.5);
    sequence = [...pattern, '?'];
  }

  // Ensure different from last pattern
  if (JSON.stringify(sequence) === JSON.stringify(lastPattern)) {
    return generatePattern();
  }
  lastPattern = sequence;

  return { sequence, correct, options, type };
};

const TOTAL_QUESTIONS = 10;

const PatternTest = () => {
  const navigate = useNavigate();
  const [patterns] = useState(() => Array.from({ length: TOTAL_QUESTIONS }, generatePattern));
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [timer, setTimer] = useState(20);
  const [phase, setPhase] = useState('playing'); // 'playing', 'result'
  const [startTime] = useState(Date.now());
  const [score, setScore] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (phase !== 'playing') return;
    setTimer(20);
    setSelected(null);

    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentQ, phase]);

  const handleAnswer = (option) => {
    if (selected !== null) return;
    clearInterval(timerRef.current);
    setSelected(option);

    const isCorrect = option === patterns[currentQ].correct;
    // Use functional update to always get latest score
    let latestScore = score;
    if (isCorrect) {
      latestScore = score + 10;
      setScore(latestScore);
    }

    const record = {
      question_id: currentQ + 1,
      selected: option,
      correct: patterns[currentQ].correct,
      is_correct: isCorrect
    };

    const newAnswers = [...answers, record];

    setTimeout(() => {
      if (currentQ < TOTAL_QUESTIONS - 1) {
        setAnswers(newAnswers);
        setCurrentQ(currentQ + 1);
      } else {
        submitTest(newAnswers, latestScore);
      }
    }, 700);
  };

  const submitTest = async (finalAnswers, finalScore) => {
    const completionTime = Math.round((Date.now() - startTime) / 1000);
    try {
      await api.post('/assessments/pattern-test', {
        score: finalScore,
        correct_answers: finalAnswers.filter(a => a.is_correct).length,
        total_questions: TOTAL_QUESTIONS,
        pattern_used: patterns.map(p => p.type),
        completion_time: completionTime
      });
    } catch (err) {
      console.error('Failed to save pattern test');
    }
    setAnswers(finalAnswers);
    setPhase('result');
  };

  if (phase === 'result') {
    const correct = answers.filter(a => a.is_correct).length;
    return (
      <AppLayout>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card" style={{
            background: 'linear-gradient(135deg, #4F46E5, #14B8A6)',
            color: 'white', textAlign: 'center', padding: '40px', marginBottom: '20px', border: 'none'
          }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>🔷</div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Pattern Test Complete!</h1>
            <div style={{ fontSize: '64px', fontWeight: '900', lineHeight: 1 }}>
              {score}<span style={{ fontSize: '24px', opacity: 0.7 }}>/100</span>
            </div>
            <p style={{ opacity: 0.8, marginTop: '8px' }}>
              {correct}/{TOTAL_QUESTIONS} patterns identified correctly
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ flex: 1 }}>
              📊 Dashboard
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const p = patterns[currentQ];
  const progress = (currentQ / TOTAL_QUESTIONS) * 100;

  return (
    <AppLayout>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '800' }}>🔷 Pattern Recognition</h1>
            <div style={{
              background: timer <= 7 ? '#FEF2F2' : '#EEF2FF',
              padding: '6px 16px', borderRadius: '100px',
              fontWeight: '700', fontSize: '16px',
              color: timer <= 7 ? '#EF4444' : '#4F46E5'
            }}>⏱ {timer}s</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B', marginBottom: '8px' }}>
            <span>Question {currentQ + 1} of {TOTAL_QUESTIONS}</span>
            <span>Score: {score}/100</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: '20px' }}>
          <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px', fontWeight: '600' }}>
            What comes next in the pattern?
          </p>

          {/* Pattern display */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '16px', flexWrap: 'wrap',
            padding: '24px', background: '#F8FAFC',
            borderRadius: '12px', marginBottom: '24px'
          }}>
            {p.sequence.map((item, i) => (
              <div key={i} style={{
                fontSize: i === p.sequence.length - 1 ? '40px' : '36px',
                minWidth: '52px', height: '52px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i === p.sequence.length - 1 ? '#4F46E5' : 'white',
                color: i === p.sequence.length - 1 ? 'white' : '#0F172A',
                borderRadius: '12px',
                border: i === p.sequence.length - 1 ? 'none' : '2px solid #E2E8F0',
                fontWeight: '700', boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
              }}>
                {item}
              </div>
            ))}
          </div>

          {/* Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {p.options.map((opt, i) => {
              let border = '2px solid #E2E8F0';
              let bg = 'white';
              if (selected !== null) {
                if (opt === p.correct) { border = '2px solid #22C55E'; bg = '#F0FDF4'; }
                else if (opt === selected) { border = '2px solid #EF4444'; bg = '#FEF2F2'; }
              }
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  disabled={selected !== null}
                  style={{
                    padding: '20px', fontSize: '32px', textAlign: 'center',
                    background: bg, border, borderRadius: '12px',
                    cursor: selected !== null ? 'default' : 'pointer',
                    transition: 'all 0.2s', fontFamily: 'inherit'
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PatternTest;
