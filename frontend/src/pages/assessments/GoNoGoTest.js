// src/pages/assessments/GoNoGoTest.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../utils/api';

const TOTAL_TRIALS = 30;
const GO_PROBABILITY = 0.7;

const GoNoGoTest = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('intro');
  const [trial, setTrial] = useState(0);
  const [stimulus, setStimulus] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [finalStats, setFinalStats] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const startTime = useRef(Date.now());
  const timeoutRef = useRef(null);
  const stimulusTimeout = useRef(null);

  // Use refs to track stats — avoids stale closure bug
  const statsRef = useRef({ correct_go: 0, correct_nogo: 0, false_alarms: 0, misses: 0 });
  const trialRef = useRef(0);
  const phaseRef = useRef('intro');

  const finishTest = async () => {
    if (phaseRef.current === 'done') return;
    phaseRef.current = 'done';
    setPhase('done');

    const s = statsRef.current;
    const accuracy = ((s.correct_go + s.correct_nogo) / TOTAL_TRIALS) * 100;
    const raw = accuracy - (s.false_alarms * 3);
    const score = Math.min(100, Math.max(0, Math.round(raw)));
    const completionTime = Math.round((Date.now() - startTime.current) / 1000);

    setFinalStats({ ...s });
    setFinalScore(score);

    try {
      await api.post('/assessments/go-no-go-test', {
        correct_go: s.correct_go,
        correct_nogo: s.correct_nogo,
        false_alarms: s.false_alarms,
        misses: s.misses,
        score,
        completion_time: completionTime
      });
    } catch (e) { console.error(e); }
  };

  const nextTrial = () => {
    if (phaseRef.current === 'done') return;
    setStimulus(null);
    setFeedback('');
    setWaiting(true);

    timeoutRef.current = setTimeout(() => {
      if (phaseRef.current === 'done') return;
      const isGo = Math.random() < GO_PROBABILITY;
      setStimulus(isGo ? 'go' : 'nogo');
      setWaiting(false);

      stimulusTimeout.current = setTimeout(() => {
        if (phaseRef.current === 'done') return;
        // Auto response timeout
        if (isGo) {
          statsRef.current.misses += 1;
          setFeedback('miss');
        } else {
          statsRef.current.correct_nogo += 1;
          setFeedback('correct');
        }
        setStimulus(null);
        trialRef.current += 1;
        setTrial(trialRef.current);

        if (trialRef.current >= TOTAL_TRIALS) {
          finishTest();
        } else {
          setTimeout(nextTrial, 500);
        }
      }, 800);
    }, 800 + Math.random() * 800);
  };

  const handleResponse = () => {
    if (waiting || stimulus === null || phaseRef.current === 'done') return;
    clearTimeout(stimulusTimeout.current);
    const isGo = stimulus === 'go';

    if (isGo) {
      statsRef.current.correct_go += 1;
      setFeedback('correct');
    } else {
      statsRef.current.false_alarms += 1;
      setFeedback('false_alarm');
    }
    setStimulus(null);
    trialRef.current += 1;
    setTrial(trialRef.current);

    if (trialRef.current >= TOTAL_TRIALS) {
      finishTest();
    } else {
      setTimeout(nextTrial, 400);
    }
  };

  useEffect(() => () => {
    clearTimeout(timeoutRef.current);
    clearTimeout(stimulusTimeout.current);
  }, []);

  if (phase === 'done' && finalStats) {
    return (
      <AppLayout>
        <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg,#4F46E5,#14B8A6)', color: 'white', padding: '40px', border: 'none', marginBottom: '16px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚦</div>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Go/No-Go Complete!</h2>
            <div style={{ fontSize: '64px', fontWeight: '900' }}>{finalScore}</div>
            <p style={{ opacity: 0.8 }}>Score / 100</p>
          </div>
          <div className="card" style={{ marginBottom: '16px', textAlign: 'left' }}>
            {[
              ['✅ Correct Go (pressed on green)', finalStats.correct_go],
              ['🛑 Correct No-Go (held back on red)', finalStats.correct_nogo],
              ['❌ False Alarms (pressed on red)', finalStats.false_alarms],
              ['💨 Misses (missed green)', finalStats.misses]
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
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
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚦</div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '12px' }}>Go / No-Go Test</h1>
            <div className="card" style={{ background: '#F8FAFC', textAlign: 'left', marginBottom: '24px' }}>
              <p style={{ marginBottom: '8px' }}><strong>🟢 GREEN</strong> = Click immediately (Go!)</p>
              <p><strong>🔴 RED</strong> = Do NOT click (No-Go!)</p>
            </div>
            <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '14px' }}>{TOTAL_TRIALS} trials • Be fast but accurate</p>
            <button onClick={() => {
              phaseRef.current = 'playing';
              statsRef.current = { correct_go: 0, correct_nogo: 0, false_alarms: 0, misses: 0 };
              trialRef.current = 0;
              startTime.current = Date.now();
              setPhase('playing');
              nextTrial();
            }} className="btn btn-primary btn-lg btn-full">Start Test 🚦</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const bgColor = stimulus === 'go' ? '#22C55E' : stimulus === 'nogo' ? '#EF4444' : '#1E293B';

  return (
    <AppLayout>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#64748B' }}>Trial {trial + 1}/{TOTAL_TRIALS}</span>
            <div style={{ display: 'flex', gap: '12px', fontSize: '13px', fontWeight: '700' }}>
              <span style={{ color: '#22C55E' }}>✅ {statsRef.current.correct_go + statsRef.current.correct_nogo}</span>
              <span style={{ color: '#EF4444' }}>❌ {statsRef.current.false_alarms}</span>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(trial / TOTAL_TRIALS) * 100}%` }} />
          </div>
        </div>

        <div onClick={handleResponse} style={{
          height: '340px', borderRadius: '20px', background: bgColor,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'background 0.1s', userSelect: 'none'
        }}>
          {waiting ? (
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '18px' }}>Get ready...</p>
          ) : stimulus ? (
            <>
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%',
                background: stimulus === 'go' ? '#16A34A' : '#DC2626',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '52px', boxShadow: `0 0 40px ${stimulus === 'go' ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`
              }}>
                {stimulus === 'go' ? '✅' : '🛑'}
              </div>
              <p style={{ color: 'white', marginTop: '16px', fontSize: '20px', fontWeight: '700' }}>
                {stimulus === 'go' ? 'CLICK!' : 'STOP!'}
              </p>
            </>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>
              {feedback === 'false_alarm' ? '❌ Wrong — don\'t click red!' :
               feedback === 'miss' ? '💨 Too slow!' :
               feedback === 'correct' ? '✅ Correct!' : '...'}
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default GoNoGoTest;
