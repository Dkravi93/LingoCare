import express from 'express';
import { analyseSession } from '../controllers/analysisController.js';

const router = express.Router();

router.get('/:sessionId', analyseSession);

export default router;