import Session from "../models/Session.js";
import { rankBySimilarity } from "../services/similarityService.js";

export const analyseSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    console.log(`Analyzing session: ${sessionId}`);

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    console.log(
      "Session found, job description:",
      session.jobDescription?.substring(0, 100) + "..."
    );

    // Re-rank the resumes with the stored job description
    const rankedResumes = rankBySimilarity(
      session.jobEmbedding,
      session.resumes,
      session.jobDescription
    );

    // Prepare response data (strip embeddings for smaller payload)
    const responseData = {
      sessionId: session._id,
      jobDescription: session.jobDescription,
      createdAt: session.createdAt,
      totalResumes: session.totalFiles,
      successfulResumes: session.successfulProcesses,
      resumes: rankedResumes.map((resume) => ({
        originalName: resume.originalName,
        score: resume.score,
        keywords: resume.keyword || [],
        status: resume.status,
        keywordScore: resume.keywordScore,
        semanticScore: resume.semanticScore,
      })),
    };

    res.json(responseData);
  } catch (err) {
    console.error("Analysis controller error:", err);
    next(err);
  }
};
