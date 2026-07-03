// controllers/assessmentController.js

const db = require('../config/database');

// Story questions (correct answers never change)
const STORY_QUESTIONS = [
  {
    id: 1,
    question: "Why did Muhammad go outside?",
    correct: "He wanted to follow the man.",
    explanation: "Muhammad's curiosity got the better of him and he went outside to follow the mysterious man in the black cloak."
  },
  {
    id: 2,
    question: "Which event mainly marks the beginning of the mystery?",
    correct: "The sudden disappearance of the man wearing the black cloak.",
    explanation: "The mystery begins when the man in the black cloak suddenly disappears into the abandoned building."
  },
  {
    id: 3,
    question: "Why was the uncle surprised when he saw the key?",
    correct: "It had been lost many years ago.",
    explanation: "The uncle's face turned pale because the key had been lost many years ago and belonged to a chest with a family secret."
  },
  {
    id: 4,
    question: "Which can be inferred from the story?",
    correct: "The mysterious man may have some connection to the key.",
    explanation: "Since the man led Muhammad to exactly where the key was, it can be inferred that the man has some connection to the key."
  },
  {
    id: 5,
    question: "Why does the ending create curiosity?",
    correct: "No explanation is given for the identity of the man or the mystery of the key.",
    explanation: "The story ends without revealing who the man was or how the key ended up there, leaving the reader curious."
  }
];

// Helper: clamp score between 0 and 100
const clamp = (val) => Math.min(100, Math.max(0, Math.round(val)));

// ============================================================
// STORY TEST — score out of 10, normalized to 100
// ============================================================
const saveStoryTest = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { answers, completion_time } = req.body;

    let correctCount = 0;
    const processedAnswers = [];

    for (const answer of answers) {
      const question = STORY_QUESTIONS.find(q => q.id === answer.question_id);
      if (!question) continue;
      const isCorrect = answer.selected_answer === question.correct;
      if (isCorrect) correctCount++;
      processedAnswers.push({
        question_id: answer.question_id,
        selected_answer: answer.selected_answer,
        correct_answer: question.correct,
        is_correct: isCorrect,
        time_spent: answer.time_spent || 0,
        explanation: question.explanation
      });
    }

    // Score out of 10 (2 pts per question x 5 questions)
    const rawScore = correctCount * 2;

    // Normalize to 100
    const normalizedScore = clamp((rawScore / 10) * 100);

    let level = 'Poor Comprehension';
    if (rawScore >= 10) level = 'Excellent Comprehension';
    else if (rawScore >= 8) level = 'Very Good Comprehension';
    else if (rawScore >= 4) level = 'Good Comprehension';

    const [prevAttempts] = await db.query(
      'SELECT COUNT(*) as count FROM story_results WHERE user_id = ?', [userId]
    );
    const attemptNo = prevAttempts[0].count + 1;

    const [result] = await db.query(
      'INSERT INTO story_results (user_id, attempt_no, score, level, completion_time) VALUES (?, ?, ?, ?, ?)',
      [userId, attemptNo, rawScore, level, completion_time]
    );

    for (const ans of processedAnswers) {
      await db.query(
        'INSERT INTO story_answers (result_id, question_id, selected_answer, correct_answer, is_correct, time_spent) VALUES (?, ?, ?, ?, ?, ?)',
        [result.insertId, ans.question_id, ans.selected_answer, ans.correct_answer, ans.is_correct, ans.time_spent]
      );
    }

    // Save normalized score (0-100) to assessments table
    await db.query(
      'INSERT INTO assessments (user_id, assessment_type, score, max_score, completion_time) VALUES (?, ?, ?, ?, ?)',
      [userId, 'story', normalizedScore, 100, completion_time]
    );

    return res.status(200).json({
      success: true,
      message: 'Story test saved!',
      result: { score: rawScore, normalizedScore, level, attemptNo, answers: processedAnswers }
    });
  } catch (error) {
    console.error('Story test error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save story test.' });
  }
};

