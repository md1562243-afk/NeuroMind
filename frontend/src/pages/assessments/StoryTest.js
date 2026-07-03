// src/pages/assessments/StoryTest.js
// Reading comprehension test with shuffled options per attempt

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../utils/api';

// The story text (never changes)
const STORY_TEXT = `It was a quiet evening in the old part of the city. Muhammad was sitting by the window of his uncle's house, watching the narrow street below. The streetlights flickered as a cool breeze passed through.

Suddenly, Muhammad noticed a man in a black cloak walking quickly along the street. The man kept looking over his shoulder as if he was being followed. Muhammad watched curiously as the man stopped in front of an old, abandoned building and disappeared inside.

Muhammad's curiosity got the better of him. He quietly went outside to follow the man. When he reached the abandoned building, he pushed open the creaky door and stepped inside. The building was dark and dusty. He walked carefully through the hallway until he found a small room.

In the room, he saw an old wooden box on the floor. Next to it was a rusty key. Muhammad picked up the key and examined it. At that moment, he heard footsteps behind him and quickly turned around — but there was nobody there.

When Muhammad returned to his uncle's house and showed the key, his uncle's face turned pale with shock. His uncle said that this key had been lost many years ago and belonged to a chest that held a very important family secret. Neither of them could explain how the key ended up in the abandoned building — or who the mysterious man in the black cloak was.`;

// Questions (never change — only options shuffle)
const QUESTIONS = [
  {
    id: 1,
    question: "Why did Muhammad go outside?",
    correct: "He wanted to follow the man.",
    options: [
      "He wanted to follow the man.",
      "He wanted to get some fresh air.",
      "His uncle asked him to go.",
      "He heard a loud noise outside."
    ],
    explanation: "Muhammad's curiosity got the better of him and he went outside to follow the mysterious man in the black cloak."
  },
  {
    id: 2,
    question: "Which event mainly marks the beginning of the mystery?",
    correct: "The sudden disappearance of the man wearing the black cloak.",
    options: [
      "The sudden disappearance of the man wearing the black cloak.",
      "Muhammad finding the rusty key on the floor.",
      "The streetlights flickering in the evening.",
      "Muhammad's uncle recognizing the key."
    ],
    explanation: "The mystery begins when the man in the black cloak suddenly disappears into the abandoned building."
  },
  {
    id: 3,
    question: "Why was the uncle surprised when he saw the key?",
    correct: "It had been lost many years ago.",
    options: [
      "It had been lost many years ago.",
      "It was made of pure gold.",
      "He had never seen it before.",
      "It opened the front door of the house."
    ],
    explanation: "The uncle's face turned pale because the key had been lost many years ago and belonged to a chest with a family secret."
  },
  {
    id: 4,
    question: "Which can be inferred from the story?",
    correct: "The mysterious man may have some connection to the key.",
    options: [
      "The mysterious man may have some connection to the key.",
      "Muhammad had visited the abandoned building before.",
      "The uncle knew who the man in the black cloak was.",
      "The key was not important to anyone."
    ],
    explanation: "Since the man led Muhammad to exactly where the key was, it can be inferred that the man has some connection to the key."
  },
  {
    id: 5,
    question: "Why does the ending create curiosity?",
    correct: "No explanation is given for the identity of the man or the mystery of the key.",
    options: [
      "No explanation is given for the identity of the man or the mystery of the key.",
      "Muhammad decides to sell the key.",
      "The uncle destroys the key at the end.",
      "The abandoned building is torn down."
    ],
    explanation: "The story ends without revealing who the man was or how the key ended up there, leaving the reader curious."
  }
];

