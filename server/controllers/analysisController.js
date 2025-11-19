import Session from '../models/Session.js';
import { rankBySimilarity } from '../services/similarityService.js';

export const analyseSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const ranked = rankBySimilarity(session.jobEmbedding, session.resumes);

    // store back ranked list with scores
    session.resumes = ranked;
    await session.save();

    // lightweight response
    const summary = ranked.map((r, idx) => ({
      rank: idx + 1,
      name: r.originalName,
      score: r.score
    }));

    res.json({ summary });
  } catch (err) { next(err); }
};