// ============================================================
// MEMORY TEST — frontend sends score already 0-100
// ============================================================
const saveMemoryTest = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { score, max_level_reached, completion_time } = req.body;

    if (score === undefined || score < 0) {
      return res.status(400).json({ success: false, message: 'Invalid score.' });
    }

    const finalScore = clamp(score);

    await db.query(
      'INSERT INTO memory_game_results (user_id, score, max_level_reached, completion_time) VALUES (?, ?, ?, ?)',
      [userId, finalScore, max_level_reached || 1, completion_time || 0]
    );

    await db.query(
      'INSERT INTO assessments (user_id, assessment_type, score, max_score, completion_time) VALUES (?, ?, ?, ?, ?)',
      [userId, 'memory', finalScore, 100, completion_time]
    );

    return res.status(200).json({ success: true, message: 'Memory test saved!', score: finalScore });
  } catch (error) {
    console.error('Memory test error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save memory test.' });
  }
};

// ============================================================
// PATTERN TEST — score out of 100 (10 pts per correct answer)
// ============================================================
const savePatternTest = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { score, correct_answers, total_questions, pattern_used, completion_time } = req.body;

    const finalScore = clamp(score);

    await db.query(
      'INSERT INTO pattern_results (user_id, score, pattern_used, total_questions, correct_answers, completion_time) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, finalScore, JSON.stringify(pattern_used || []), total_questions || 10, correct_answers || 0, completion_time || 0]
    );

    await db.query(
      'INSERT INTO assessments (user_id, assessment_type, score, max_score, completion_time) VALUES (?, ?, ?, ?, ?)',
      [userId, 'pattern', finalScore, 100, completion_time]
    );

    return res.status(200).json({ success: true, message: 'Pattern test saved!', score: finalScore });
  } catch (error) {
    console.error('Pattern test error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save pattern test.' });
  }
};

// ============================================================
// REACTION TEST — score 0-100 based on avg reaction time
// ============================================================
const saveReactionTest = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { avg_reaction_time, score, total_attempts } = req.body;

    const finalScore = clamp(score);

    await db.query(
      'INSERT INTO reaction_results (user_id, avg_reaction_time, score, total_attempts) VALUES (?, ?, ?, ?)',
      [userId, avg_reaction_time, finalScore, total_attempts || 7]
    );

    await db.query(
      'INSERT INTO assessments (user_id, assessment_type, score, max_score) VALUES (?, ?, ?, ?)',
      [userId, 'reaction', finalScore, 100]
    );

    return res.status(200).json({ success: true, message: 'Reaction test saved!', score: finalScore });
  } catch (error) {
    console.error('Reaction test error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save reaction test.' });
  }
};

// ============================================================
// GO/NO-GO TEST — accuracy based, clamped 0-100
// ============================================================
const saveGoNoGoTest = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { correct_go, correct_nogo, false_alarms, misses, score, completion_time } = req.body;

    const finalScore = clamp(score);

    await db.query(
      'INSERT INTO gonogo_results (user_id, correct_go, correct_nogo, false_alarms, misses, score, completion_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, correct_go || 0, correct_nogo || 0, false_alarms || 0, misses || 0, finalScore, completion_time || 0]
    );

    await db.query(
      'INSERT INTO assessments (user_id, assessment_type, score, max_score, completion_time) VALUES (?, ?, ?, ?, ?)',
      [userId, 'gonogo', finalScore, 100, completion_time]
    );

    return res.status(200).json({ success: true, message: 'Go/No-Go test saved!', score: finalScore });
  } catch (error) {
    console.error('Go/No-Go test error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save test.' });
  }
};

// ============================================================
// STROOP TEST — accuracy + speed based, 0-100
// ============================================================
const saveStroopTest = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { correct_answers, total_questions, avg_response_time, score, completion_time } = req.body;

    const finalScore = clamp(score);

    await db.query(
      'INSERT INTO stroop_results (user_id, correct_answers, total_questions, avg_response_time, score, completion_time) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, correct_answers || 0, total_questions || 20, avg_response_time || 0, finalScore, completion_time || 0]
    );

    await db.query(
      'INSERT INTO assessments (user_id, assessment_type, score, max_score, completion_time) VALUES (?, ?, ?, ?, ?)',
      [userId, 'stroop', finalScore, 100, completion_time]
    );

    return res.status(200).json({ success: true, message: 'Stroop test saved!', score: finalScore });
  } catch (error) {
    console.error('Stroop test error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save Stroop test.' });
  }
};

