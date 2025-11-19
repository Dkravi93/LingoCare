import advancedKeywordExtract from "../utils/keywordExtractor.js";
const simpleKeywordExtract = (jobText, resumeText, topN = 5) => {
  try {
    if (!resumeText || !jobText) {
      return [];
    }

    const jobWords = jobText.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];

    const resumeWords = resumeText.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];

    const commonKeywords = [
      ...new Set(resumeWords.filter((word) => jobWords.includes(word))),
    ].slice(0, topN);

    return commonKeywords;
  } catch (error) {
    console.error("Error in simple keyword extraction:", error);
    return [];
  }
};

// Robust cosine similarity calculation
export const cosineSimilarity = (vecA, vecB) => {
  try {
    if (!vecA || !vecB || !Array.isArray(vecA) || !Array.isArray(vecB)) {
      return 0;
    }

    const minLength = Math.min(vecA.length, vecB.length);

    if (minLength === 0) {
      return 0;
    }

    const vecASlice = vecA.slice(0, minLength);
    const vecBSlice = vecB.slice(0, minLength);

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < minLength; i++) {
      dotProduct += vecASlice[i] * vecBSlice[i];
      magnitudeA += vecASlice[i] * vecASlice[i];
      magnitudeB += vecBSlice[i] * vecBSlice[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    let similarity = dotProduct / (magnitudeA * magnitudeB);
    similarity = Math.max(0, Math.min(1, similarity));

    return isFinite(similarity) ? similarity : 0;
  } catch (error) {
    console.error("Error in cosine similarity:", error);
    return 0;
  }
};

// Enhanced keyword match score calculation with multiple strategies
const calculateKeywordScore = (
  jobDescription,
  resumeText,
  strategy = "advanced"
) => {
  try {
    if (
      !resumeText ||
      typeof resumeText !== "string" ||
      resumeText.trim().length === 0
    ) {
      console.warn("Invalid resume text for keyword scoring");
      return 0;
    }

    if (
      !jobDescription ||
      typeof jobDescription !== "string" ||
      jobDescription.trim().length === 0
    ) {
      console.warn("Invalid job description for keyword scoring");
      return 0;
    }

    let matchingKeywords = [];

    // Choose extraction strategy
    switch (strategy) {
      case "advanced":
        matchingKeywords = advancedKeywordExtract(
          jobDescription,
          resumeText,
          20
        );
        break;
      case "simple":
        matchingKeywords = simpleKeywordExtract(jobDescription, resumeText, 20);
        break;
      default:
        matchingKeywords = extractTopKeywords(jobDescription, resumeText, 20);
    }

    // Calculate score based on keyword matches
    const jobWords = jobDescription
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3)
      .filter(
        (word) =>
          ![
            "with",
            "this",
            "that",
            "have",
            "from",
            "will",
            "your",
            "their",
            "which",
            "should",
            "would",
            "could",
            "about",
            "after",
            "before",
          ].includes(word)
      );

    const uniqueJobWords = [...new Set(jobWords)];

    // Simple score based on matched keywords
    const score =
      (matchingKeywords.length / Math.max(uniqueJobWords.length, 1)) * 100;

    return Math.min(Math.round(score), 100);
  } catch (error) {
    console.error("Error in keyword score calculation:", error);
    return calculateSafeKeywordScore(jobDescription, resumeText); // Fallback
  }
};

// Fallback safe keyword scoring (original logic)
const calculateSafeKeywordScore = (jobDescription, resumeText) => {
  try {
    const jobWords = jobDescription
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3)
      .filter(
        (word) =>
          ![
            "with",
            "this",
            "that",
            "have",
            "from",
            "will",
            "your",
            "their",
          ].includes(word)
      );

    const resumeWords = resumeText
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3);

    const jobWordSet = new Set(jobWords);
    const matchingWords = resumeWords.filter((word) => jobWordSet.has(word));

    const score = (matchingWords.length / Math.max(jobWordSet.size, 1)) * 100;
    return Math.min(score, 100);
  } catch (error) {
    console.error("Error in safe keyword score calculation:", error);
    return 0;
  }
};

