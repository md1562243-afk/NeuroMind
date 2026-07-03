// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import AppLayout from '../components/layout/AppLayout';
import api from '../utils/api';

const ASSESSMENT_CARDS = [
  { type: 'story', icon: '📖', label: 'Story Test', path: '/assessments/story' },
  { type: 'memory', icon: '🧩', label: 'Memory Game', path: '/assessments/memory' },
  { type: 'pattern', icon: '🔷', label: 'Pattern Test', path: '/assessments/pattern' },
  { type: 'reaction', icon: '⚡', label: 'Reaction Test', path: '/assessments/reaction' },
  { type: 'gonogo', icon: '🚦', label: 'Go/No-Go', path: '/assessments/gonogo' },
  { type: 'stroop', icon: '🌈', label: 'Stroop Test', path: '/assessments/stroop' },
  { type: 'sequence', icon: '🔢', label: 'Sequence Recall', path: '/assessments/sequence' },
  { type: 'visual_search', icon: '🔍', label: 'Visual Search', path: '/assessments/visual-search' },
  { type: 'cpt', icon: '⏱️', label: 'CPT Test', path: '/assessments/cpt' },
];

const calculateAge = (dob) => {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// Risk level config
const getRisk = (score) => {
  if (score >= 80) return {
    level: 'Stable',
    icon: '✅',
    color: '#22C55E',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    text: 'Your cognitive performance is within the normal range.',
    gradient: 'linear-gradient(135deg, #22C55E, #16A34A)'
  };
  if (score >= 60) return {
    level: 'Average',
    icon: '⚠️',
    color: '#F59E0B',
    bg: '#FFFBEB',
    border: '#FDE68A',
    text: 'Some attention difficulties detected. Monitor regularly.',
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)'
  };
  return {
    level: 'High Risk',
    icon: '🚨',
    color: '#EF4444',
    bg: '#FEF2F2',
    border: '#FECACA',
    text: 'Significant cognitive markers detected. Please consult a specialist.',
    gradient: 'linear-gradient(135deg, #EF4444, #DC2626)'
  };
};

// Recommendations based on score
const getRecommendations = (score) => {
  if (score >= 80) return [
    { icon: '🧘', title: 'Maintain Your Routine', desc: 'Keep up your current healthy habits and cognitive exercises.' },
    { icon: '📚', title: 'Challenge Yourself', desc: 'Try harder cognitive tasks to keep your mind sharp.' },
    { icon: '😴', title: 'Prioritize Sleep', desc: 'Ensure 7–9 hours of quality sleep for optimal brain function.' },
    { icon: '🏃', title: 'Stay Active', desc: 'Regular exercise improves memory and attention span.' },
  ];
  if (score >= 60) return [
    { icon: '🧠', title: 'Cognitive Training', desc: 'Practice daily memory and attention exercises for 15–20 minutes.' },
    { icon: '📝', title: 'Use To-Do Lists', desc: 'Write tasks down to compensate for attention difficulties.' },
    { icon: '⏰', title: 'Set Reminders', desc: 'Use alarms and timers to help manage time and tasks.' },
    { icon: '🥗', title: 'Healthy Diet', desc: 'Omega-3 rich foods like fish support brain health.' },
    { icon: '🧘', title: 'Mindfulness Practice', desc: '10 minutes of daily meditation improves focus and reduces stress.' },
    { icon: '🏥', title: 'Consider Consultation', desc: 'Speaking with a professional can help identify specific strategies.' },
  ];
  return [
    { icon: '👨‍⚕️', title: 'Consult a Specialist', desc: 'Schedule an appointment with a psychiatrist for proper evaluation.' },
    { icon: '💊', title: 'Professional Assessment', desc: 'A clinical ADHD assessment can provide a formal diagnosis and treatment plan.' },
    { icon: '🧠', title: 'Cognitive Behavioral Therapy', desc: 'CBT is highly effective for managing ADHD symptoms.' },
    { icon: '📋', title: 'Structure Your Day', desc: 'Break tasks into small steps and follow a consistent daily routine.' },
    { icon: '🚫', title: 'Reduce Distractions', desc: 'Create a quiet, organized workspace to improve focus.' },
    { icon: '🤝', title: 'Support Groups', desc: 'Connecting with others who have ADHD can provide valuable coping strategies.' },
  ];
};

const DashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genSuccess, setGenSuccess] = useState('');

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/assessments/dashboard');
      setDashboard(response.data.dashboard);
    } catch (err) {
      setError('Failed to load dashboard. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    setError('');
    setGenSuccess('');
    try {
      const res = await api.post('/assessments/generate-report');
      setGenSuccess('Report generated successfully!');
      await fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report. Complete at least one test first.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="spinner" />
        <p style={{ color: '#64748B' }}>Loading dashboard...</p>
      </div>
    </AppLayout>
  );

  const { user, latestReport, recentScores, scoreHistory, completedTests } = dashboard || {};
  const age = user?.dob ? calculateAge(user.dob) : '—';
  const risk = latestReport ? getRisk(latestReport.final_score) : null;
  const recommendations = latestReport ? getRecommendations(latestReport.final_score) : [];
  const isHighRisk = latestReport?.risk_level === "High Risk";

  // Format chart data
  const chartData = scoreHistory?.reduce((acc, item) => {
    const dateStr = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.date === dateStr);
    if (existing) {
      existing[item.assessment_type] = Math.round(parseFloat(item.avg_score));
    } else {
      acc.push({ date: dateStr, [item.assessment_type]: Math.round(parseFloat(item.avg_score)) });
    }
    return acc;
  }, []) || [];

  return (
    <AppLayout>
      <div>
        {/* Header */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>Dashboard</h1>
            <p style={{ color: '#64748B' }}>Welcome back, <strong>{user?.full_name}</strong> 👋</p>
          </div>
          {(completedTests?.length || 0) > 0 && (
            <button onClick={handleGenerateReport} disabled={generating} className="btn btn-primary">
              {generating ? 'Generating...' : '📊 Generate ADHD Report'}
            </button>
          )}
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}
        {genSuccess && <div className="alert alert-success" style={{ marginBottom: '20px' }}>✅ {genSuccess}</div>}

        {/* User Info Cards */}
        <div className="grid grid-4" style={{ gap: '16px', marginBottom: '24px' }}>
          {[
            { icon: '👤', label: 'Name', value: user?.full_name },
            { icon: '🎂', label: 'Age', value: `${age} years`, big: true, color: '#4F46E5' },
            { icon: '⚧', label: 'Gender', value: user?.gender?.charAt(0).toUpperCase() + user?.gender?.slice(1) },
            { icon: '🧪', label: 'Tests Done', value: `${completedTests?.length || 0} / 9`, big: true, color: '#14B8A6' },
          ].map(({ icon, label, value, big, color }) => (
            <div key={label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
              <p style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</p>
              <p style={{ fontWeight: '800', fontSize: big ? '22px' : '15px', color: color || '#0F172A' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ADHD Score Card */}
        {latestReport ? (
          <>
            {/* Main Score */}
            <div className="card" style={{
              background: risk.gradient,
              color: 'white', border: 'none', marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <p style={{ opacity: 0.85, fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    Overall ADHD Score
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '72px', fontWeight: '900', lineHeight: 1 }}>
                      {Math.round(latestReport.final_score)}
                    </span>
                    <span style={{ fontSize: '24px', opacity: 0.7 }}>/100</span>
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(255,255,255,0.25)',
                    padding: '6px 18px', borderRadius: '100px'
                  }}>
                    <span style={{ fontSize: '18px' }}>{risk.icon}</span>
                    <span style={{ fontWeight: '800', fontSize: '16px' }}>{risk.level}</span>
                  </div>
                  <p style={{ opacity: 0.8, marginTop: '10px', fontSize: '14px' }}>{risk.text}</p>
                </div>

                {/* Score range guide */}
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '14px', padding: '16px 20px', minWidth: '200px' }}>
                  <p style={{ fontWeight: '700', marginBottom: '12px', fontSize: '13px', opacity: 0.9 }}>Score Ranges</p>
                  {[
                    { range: '80 – 100', label: 'Stable', color: '#86EFAC' },
                    { range: '60 – 79', label: 'Average', color: '#FDE68A' },
                    { range: '0 – 59', label: 'High Risk', color: '#FCA5A5' },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: r.color }} />
                        <span style={{ fontSize: '13px', opacity: 0.9 }}>{r.label}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', opacity: 0.9 }}>{r.range}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '16px' }}>📊 Score Breakdown</h3>
              <div className="grid grid-3" style={{ gap: '10px' }}>
                {[
                  ['📖 Story', latestReport.story_score],
                  ['🧩 Memory', latestReport.memory_score],
                  ['🔷 Pattern', latestReport.pattern_score],
                  ['⚡ Reaction', latestReport.reaction_score],
                  ['🚦 Go/No-Go', latestReport.gonogo_score],
                  ['🌈 Stroop', latestReport.stroop_score],
                  ['🔢 Sequence', latestReport.sequence_score],
                  ['🔍 Visual', latestReport.visual_search_score],
                  ['⏱️ CPT', latestReport.cpt_score],
                ].map(([label, sc]) => {
                  const s = sc !== null && sc !== undefined ? Math.round(parseFloat(sc)) : null;
                  const color = s === null ? '#94A3B8' : s >= 80 ? '#22C55E' : s >= 60 ? '#F59E0B' : '#EF4444';
                  return (
                    <div key={label} style={{
                      padding: '12px', background: '#F8FAFC', borderRadius: '10px',
                      border: `1px solid ${s !== null ? color + '40' : '#E2E8F0'}`
                    }}>
                      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '4px' }}>{label}</p>
                      <p style={{ fontSize: '20px', fontWeight: '800', color: color }}>
                        {s !== null ? `${s}/100` : '—'}
                      </p>
                      {s !== null && (
                        <div style={{ marginTop: '6px', height: '4px', background: '#E2E8F0', borderRadius: '100px' }}>
                          <div style={{ height: '100%', width: `${s}%`, background: color, borderRadius: '100px', transition: 'width 0.5s' }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Psychiatrist Alert — show if score <= 50 */}
            {isHighRisk && latestReport.psychiatrist_name && (
              <div className="card" style={{ marginBottom: '20px', background: '#FEF2F2', border: '2px solid #FECACA' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '40px', flexShrink: 0 }}>🚨</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: '#DC2626', fontWeight: '800', fontSize: '18px', marginBottom: '6px' }}>
                      High Risk Detected — Please Consult a Specialist
                    </h3>
                    <p style={{ color: '#7F1D1D', fontSize: '14px', marginBottom: '16px' }}>
                      Your score of <strong>{Math.round(latestReport.final_score)}/100</strong> indicates significant cognitive markers. We strongly recommend consulting a psychiatrist.
                    </p>

                    {/* Psychiatrist Table */}
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #FECACA', overflow: 'hidden' }}>
                      <div style={{
                        background: '#DC2626', color: 'white',
                        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px'
                      }}>
                        <span style={{ fontSize: '20px' }}>👨‍⚕️</span>
                        <h4 style={{ fontWeight: '700', fontSize: '16px', margin: 0 }}>Recommended Psychiatrist</h4>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#FEF2F2' }}>
                            {['Field', 'Details'].map(h => (
                              <th key={h} style={{
                                padding: '10px 20px', textAlign: 'left',
                                fontSize: '12px', fontWeight: '700',
                                color: '#DC2626', textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                borderBottom: '1px solid #FECACA'
                              }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { icon: '👤', field: 'Name', value: latestReport.psychiatrist_name },
                            { icon: '📧', field: 'Email', value: latestReport.psychiatrist_email },
                            { icon: '📞', field: 'Phone', value: latestReport.psychiatrist_phone },
                            { icon: '🏥', field: 'Expertise', value: 'ADHD & Cognitive Disorders' },
                            { icon: '📍', field: 'Clinic', value: latestReport.clinic_address },
                          ].map(({ icon, field, value }, i) => (
                            <tr key={field} style={{ background: i % 2 === 0 ? 'white' : '#FFF5F5' }}>
                              <td style={{
                                padding: '12px 20px',
                                borderBottom: '1px solid #FEE2E2',
                                fontWeight: '700', fontSize: '14px',
                                color: '#64748B', width: '140px'
                              }}>
                                <span style={{ marginRight: '8px' }}>{icon}</span>{field}
                              </td>
                              <td style={{
                                padding: '12px 20px',
                                borderBottom: '1px solid #FEE2E2',
                                fontSize: '14px', color: '#0F172A', fontWeight: '500'
                              }}>
                                {field === 'Email' ? (
                                  <a href={`mailto:${value}`} style={{ color: '#DC2626', textDecoration: 'none', fontWeight: '600' }}>{value}</a>
                                ) : field === 'Phone' ? (
                                  <a href={`tel:${value}`} style={{ color: '#DC2626', textDecoration: 'none', fontWeight: '600' }}>{value}</a>
                                ) : value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>
                💡 Recommendations
              </h3>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px' }}>
                Based on your score of {Math.round(latestReport.final_score)}/100
              </p>
              <div className="grid grid-2" style={{ gap: '12px' }}>
                {recommendations.map((rec, i) => (
                  <div key={i} style={{
                    padding: '16px', background: '#F8FAFC',
                    borderRadius: '12px', border: '1px solid #E2E8F0',
                    display: 'flex', gap: '12px', alignItems: 'flex-start'
                  }}>
                    <span style={{ fontSize: '28px', flexShrink: 0 }}>{rec.icon}</span>
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px', color: '#0F172A' }}>{rec.title}</p>
                      <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>{rec.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* No report yet */
          <div className="card" style={{ marginBottom: '24px', textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎯</div>
            <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>No ADHD Report Yet</h3>
            <p style={{ color: '#64748B', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
              Complete at least one assessment then click "Generate ADHD Report" to see your score and risk level.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/assessments" className="btn btn-primary btn-lg">Start Assessments →</Link>
            </div>
          </div>
        )}

        {/* Score History Chart */}
        {chartData.length > 0 && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>📈 Score History</h3>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>Your scores over the last 30 days</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0' }} />
                <Legend />
                <Line type="monotone" dataKey="story" name="Story" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="memory" name="Memory" stroke="#14B8A6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="reaction" name="Reaction" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="stroop" name="Stroop" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="gonogo" name="Go/No-Go" stroke="#22C55E" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Scores */}
        {recentScores?.length > 0 && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '16px' }}>🕒 Recent Assessments</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentScores.map((s, i) => {
                const sc = Math.round(parseFloat(s.score));
                const color = sc >= 80 ? '#22C55E' : sc >= 60 ? '#F59E0B' : '#EF4444';
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: '#F8FAFC', borderRadius: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>
                        {ASSESSMENT_CARDS.find(a => a.type === s.assessment_type)?.icon || '🧪'}
                      </span>
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '14px', textTransform: 'capitalize' }}>
                          {s.assessment_type.replace(/_/g, ' ')} Test
                        </p>
                        <p style={{ color: '#64748B', fontSize: '12px' }}>
                          {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '20px', fontWeight: '800', color }}>{sc}</span>
                      <span style={{ color: '#64748B', fontSize: '13px' }}>/100</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Assessment Grid */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700' }}>All Assessments</h3>
            {(completedTests?.length || 0) > 0 && (
              <button onClick={handleGenerateReport} disabled={generating} className="btn btn-primary btn-sm">
                {generating ? 'Generating...' : '📊 Generate Report'}
              </button>
            )}
          </div>
          <div className="grid grid-3" style={{ gap: '12px' }}>
            {ASSESSMENT_CARDS.map(card => {
              const isCompleted = completedTests?.includes(card.type);
              return (
                <Link key={card.type} to={card.path} style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '16px', borderRadius: '12px', textAlign: 'center',
                    border: `2px solid ${isCompleted ? '#14B8A6' : '#E2E8F0'}`,
                    background: isCompleted ? '#F0FDFA' : 'white',
                    cursor: 'pointer', transition: 'all 0.15s ease'
                  }} className="card-hover">
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{card.icon}</div>
                    <p style={{ fontWeight: '600', fontSize: '13px', color: '#0F172A' }}>{card.label}</p>
                    {isCompleted
                      ? <span style={{ display: 'inline-block', marginTop: '6px', background: '#F0FDFA', color: '#0D9488', fontSize: '11px', fontWeight: '700', padding: '2px 10px', borderRadius: '100px', border: '1px solid #99F6E4' }}>✓ Done</span>
                      : <span style={{ display: 'inline-block', marginTop: '6px', background: '#F1F5F9', color: '#94A3B8', fontSize: '11px', fontWeight: '600', padding: '2px 10px', borderRadius: '100px' }}>Not done</span>
                    }
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