// ============================================================
// SEQUENCE TEST — level based, 0-100
// ============================================================
const saveSequenceTest = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { max_sequence_length, score, completion_time } = req.body;

    const finalScore = clamp(score);

    await db.query(
      'INSERT INTO sequence_results (user_id, max_sequence_length, score, completion_time) VALUES (?, ?, ?, ?)',
      [userId, max_sequence_length || 0, finalScore, completion_time || 0]
    );

    await db.query(
      'INSERT INTO assessments (user_id, assessment_type, score, max_score, completion_time) VALUES (?, ?, ?, ?, ?)',
      [userId, 'sequence', finalScore, 100, completion_time]
    );

    return res.status(200).json({ success: true, message: 'Sequence test saved!', score: finalScore });
  } catch (error) {
    console.error('Sequence test error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save sequence test.' });
  }
};

// ============================================================
// VISUAL SEARCH TEST — accuracy + speed, 0-100
// ============================================================
const saveVisualSearchTest = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { correct_finds, total_targets, avg_search_time, score, completion_time } = req.body;

    const finalScore = clamp(score);

    await db.query(
      'INSERT INTO visual_search_results (user_id, correct_finds, total_targets, avg_search_time, score, completion_time) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, correct_finds || 0, total_targets || 10, avg_search_time || 0, finalScore, completion_time || 0]
    );

    await db.query(
      'INSERT INTO assessments (user_id, assessment_type, score, max_score, completion_time) VALUES (?, ?, ?, ?, ?)',
      [userId, 'visual_search', finalScore, 100, completion_time]
    );

    return res.status(200).json({ success: true, message: 'Visual search test saved!', score: finalScore });
  } catch (error) {
    console.error('Visual search error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save visual search test.' });
  }
};

// ============================================================
// CPT TEST — hit rate based, 0-100
// ============================================================
const saveCPTTest = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { hits, misses, false_alarms, hit_rate, score, completion_time } = req.body;

    const finalScore = clamp(score);

    await db.query(
      'INSERT INTO cpt_results (user_id, hits, misses, false_alarms, hit_rate, score, completion_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, hits || 0, misses || 0, false_alarms || 0, hit_rate || 0, finalScore, completion_time || 0]
    );

    await db.query(
      'INSERT INTO assessments (user_id, assessment_type, score, max_score, completion_time) VALUES (?, ?, ?, ?, ?)',
      [userId, 'cpt', finalScore, 100, completion_time]
    );

    return res.status(200).json({ success: true, message: 'CPT test saved!', score: finalScore });
  } catch (error) {
    console.error('CPT test error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save CPT test.' });
  }
};

// ============================================================
// DASHBOARD
// ============================================================
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [users] = await db.query(
      'SELECT user_id, full_name, email, dob, gender FROM users WHERE user_id = ?', [userId]
    );
    if (!users.length) return res.status(404).json({ success: false, message: 'User not found.' });
    const user = users[0];

    const today = new Date();
    const birthDate = new Date(user.dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

    const [reports] = await db.query(
      'SELECT * FROM adhd_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId]
    );

    // If High Risk but missing psychiatrist data, fetch and save one
    if (reports.length > 0 && reports[0].risk_level === 'High Risk' && !reports[0].psychiatrist_name) {
      const [psychiatrists] = await db.query('SELECT * FROM psychiatrists ORDER BY RAND() LIMIT 1');
      if (psychiatrists.length > 0) {
        const p = psychiatrists[0];
        reports[0].psychiatrist_name = p.name;
        reports[0].psychiatrist_phone = p.phone;
        reports[0].psychiatrist_email = p.email;
        reports[0].clinic_address = p.clinic_name + ', ' + p.address;
        await db.query(
          'UPDATE adhd_reports SET psychiatrist_name=?, psychiatrist_phone=?, psychiatrist_email=?, clinic_address=? WHERE report_id=?',
          [p.name, p.phone, p.email, p.clinic_name + ', ' + p.address, reports[0].report_id]
        );
      }
    }

    const [recentScores] = await db.query(
      'SELECT assessment_type, score, completion_time, created_at FROM assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    const [scoreHistory] = await db.query(
      `SELECT DATE(created_at) as date, assessment_type, AVG(score) as avg_score
       FROM assessments WHERE user_id = ?
       AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at), assessment_type ORDER BY date ASC`,
      [userId]
    );

    const [completedTypes] = await db.query(
      'SELECT DISTINCT assessment_type FROM assessments WHERE user_id = ?', [userId]
    );

    return res.status(200).json({
      success: true,
      dashboard: {
        user: { ...user, age },
        latestReport: reports[0] || null,
        recentScores,
        scoreHistory,
        completedTests: completedTypes.map(t => t.assessment_type)
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
};

// ============================================================
// HISTORY
// ============================================================
const getHistory = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const [history] = await db.query(
      'SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [userId]
    );
    const [reports] = await db.query(
      'SELECT * FROM adhd_reports WHERE user_id = ? ORDER BY created_at DESC', [userId]
    );
    return res.status(200).json({ success: true, history, reports });
  } catch (error) {
    console.error('History error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load history.' });
  }
};

