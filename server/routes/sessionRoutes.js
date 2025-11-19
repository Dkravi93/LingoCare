import express from 'express';
import {
  getSessionDetails,
  getAllSessions,
  getSessionAnalysis,
  deleteSession,
  getSessionStats
} from '../controllers/sessionController.js';

const router = express.Router();

// Session routes
router.get('/', getAllSessions);
router.get('/stats', getSessionStats);
router.get('/:sessionId', getSessionDetails);
router.get('/:sessionId/analysis', getSessionAnalysis);
router.delete('/:sessionId', deleteSession);

export default router;