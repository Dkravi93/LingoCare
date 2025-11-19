// Robust cosine similarity calculation
export const cosineSimilarity = (vecA, vecB) => {
  try {
    if (!vecA || !vecB || !Array.isArray(vecA) || !Array.isArray(vecB)) {
      console.warn('Invalid vectors provided to cosineSimilarity');
      return 0;
    }

    // Handle different vector lengths by using the minimum length
    const minLength = Math.min(vecA.length, vecB.length);
    
    if (minLength === 0) {
      console.warn('One or both vectors are empty');
      return 0;
    }

    const vecASlice = vecA.slice(0, minLength);
    const vecBSlice = vecB.slice(0, minLength);

    // Calculate dot product
    let dotProduct = 0;
    for (let i = 0; i < minLength; i++) {
      dotProduct += vecASlice[i] * vecBSlice[i];
    }

    // Calculate magnitudes
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < minLength; i++) {
      magnitudeA += vecASlice[i] * vecASlice[i];
      magnitudeB += vecBSlice[i] * vecBSlice[i];
    }
    
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    // Avoid division by zero
    if (magnitudeA === 0 || magnitudeB === 0) {
      console.warn('Zero magnitude vector detected');
      return 0;
    }

    // Calculate similarity and ensure it's between 0 and 1
    let similarity = dotProduct / (magnitudeA * magnitudeB);
    
    // Clamp the value between 0 and 1 to prevent unrealistic scores
    similarity = Math.max(0, Math.min(1, similarity));
    
    // Additional check for NaN or Infinity
    if (!isFinite(similarity)) {
      console.warn('Invalid similarity value:', similarity);
      return 0;
    }

    return similarity;

  } catch (error) {
    console.error('Error in cosine similarity calculation:', error);
    return 0;
  }
};

// Fixed rankBySimilarity function with proper scoring
export const rankBySimilarity = (jobEmbedding, resumes) => {
  try {
    if (!jobEmbedding || !resumes || !Array.isArray(resumes)) {
      console.warn('Invalid inputs to rankBySimilarity');
      return [];
    }

    // Filter out invalid resumes first
    const validResumes = resumes.filter(resume => {
      const isValid = resume && 
                     resume.embedding && 
                     Array.isArray(resume.embedding) && 
                     resume.embedding.length > 0;
      
      if (!isValid) {
        console.warn(`Invalid resume skipped: ${resume?.originalName || 'unknown'}`);
      }
      
      return isValid;
    });

    const scoredResumes = validResumes.map(resume => {
      try {
        const similarity = cosineSimilarity(jobEmbedding, resume.embedding);
        
        // Convert to percentage (0-100) and round to 2 decimal places
        const score = Math.round(similarity * 100 * 100) / 100; // Round to 2 decimal places
      
        return {
          ...resume,
          score: score,
          originalName: resume.originalName,
          similarity: similarity
        };
      } catch (error) {
        return {
          ...resume,
          score: 0,
          similarity: 0,
          error: error.message
        };
      }
    });

    // Sort by score descending, ensure we always return an array
    const ranked = scoredResumes
      .filter(resume => resume !== null && resume !== undefined)
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    return ranked;

  } catch (error) {
    return []; // Always return an array, even on error
  }
};

// Enhanced keyword extraction with better matching
export const extractTopKeywords = (jobText, resumeText, topN = 8) => {
  try {
    const commonTechTerms = [
      'react', 'javascript', 'typescript', 'node', 'python', 'java', 'html', 'css',
      'mongodb', 'sql', 'aws', 'docker', 'kubernetes', 'git', 'rest', 'api',
      'frontend', 'backend', 'fullstack', 'devops', 'agile', 'scrum',
      'angular', 'vue', 'express', 'nestjs', 'spring', 'django', 'flask',
      'postgresql', 'mysql', 'redis', 'graphql', 'jest', 'testing', 'ci', 'cd',
      'redux', 'webpack', 'babel', 'sass', 'less', 'bootstrap', 'tailwind',
      'materialui', 'firebase', 'heroku', 'linux', 'windows', 'macos'
    ];

    // Extract words from job description
    const jobWords = jobText.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2)
      .map(word => word.replace(/[^a-z]/g, '')); // Clean the words

    // Extract words from resume
    const resumeWords = resumeText.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2)
      .map(word => word.replace(/[^a-z]/g, '')); // Clean the words

    // Find matching technical terms
    const matchingKeywords = resumeWords.filter(word => 
      commonTechTerms.includes(word) && jobWords.includes(word)
    );

    // Get unique keywords and return top N
    const uniqueKeywords = [...new Set(matchingKeywords)];
    
    return uniqueKeywords.slice(0, topN);
    
  } catch (error) {
    console.error('Error in keyword extraction:', error);
    return [];
  }
};

// Alternative scoring method using simple keyword matching
export const calculateKeywordScore = (jobText, resumeText) => {
  try {
    const jobWords = jobText.toLowerCase().split(/\W+/).filter(word => word.length > 2);
    const resumeWords = resumeText.toLowerCase().split(/\W+/).filter(word => word.length > 2);
    
    const jobWordSet = new Set(jobWords);
    const matchingWords = resumeWords.filter(word => jobWordSet.has(word));
    
    const score = (matchingWords.length / Math.max(jobWords.length, 1)) * 100;
    return Math.min(score, 100); // Cap at 100%
    
  } catch (error) {
    console.error('Error in keyword score calculation:', error);
    return 0;
  }
};