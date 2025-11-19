import { extractTextFromBuffer } from "../services/pdfService.js";
import { getEmbedding } from "../services/aiService.js";
import {
  rankBySimilarity,
  extractTopKeywords,
} from "../services/similarityService.js";
import Session from "../models/Session.js";

export const uploadResumes = async (req, res, next) => {
  const startTime = Date.now();

  try {
    if (!req.files?.length) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const { jobDescription, sessionName } = req.body;

    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({ message: "Job description is required" });
    }

    console.log(`Processing ${req.files.length} resumes for job description`);

    // Get job description embedding
    const jobEmbedding = await getEmbedding(jobDescription.trim());
    console.log(
      "Job embedding generated with dimensions:",
      jobEmbedding.length
    );

    // Process all resumes
    const resumePromises = req.files.map(async (file, index) => {
      const resumeStartTime = Date.now();

      try {
        console.log(
          `[${index + 1}/${req.files.length}] Processing resume: ${
            file.originalname
          }`
        );

        // Extract text from PDF
        const text = await extractTextFromBuffer(file.buffer);
        if (!text || text.trim().length === 0) {
          throw new Error(`No text extracted from ${file.originalname}`);
        }

        console.log(
          `Extracted ${text.length} characters from ${file.originalname}`
        );

        // Get resume embedding
        const embedding = await getEmbedding(text);

        // Extract matching keywords using the safe function
        const keywords = extractTopKeywords(jobDescription, text, 8);

        const processingTime = Date.now() - resumeStartTime;

        console.log(
          `Successfully processed ${file.originalname} in ${processingTime}ms`
        );

        return {
          originalName: file.originalname,
          text: text.substring(0, 2000), // Ensure text is stored
          embedding,
          keywords,
          fileSize: file.size,
          processingTime,
          status: "processed",
        };
      } catch (error) {
        console.error(`Error processing ${file.originalname}:`, error);

        return {
          originalName: file.originalname,
          text: "", // Store empty text instead of undefined
          embedding: [],
          keywords: [],
          score: 0,
          fileSize: file.size,
          status: "failed",
          error: error.message,
        };
      }
    });

    const resumes = await Promise.all(resumePromises);

    // Rank resumes with job description for enhanced scoring
    const rankedResumes = rankBySimilarity(
      jobEmbedding,
      resumes,
      jobDescription
    );
    console.log(`Ranked ${rankedResumes.length} resumes`);

    const totalProcessingTime = Date.now() - startTime;

    const successfulResumes = rankedResumes.filter(
      (r) => r.status === "processed"
    ).length;
    console.log(
      `Successfully processed ${successfulResumes}/${req.files.length} resumes in ${totalProcessingTime}ms`
    );

    // Create and save session
    const session = new Session({
      jobDescription: jobDescription.trim(),
      jobEmbedding,
      resumes: rankedResumes,
      totalFiles: req.files.length,
      successfulProcesses: successfulResumes,
      processingTime: totalProcessingTime,
      sessionName:
        sessionName?.trim() || `Session ${new Date().toLocaleString()}`,
      status: successfulResumes === 0 ? "failed" : "completed",
    });

    await session.save();

    res.status(201).json({
      sessionId: session._id,
      message: `Processed ${successfulResumes} resumes successfully`,
      totalResumes: req.files.length,
      successfulResumes: successfulResumes,
      failedResumes: rankedResumes.filter((r) => r.status === "failed").length,
      processingTime: totalProcessingTime,
      topMatches: rankedResumes
        .filter((r) => r.status === "processed")
        .slice(0, 5)
        .map((r) => ({
          name: r.originalName,
          score: r.score,
          keywords: r.keywords,
          keywordScore: r.keywordScore,
          semanticScore: r.semanticScore,
        })),
    });
  } catch (error) {
    console.error("Upload controller error:", error);
    next(error);
  }
};
