import Session from '../models/Session.js';

export const getSessionDetails = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    const session = await Session.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ 
        message: 'Session not found',
        sessionId 
      });
    }

    // Calculate statistics
    const processedResumes = session.resumes.filter(r => r.status === 'processed');
    const failedResumes = session.resumes.filter(r => r.status === 'failed');
    
    const topResumes = processedResumes
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(r => ({
        originalName: r.originalName,
        score: r.score,
        similarity: r.similarity,
        keywords: r.keywords || [],
        fileSize: r.fileSize,
        processingTime: r.processingTime
      }));

    // Strip embeddings and large text fields to keep payload small
    const resumes = session.resumes.map(r => ({
      originalName: r.originalName,
      score: r.score,
      similarity: r.similarity,
      keywords: r.keywords || [],
      status: r.status,
      error: r.error,
      fileSize: r.fileSize,
      processingTime: r.processingTime,
      text: r.text ? r.text.substring(0, 200) + '...' : '' // Preview only
    }));

    res.json({
      sessionId: session._id,
      sessionName: session.sessionName,
      jobDescription: session.jobDescription,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      statistics: {
        totalResumes: session.totalFiles,
        processed: processedResumes.length,
        failed: failedResumes.length,
        successRate: session.successRate,
        averageScore: processedResumes.length > 0 
          ? Math.round(processedResumes.reduce((sum, r) => sum + r.score, 0) / processedResumes.length)
          : 0,
        processingTime: session.processingTime
      },
      topMatches: topResumes,
      resumes,
      status: session.status
    });

  } catch (err) { 
    console.error('Error fetching session details:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid session ID format',
        sessionId: req.params.sessionId 
      });
    }
    
    next(err); 
  }
};

// Get all sessions (for dashboard)
export const getAllSessions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const sessions = await Session.find()
      .select('-jobEmbedding -resumes.embedding') // Exclude large fields
      .sort({ [sortBy]: sortOrder })
      .limit(limitNum * 1)
      .skip((pageNum - 1) * limitNum)
      .lean();

    const total = await Session.countDocuments();

    // Calculate summary for each session
    const sessionsWithSummary = sessions.map(session => {
      const processedResumes = session.resumes.filter(r => r.status === 'processed');
      const topScore = processedResumes.length > 0 
        ? Math.max(...processedResumes.map(r => r.score))
        : 0;

      return {
        ...session,
        summary: {
          totalResumes: session.totalFiles,
          processed: processedResumes.length,
          failed: session.resumes.filter(r => r.status === 'failed').length,
          topScore,
          averageScore: processedResumes.length > 0
            ? Math.round(processedResumes.reduce((sum, r) => sum + r.score, 0) / processedResumes.length)
            : 0
        }
      };
    });

    res.json({
      sessions: sessionsWithSummary,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      totalSessions: total
    });

  } catch (err) {
    console.error('Error fetching sessions:', err);
    next(err);
  }
};

// Get session analysis (detailed view for a specific session)
export const getSessionAnalysis = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const processedResumes = session.resumes.filter(r => r.status === 'processed');
    
    if (processedResumes.length === 0) {
      return res.json({
        sessionId: session._id,
        message: 'No successfully processed resumes in this session',
        analysis: null
      });
    }

    // Score distribution
    const scoreDistribution = {
      excellent: processedResumes.filter(r => r.score >= 90).length,
      good: processedResumes.filter(r => r.score >= 70 && r.score < 90).length,
      average: processedResumes.filter(r => r.score >= 50 && r.score < 70).length,
      poor: processedResumes.filter(r => r.score < 50).length
    };

    // Common keywords analysis
    const allKeywords = processedResumes.flatMap(r => r.keywords || []);
    const keywordFrequency = allKeywords.reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {});

    const topKeywords = Object.entries(keywordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    // Skills gap analysis (simplified)
    const jobKeywords = session.jobDescription.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const missingKeywords = jobKeywords.filter(jobWord => 
      !allKeywords.some(resumeWord => 
        resumeWord.toLowerCase().includes(jobWord.toLowerCase())
      )
    ).slice(0, 10);

    res.json({
      sessionId: session._id,
      sessionName: session.sessionName,
      analysis: {
        scoreDistribution,
        topKeywords,
        missingKeywords: [...new Set(missingKeywords)], // Remove duplicates
        averageScore: Math.round(processedResumes.reduce((sum, r) => sum + r.score, 0) / processedResumes.length),
        scoreRange: {
          min: Math.min(...processedResumes.map(r => r.score)),
          max: Math.max(...processedResumes.map(r => r.score))
        },
        processingStats: {
          totalTime: session.processingTime,
          avgTimePerResume: Math.round(session.processingTime / session.totalFiles)
        }
      }
    });

  } catch (err) {
    console.error('Error generating session analysis:', err);
    next(err);
  }
};

// Delete a session
export const deleteSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findByIdAndDelete(sessionId);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json({
      message: 'Session deleted successfully',
      deletedSession: {
        id: session._id,
        name: session.sessionName,
        createdAt: session.createdAt
      }
    });

  } catch (err) {
    console.error('Error deleting session:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid session ID format' });
    }
    
    next(err);
  }
};

// Get session statistics
export const getSessionStats = async (req, res, next) => {
  try {
    const stats = await Session.getStats();
    
    // Additional real-time stats
    const recentSessions = await Session.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('createdAt totalFiles successfulProcesses processingTime');

    res.json({
      overall: stats,
      recentActivity: {
        totalSessionsLast10: recentSessions.length,
        avgProcessingTime: recentSessions.reduce((sum, s) => sum + s.processingTime, 0) / recentSessions.length,
        successRate: recentSessions.reduce((sum, s) => sum + (s.successfulProcesses / s.totalFiles * 100), 0) / recentSessions.length
      }
    });

  } catch (err) {
    console.error('Error fetching session stats:', err);
    next(err);
  }
};