// utils/keywordExtractor.js
import natural from "natural";
import { removeStopwords } from "stopword";

const { WordTokenizer, TfIdf } = natural;

const advancedKeywordExtract = (resumeText, jobDescriptionText, topN = 5) => {
  // Tokenize and clean resume text
  const tokenizer = new WordTokenizer();
  let resumeTokens = tokenizer.tokenize(resumeText.toLowerCase());

  // Remove stop words and short words
  resumeTokens = removeStopwords(resumeTokens);
  resumeTokens = resumeTokens.filter((word) => word.length > 2);

  // Calculate TF-IDF or frequency
  const tfidf = new TfIdf();
  tfidf.addDocument(resumeText);

  // Get job description keywords to match against
  const jobTokens = tokenizer.tokenize(jobDescriptionText.toLowerCase());
  const jobKeywords = removeStopwords(jobTokens).filter(
    (word) => word.length > 2
  );

  // Score resume words based on relevance to job description
  const keywordScores = {};

  resumeTokens.forEach((word) => {
    if (jobKeywords.includes(word)) {
      // Calculate importance (simple frequency for demo)
      if (!keywordScores[word]) {
        keywordScores[word] = 0;
      }
      keywordScores[word]++;
    }
  });

  // Sort and get top keywords
  const sortedKeywords = Object.entries(keywordScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([keyword]) => keyword);

  return sortedKeywords;
};

export default advancedKeywordExtract;
