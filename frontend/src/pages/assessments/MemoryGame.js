// src/pages/assessments/MemoryGame.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../utils/api';

const EMOJIS = ['🧠', '⚡', '🔷', '🌈', '🎯', '🔮', '🦋', '🎪', '🌟', '💎', '🎭', '🚀'];

const generateCards = (level) => {
  const count = Math.min(4 + level * 2, 12);
  const selected = EMOJIS.slice(0, count);
  const pairs = [...selected, ...selected];
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
};

// Score out of 100 based on level reached and accuracy
const calcScore = (level, totalMoves, totalMatches) => {
  if (totalMatches === 0) return 0;
  // Base score from level (each level = 20 points, max level 5 = 100)
  const levelScore = Math.min(100, level * 20);
  // Accuracy bonus: fewer moves = better
  const expectedMoves = totalMatches * 2; // perfect = 2 flips per pair
  const efficiency = Math.min(1, expectedMoves / Math.max(totalMoves, expectedMoves));
  // Final: 70% level-based + 30% efficiency
  return Math.min(100, Math.round(levelScore * 0.7 + efficiency * 30));
};

const MemoryGame = () => {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState(() => generateCards(1));
  const [flipped, setFlipped] = useState([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [gamePhase, setGamePhase] = useState('playing');
  const [startTime] = useState(Date.now());
  const [canFlip, setCanFlip] = useState(true);
  const [savedScore, setSavedScore] = useState(false);
  const [saving, setSaving] = useState(false);
  const levelRef = useRef(1);
  const totalMovesRef = useRef(0);
  const totalMatchesRef = useRef(0);

  const handleCardClick = useCallback((index) => {
    if (!canFlip) return;
    if (cards[index].flipped || cards[index].matched) return;
    if (flipped.length >= 2) return;

    const newCards = [...cards];
    newCards[index] = { ...newCards[index], flipped: true };
    setCards(newCards);
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      totalMovesRef.current += 1;
      setTotalMoves(t => t + 1);
      setCanFlip(false);

      const [first, second] = newFlipped;
      if (newCards[first].emoji === newCards[second].emoji) {
        const updatedCards = newCards.map((c, i) =>
          i === first || i === second ? { ...c, matched: true } : c
        );
        setCards(updatedCards);
        setFlipped([]);
        setCanFlip(true);

        const newMatchCount = matchCount + 1;
        setMatchCount(newMatchCount);
        totalMatchesRef.current += 1;
        setTotalMatches(t => t + 1);

        // Recalculate score out of 100
        const newScore = calcScore(levelRef.current, totalMovesRef.current, totalMatchesRef.current);
        setScore(newScore);

        if (newMatchCount >= updatedCards.length / 2) {
          setTimeout(() => setGamePhase('levelup'), 600);
        }
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) =>
            i === first || i === second ? { ...c, flipped: false } : c
          ));
          setFlipped([]);
          setCanFlip(true);
        }, 900);
      }
    }
  }, [cards, flipped, canFlip, moves, matchCount]);

  const handleNextLevel = () => {
    const nextLevel = level + 1;
    if (nextLevel > 5) {
      setGamePhase('complete');
    } else {
      levelRef.current = nextLevel;
      setLevel(nextLevel);
      setCards(generateCards(nextLevel));
      setFlipped([]);
      setMatchCount(0);
      setGamePhase('playing');
      setCanFlip(true);
      // Update score for new level
      const newScore = calcScore(nextLevel - 1, totalMovesRef.current, totalMatchesRef.current);
      setScore(newScore);
    }
  };

  const handleFinish = () => setGamePhase('complete');

  const saveResults = async () => {
    if (savedScore || saving) return;
    setSaving(true);
    const finalScore = calcScore(levelRef.current, totalMovesRef.current, totalMatchesRef.current);
    try {
      const completionTime = Math.round((Date.now() - startTime) / 1000);
      await api.post('/assessments/memory-test', {
        score: finalScore,
        max_level_reached: levelRef.current,
        completion_time: completionTime
      });
      setSavedScore(true);
      setScore(finalScore);
    } catch (err) {
      console.error('Failed to save memory game:', err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (gamePhase === 'complete') saveResults();
  }, [gamePhase]);

  if (gamePhase === 'levelup') {
    return (
      <AppLayout>
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
          <div className="card" style={{ padding: '48px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Level {level} Complete!</h2>
            <p style={{ color: '#64748B', marginBottom: '8px' }}>Current Score: <strong style={{ color: '#4F46E5', fontSize: '24px' }}>{score}/100</strong></p>
            <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>Matches: {totalMatches} | Moves: {totalMoves}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {level < 5 && (
                <button onClick={handleNextLevel} className="btn btn-primary btn-lg">🚀 Next Level →</button>
              )}
              <button onClick={handleFinish} className="btn btn-secondary btn-lg">✅ Finish & Save</button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (gamePhase === 'complete') {
    return (
      <AppLayout>
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg,#4F46E5,#14B8A6)', color: 'white', padding: '48px', border: 'none', marginBottom: '16px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🧩</div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Memory Game Complete!</h2>
            <div style={{ fontSize: '72px', fontWeight: '900', lineHeight: 1 }}>{score}</div>
            <p style={{ opacity: 0.8, marginTop: '4px', fontSize: '18px' }}>Score / 100</p>
            <p style={{ opacity: 0.7, fontSize: '14px', marginTop: '8px' }}>Level {level} reached • {totalMoves} moves • {totalMatches} matches</p>
            {saving && <p style={{ opacity: 0.7, fontSize: '14px', marginTop: '12px' }}>💾 Saving...</p>}
            {savedScore && <p style={{ marginTop: '12px', fontSize: '14px' }}>✅ Saved!</p>}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => {
              levelRef.current = 1; totalMovesRef.current = 0; totalMatchesRef.current = 0;
              setLevel(1); setCards(generateCards(1)); setScore(0);
              setMoves(0); setTotalMoves(0); setTotalMatches(0);
              setMatchCount(0); setFlipped([]); setGamePhase('playing');
              setSavedScore(false); setCanFlip(true);
            }} className="btn btn-secondary" style={{ flex: 1 }}>🔄 Play Again</button>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ flex: 1 }}>📊 Dashboard</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const cols = Math.ceil(Math.sqrt(cards.length));
  const pairsToFind = cards.length / 2;
  const matchedSoFar = cards.filter(c => c.matched).length / 2;

  return (
    <AppLayout>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div><h1 style={{ fontSize: '22px', fontWeight: '800' }}>🧩 Memory Game</h1>
              <p style={{ color: '#64748B', fontSize: '14px' }}>Match all pairs to advance</p></div>
            <div style={{ display: 'flex', gap: '20px' }}>
              {[['SCORE', score, '#4F46E5'], ['LEVEL', level, '#14B8A6'], ['MOVES', moves, '#F59E0B']].map(([label, val, color]) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '24px', fontWeight: '800', color }}>{val}</p>
                  <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>Pairs: {matchedSoFar}/{pairsToFind}</span>
              <span style={{ fontSize: '13px', color: '#64748B' }}>Level {level}/5</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(matchedSoFar / pairsToFind) * 100}%` }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '10px', marginBottom: '20px' }}>
          {cards.map((card, i) => (
            <div key={card.id} onClick={() => handleCardClick(i)} style={{
              aspectRatio: '1', background: card.matched ? '#F0FDF4' : card.flipped ? '#EEF2FF' : 'linear-gradient(135deg,#4F46E5,#14B8A6)',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: card.flipped || card.matched ? '36px' : '24px',
              cursor: card.matched || card.flipped ? 'default' : 'pointer',
              border: card.matched ? '2px solid #22C55E' : card.flipped ? '2px solid #4F46E5' : '2px solid transparent',
              transition: 'all 0.25s ease', userSelect: 'none', color: card.flipped || card.matched ? 'inherit' : 'white',
              boxShadow: card.flipped || card.matched ? '0 4px 12px rgba(0,0,0,0.1)' : 'none', fontWeight: '700'
            }}>
              {card.flipped || card.matched ? card.emoji : '?'}
            </div>
          ))}
        </div>
        <button onClick={handleFinish} className="btn btn-secondary btn-full">Finish Early & Save Score</button>
      </div>
    </AppLayout>
  );
};

export default MemoryGame;