// ============================================================
// GENERATE ADHD REPORT — all scores already 0-100
// ============================================================
const generateReport = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const assessmentTypes = ['story', 'memory', 'pattern', 'reaction', 'gonogo', 'stroop', 'sequence', 'visual_search', 'cpt'];
    const scores = {};

    for (const type of assessmentTypes) {
      const [results] = await db.query(
        'SELECT score FROM assessments WHERE user_id = ? AND assessment_type = ? ORDER BY created_at DESC LIMIT 1',
        [userId, type]
      );
      scores[type] = results.length > 0 ? parseFloat(results[0].score) : null;
    }

    const availableScores = Object.values(scores).filter(s => s !== null);

    if (availableScores.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No assessments completed yet. Please complete at least one test.'
      });
    }

    // All scores are 0-100, simple average
    const finalScore = clamp(
      availableScores.reduce((sum, s) => sum + s, 0) / availableScores.length
    );

    // Risk level — 80+ Stable, 60-79 Average, below 60 High Risk
    let riskLevel = 'High Risk';
    if (finalScore >= 80) riskLevel = 'Stable';
    else if (finalScore >= 60) riskLevel = 'Average';

    // Psychiatrist info shown when score is 50 or below
    let psychiatristInfo = {
      psychiatrist_name: null,
      psychiatrist_phone: null,
      psychiatrist_email: null,
      clinic_address: null
    };

    if (finalScore <= 50) {
      const [psychiatrists] = await db.query('SELECT * FROM psychiatrists ORDER BY RAND() LIMIT 1');
      if (psychiatrists.length > 0) {
        const p = psychiatrists[0];
        psychiatristInfo = {
          psychiatrist_name: p.name,
          psychiatrist_phone: p.phone,
          psychiatrist_email: p.email,
          clinic_address: `${p.clinic_name}, ${p.address}`
        };
      }
    }

    const [report] = await db.query(
      `INSERT INTO adhd_reports (user_id, final_score, risk_level,
        story_score, memory_score, pattern_score, reaction_score,
        gonogo_score, stroop_score, sequence_score, visual_search_score, cpt_score,
        psychiatrist_name, psychiatrist_phone, psychiatrist_email, clinic_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, finalScore, riskLevel,
        scores.story, scores.memory, scores.pattern,
        scores.reaction, scores.gonogo, scores.stroop,
        scores.sequence, scores.visual_search, scores.cpt,
        psychiatristInfo.psychiatrist_name,
        psychiatristInfo.psychiatrist_phone,
        psychiatristInfo.psychiatrist_email,
        psychiatristInfo.clinic_address
      ]
    );

    const [savedReport] = await db.query(
      'SELECT * FROM adhd_reports WHERE report_id = ?', [report.insertId]
    );

    return res.status(200).json({
      success: true,
      message: 'ADHD report generated!',
      report: savedReport[0]
    });

  } catch (error) {
    console.error('Generate report error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate report.' });
  }
};

module.exports = {
  saveStoryTest, saveMemoryTest, savePatternTest, saveReactionTest,
  saveGoNoGoTest, saveStroopTest, saveSequenceTest, saveVisualSearchTest,
  saveCPTTest, getDashboard, getHistory, generateReport
};
