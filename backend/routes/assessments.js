// routes/assessments.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  saveStoryTest, saveMemoryTest, savePatternTest, saveReactionTest,
  saveGoNoGoTest, saveStroopTest, saveSequenceTest, saveVisualSearchTest,
  saveCPTTest, getDashboard, getHistory, generateReport
} = require('../controllers/assessmentController');

// All assessment routes require JWT authentication
router.post('/story-test', authMiddleware, saveStoryTest);
router.post('/memory-test', authMiddleware, saveMemoryTest);
router.post('/pattern-test', authMiddleware, savePatternTest);
router.post('/reaction-test', authMiddleware, saveReactionTest);
router.post('/go-no-go-test', authMiddleware, saveGoNoGoTest);
router.post('/stroop-test', authMiddleware, saveStroopTest);
router.post('/sequence-recall-test', authMiddleware, saveSequenceTest);
router.post('/visual-search-test', authMiddleware, saveVisualSearchTest);
router.post('/continuous-performance-test', authMiddleware, saveCPTTest);

// Report routes
router.get('/dashboard', authMiddleware, getDashboard);
router.get('/history', authMiddleware, getHistory);
router.post('/generate-report', authMiddleware, generateReport);

module.exports = router;