// Shuffle array (Fisher-Yates algorithm)
const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const StoryTest = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('reading'); // 'reading', 'questions', 'result'
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [readingTime, setReadingTime] = useState(120); // 2 mins to read
  const [questionTimer, setQuestionTimer] = useState(30);
  const [startTime, setStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  // Reading phase countdown
  useEffect(() => {
    if (phase === 'reading') {
      timerRef.current = setInterval(() => {
        setReadingTime(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            startQuestions();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Question timer
  useEffect(() => {
    if (phase === 'questions') {
      setQuestionTimer(30);
      setQuestionStartTime(Date.now());
      // Shuffle options for current question
      setShuffledOptions(shuffleArray(QUESTIONS[currentQ].options));
      setSelected(null);

      timerRef.current = setInterval(() => {
        setQuestionTimer(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            handleNext(null); // Auto-skip on timeout
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, currentQ]);

  const startQuestions = () => {
    setPhase('questions');
    setStartTime(Date.now());
  };

  const handleAnswer = (option) => {
    if (selected !== null) return; // Already answered
    clearInterval(timerRef.current);
    setSelected(option);
    setTimeout(() => handleNext(option), 800); // Brief pause before moving
  };

  const handleNext = (selectedOption) => {
    clearInterval(timerRef.current);
    const timeSpent = Math.round((Date.now() - (questionStartTime || Date.now())) / 1000);
    const q = QUESTIONS[currentQ];

    const answerRecord = {
      question_id: q.id,
      selected_answer: selectedOption || '',
      correct_answer: q.correct,
      is_correct: selectedOption === q.correct,
      time_spent: timeSpent
    };

    const newAnswers = [...answers, answerRecord];

    if (currentQ < QUESTIONS.length - 1) {
      setAnswers(newAnswers);
      setCurrentQ(currentQ + 1);
    } else {
      submitTest(newAnswers);
    }
  };

  const submitTest = async (finalAnswers) => {
    setLoading(true);
    const totalTime = Math.round((Date.now() - startTime) / 1000);

    try {
      const response = await api.post('/assessments/story-test', {
        answers: finalAnswers,
        completion_time: totalTime
      });

      setResult(response.data.result);
      setPhase('result');
    } catch (err) {
      alert('Failed to save results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    if (level?.includes('Excellent')) return '#22C55E';
    if (level?.includes('Very Good')) return '#14B8A6';
    if (level?.includes('Good')) return '#F59E0B';
    return '#EF4444';
  };

  // READING PHASE
  if (phase === 'reading') {
    return (
      <AppLayout>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: '800' }}>📖 Story Comprehension Test</h1>
                <p style={{ color: '#64748B', fontSize: '14px' }}>Read the story carefully. Questions follow.</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '64px', height: '64px',
                  background: readingTime <= 30 ? '#FEF2F2' : '#EEF2FF',
                  borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: '800',
                  color: readingTime <= 30 ? '#EF4444' : '#4F46E5',
                  border: `3px solid ${readingTime <= 30 ? '#EF4444' : '#4F46E5'}`
                }}>
                  {readingTime}s
                </div>
                <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Reading time</p>
              </div>
            </div>
            <div className="progress-bar" style={{ marginBottom: '20px' }}>
              <div className="progress-fill" style={{ width: `${(readingTime / 120) * 100}%` }} />
            </div>
          </div>

          {/* Story text */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{
              background: '#F8FAFC', borderRadius: '12px', padding: '24px',
              border: '1px solid #E2E8F0', lineHeight: '1.9',
              fontSize: '16px', color: '#0F172A'
            }}>
              {STORY_TEXT.split('\n\n').map((para, i) => (
                <p key={i} style={{ marginBottom: '16px' }}>{para}</p>
              ))}
            </div>
          </div>

          <button
            onClick={startQuestions}
            className="btn btn-primary btn-lg btn-full"
          >
            I'm Ready — Start Questions →
          </button>
        </div>
      </AppLayout>
    );
  }

  // QUESTIONS PHASE
  if (phase === 'questions') {
    const q = QUESTIONS[currentQ];
    const progress = ((currentQ) / QUESTIONS.length) * 100;

    return (
      <AppLayout>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          {/* Progress header */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ fontWeight: '600', color: '#64748B', fontSize: '14px' }}>
                Question {currentQ + 1} of {QUESTIONS.length}
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: questionTimer <= 10 ? '#FEF2F2' : '#EEF2FF',
                padding: '6px 14px', borderRadius: '100px'
              }}>
                <span>⏱️</span>
                <span style={{
                  fontWeight: '700', fontSize: '16px',
                  color: questionTimer <= 10 ? '#EF4444' : '#4F46E5'
                }}>{questionTimer}s</span>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Question card */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', lineHeight: '1.5' }}>
              {q.question}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {shuffledOptions.map((option, i) => {
                let bgColor = 'white';
                let borderColor = '#E2E8F0';
                let textColor = '#0F172A';

                if (selected !== null) {
                  if (option === q.correct) {
                    bgColor = '#F0FDF4'; borderColor = '#22C55E'; textColor = '#16A34A';
                  } else if (option === selected && option !== q.correct) {
                    bgColor = '#FEF2F2'; borderColor = '#EF4444'; textColor = '#DC2626';
                  }
                } else if (selected === option) {
                  bgColor = '#EEF2FF'; borderColor = '#4F46E5';
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(option)}
                    disabled={selected !== null}
                    style={{
                      padding: '16px 20px', textAlign: 'left',
                      background: bgColor, border: `2px solid ${borderColor}`,
                      borderRadius: '12px', cursor: selected !== null ? 'default' : 'pointer',
                      color: textColor, fontWeight: '500', fontSize: '15px',
                      transition: 'all 0.2s ease', display: 'flex',
                      alignItems: 'center', gap: '12px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    <span style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: borderColor === '#E2E8F0' ? '#F1F5F9' : borderColor,
                      color: borderColor === '#E2E8F0' ? '#64748B' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: '700', flexShrink: 0
                    }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // RESULT PHASE
  if (phase === 'result' && result) {
    const levelColor = getLevelColor(result.level);

    return (
      <AppLayout>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          {/* Score card */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, #4F46E5, #14B8A6)',
            color: 'white', textAlign: 'center',
            padding: '40px', marginBottom: '20px', border: 'none'
          }}>
            <div style={{ fontSize: '56px', marginBottom: '8px' }}>📖</div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>Test Complete!</h1>
            <div style={{ fontSize: '64px', fontWeight: '900', lineHeight: 1, marginBottom: '8px' }}>
              {result.score}<span style={{ fontSize: '28px', opacity: 0.7 }}>/10</span>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.2)',
              padding: '8px 20px', borderRadius: '100px'
            }}>
              <span style={{ fontWeight: '700', fontSize: '16px' }}>{result.level}</span>
            </div>
          </div>

          {/* Answer review */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Answer Review</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {result.answers.map((ans, i) => (
                <div key={i} style={{
                  padding: '16px', borderRadius: '12px',
                  background: ans.is_correct ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${ans.is_correct ? '#BBF7D0' : '#FECACA'}`
                }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <span>{ans.is_correct ? '✅' : '❌'}</span>
                    <p style={{ fontWeight: '600', color: '#0F172A', fontSize: '14px' }}>
                      {QUESTIONS[i].question}
                    </p>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '4px' }}>
                    <strong>Your answer:</strong> {ans.selected_answer || '(No answer)'}
                  </p>
                  {!ans.is_correct && (
                    <p style={{ fontSize: '13px', color: '#16A34A' }}>
                      <strong>Correct answer:</strong> {ans.correct_answer}
                    </p>
                  )}
                  <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '6px', fontStyle: 'italic' }}>
                    💡 {QUESTIONS[i].explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => { setPhase('reading'); setAnswers([]); setCurrentQ(0); setResult(null); }} className="btn btn-secondary" style={{ flex: 1 }}>
              🔄 Try Again
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ flex: 1 }}>
              📊 Back to Dashboard
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Loading
  return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#64748B' }}>Saving your results...</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default StoryTest;
