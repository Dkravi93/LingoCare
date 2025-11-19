import { extractTextFromBuffer } from '../services/pdfService.js';
import { getEmbedding } from '../services/aiService.js';
import { rankBySimilarity, extractTopKeywords } from '../services/similarityService.js';
import Session from '../models/Session.js';

export const uploadResumes = async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    if (!req.files?.length) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const { jobDescription, sessionName } = req.body;
    
    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({ message: 'Job description is required' });
    }
    // Get job description embedding
    const jobEmbedding = await getEmbedding(jobDescription.trim());

    // Process all resumes
    const resumePromises = req.files.map(async (file, index) => {
      const resumeStartTime = Date.now();
      
      try {
        // Extract text from PDF
        const text = await extractTextFromBuffer(file.buffer);
        if (!text || text.trim().length === 0) {
          throw new Error(`No text extracted from ${file.originalname}`);
        }
        // Get resume embedding
        const embedding = await getEmbedding(text);
        
        // Extract matching keywords
        const keywords = extractTopKeywords(jobDescription, text, 8);

        const processingTime = Date.now() - resumeStartTime;

        return {
          originalName: file.originalname,
          text: text.substring(0, 2000), // Store truncated text
          embedding,
          keywords,
          fileSize: file.size,
          processingTime,
          status: 'processed'
        };
      } catch (error) {
        return {
          originalName: file.originalname,
          text: '',
          embedding: [],
          keywords: [],
          score: 0,
          fileSize: file.size,
          status: 'failed',
          error: error.message
        };
      }
    });

    const resumes = await Promise.all(resumePromises);
    
    // Rank resumes - this will ALWAYS return an array now
    const rankedResumes = rankBySimilarity(jobEmbedding, resumes);

    const totalProcessingTime = Date.now() - startTime;

    const successfulResumes = rankedResumes.filter(r => r.status === 'processed').length;

    // Create and save session
    const session = new Session({
      jobDescription: jobDescription.trim(),
      jobEmbedding,
      resumes: rankedResumes,
      totalFiles: req.files.length,
      successfulProcesses: successfulResumes,
      processingTime: totalProcessingTime,
      sessionName: sessionName?.trim() || `Session ${new Date().toLocaleString()}`,
      status: successfulResumes === 0 ? 'failed' : 'completed'
    });

    await session.save();

    res.status(201).json({
      sessionId: session._id,
      message: `Processed ${successfulResumes} resumes successfully`,
      totalResumes: req.files.length,
      successfulResumes: successfulResumes,
      failedResumes: rankedResumes.filter(r => r.status === 'failed').length,
      processingTime: totalProcessingTime,
      topMatches: rankedResumes
        .filter(r => r.status === 'processed')
        .slice(0, 5)
        .map(r => ({
          name: r.originalName,
          score: r.score,
          keywords: r.keywords.slice(0, 3)
        }))
    });

  } catch (error) {
    next(error);
  }
};