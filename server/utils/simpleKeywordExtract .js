const simpleKeywordExtract = (resumeText, jobDescription, topN = 5) => {
    // Extract words from job description
    const jobWords = jobDescription.toLowerCase()
        .match(/\b[a-z]{3,}\b/g) || [];
    
    // Find common words
    const resumeWords = resumeText.toLowerCase()
        .match(/\b[a-z]{3,}\b/g) || [];
    
    const commonKeywords = [...new Set(
        resumeWords.filter(word => jobWords.includes(word))
    )].slice(0, topN);
    
    return commonKeywords;
};

export default { simpleKeywordExtract };