// Enhanced ranking with multiple strategies
export const rankBySimilarity = (
  jobEmbedding,
  resumes,
  jobDescription,
  options = {}
) => {
  try {
    console.log("Ranking resumes with enhanced algorithm...");
    console.log("Job description provided:", !!jobDescription);
    console.log("Job description length:", jobDescription?.length);
    console.log("Number of resumes:", resumes?.length);

    const {
      keywordStrategy = "advanced",
      semanticWeight = 0.7,
      keywordWeight = 0.3,
      minScore = 10,
    } = options;

    if (!jobEmbedding || !resumes || !Array.isArray(resumes)) {
      console.warn("Invalid inputs to rankBySimilarity");
      return [];
    }

    // Filter out invalid resumes
    const validResumes = resumes.filter((resume) => {
      const hasEmbedding =
        resume &&
        resume.embedding &&
        Array.isArray(resume.embedding) &&
        resume.embedding.length > 0;
      const hasText =
        resume &&
        resume.text &&
        typeof resume.text === "string" &&
        resume.text.trim().length > 0;

      return hasEmbedding && hasText;
    });

    console.log(`Valid resumes for ranking: ${validResumes.length}`);

    const scoredResumes = validResumes.map((resume) => {
      try {
        // Calculate semantic similarity
        const semanticSimilarity = cosineSimilarity(
          jobEmbedding,
          resume.embedding
        );
        const semanticScore = Math.round(semanticSimilarity * 100);

        // Calculate keyword match score with strategy
        let keywordScore = 0;
        let extractedKeywords = [];

        if (
          jobDescription &&
          typeof jobDescription === "string" &&
          jobDescription.trim().length > 0
        ) {
          keywordScore = calculateKeywordScore(
            jobDescription,
            resume.text,
            keywordStrategy
          );

          // Extract keywords for display
          extractedKeywords = extractTopKeywords(
            jobDescription,
            resume.text,
            8
          );
        } else {
          console.warn("No valid job description provided for keyword scoring");
          keywordScore = 0;
        }

        // Use weighted combination
        const adjustedSemanticWeight = jobDescription ? semanticWeight : 0.9;
        const adjustedKeywordWeight = jobDescription ? keywordWeight : 0.1;

        const weightedScore = Math.round(
          semanticScore * adjustedSemanticWeight +
            keywordScore * adjustedKeywordWeight
        );

        // Ensure minimum score
        const finalScore = Math.max(weightedScore, minScore);

        console.log(
          `Resume ${resume.originalName}: semantic=${semanticScore}%, keyword=${keywordScore}%, final=${finalScore}%`
        );
        console.log("III", extractedKeywords);

        return {
          ...resume,
          keyword: extractedKeywords,
          score: finalScore,
          originalName: resume.originalName,
          similarity: semanticSimilarity,
          keywordScore: keywordScore,
          semanticScore: semanticScore,
          matchingKeywords: extractedKeywords, // Add extracted keywords
          ranking: 0, // Will be set after sorting
        };
      } catch (error) {
        console.error(`Error processing resume ${resume.originalName}:`, error);
        return {
          ...resume,
          score: minScore,
          originalName: resume.originalName,
          similarity: 0.15,
          keywordScore: 0,
          semanticScore: 0,
          matchingKeywords: [],
          error: error.message,
          ranking: 0,
        };
      }
    });

    // Handle resumes that were filtered out
    const invalidResumes = resumes
      .filter((resume) => {
        const hasEmbedding =
          resume &&
          resume.embedding &&
          Array.isArray(resume.embedding) &&
          resume.embedding.length > 0;
        const hasText =
          resume &&
          resume.text &&
          typeof resume.text === "string" &&
          resume.text.trim().length > 0;
        return !hasEmbedding || !hasText;
      })
      .map((resume) => ({
        ...resume,
        score: 5,
        similarity: 0.05,
        originalName: resume.originalName,
        keywordScore: 0,
        semanticScore: 0,
        matchingKeywords: [],
        error: "Invalid resume data",
        ranking: 0,
      }));

    // Combine valid and invalid resumes
    const allResumes = [...scoredResumes, ...invalidResumes];

    // Sort by score descending and add ranking
    const ranked = allResumes
      .filter((resume) => resume !== null && resume !== undefined)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((resume, index) => ({
        ...resume,
        ranking: index + 1,
      }));

    console.log(`Successfully ranked ${ranked.length} resumes`);

    return ranked;
  } catch (error) {
    console.error("Error in rankBySimilarity:", error);
    return resumes.map((resume, index) => ({
      ...resume,
      score: 10,
      originalName: resume.originalName,
      similarity: 0.1,
      keywordScore: 0,
      semanticScore: 0,
      matchingKeywords: [],
      error: "Ranking failed",
      ranking: index + 1,
    }));
  }
};

// Enhanced keyword extraction with multiple fallbacks
export const extractTopKeywords = (jobText, resumeText, topN = 8) => {
  try {
    if (!resumeText || !jobText) {
      return [];
    }

    // Try advanced extraction first
    let keywords = [];
    try {
      keywords = advancedKeywordExtract(jobText, resumeText, topN);
      if (keywords.length > 0) {
        return keywords;
      }
    } catch (error) {
      console.warn(
        "Advanced keyword extraction failed, falling back to simple method"
      );
    }

    // Fallback to simple extraction
    try {
      keywords = simpleKeywordExtract(jobText, resumeText, topN);
      if (keywords.length > 0) {
        return keywords;
      }
    } catch (error) {
      console.warn("Simple keyword extraction failed, using basic method");
    }

    // Final fallback - basic word matching
    const jobWords = jobText
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3)
      .filter(
        (word) =>
          ![
            "with",
            "this",
            "that",
            "have",
            "from",
            "will",
            "your",
            "their",
            "which",
            "should",
            "would",
            "could",
            "about",
            "after",
            "before",
          ].includes(word)
      );

    const resumeWords = resumeText
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3);

    const jobWordSet = new Set(jobWords);
    const matchingKeywords = resumeWords.filter((word) => jobWordSet.has(word));

    const uniqueKeywords = [...new Set(matchingKeywords)];

    return uniqueKeywords.slice(0, topN);
  } catch (error) {
    console.error("Error in keyword extraction:", error);
    return [];
  }
};

export default {
  cosineSimilarity,
  rankBySimilarity,
  extractTopKeywords,
  calculateKeywordScore,
};
