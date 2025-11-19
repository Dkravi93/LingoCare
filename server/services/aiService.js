import dotenv from "dotenv";
dotenv.config();

// Universal embedding service that works for any domain
class UniversalEmbeddingService {
  constructor() {
    // General skill categories that work across domains
    this.skillCategories = {
      technical: [
        "programming",
        "development",
        "coding",
        "software",
        "technical",
        "engineering",
        "react",
        "node",
        "javascript",
        "python",
        "java",
        "html",
        "css",
        "sql",
        "database",
        "api",
        "rest",
        "graphql",
        "microservices",
        "aws",
        "azure",
        "cloud",
        "docker",
        "kubernetes",
        "git",
        "devops",
        "testing",
        "agile",
        "scrum",
      ],
      business: [
        "management",
        "leadership",
        "strategy",
        "planning",
        "analysis",
        "analytics",
        "marketing",
        "sales",
        "finance",
        "budget",
        "revenue",
        "growth",
        "strategy",
        "business",
        "stakeholder",
        "client",
        "customer",
        "project",
        "portfolio",
      ],
      creative: [
        "design",
        "creative",
        "ux",
        "ui",
        "graphic",
        "visual",
        "brand",
        "content",
        "writing",
        "copy",
        "social",
        "media",
        "video",
        "photo",
        "illustration",
      ],
      hr: [
        "recruitment",
        "hiring",
        "talent",
        "hr",
        "human resources",
        "onboarding",
        "training",
        "development",
        "performance",
        "compensation",
        "benefits",
        "employee",
        "workforce",
        "culture",
        "diversity",
        "inclusion",
      ],
      softSkills: [
        "communication",
        "leadership",
        "teamwork",
        "collaboration",
        "problem solving",
        "critical thinking",
        "adaptability",
        "time management",
        "organization",
        "creativity",
        "innovation",
        "negotiation",
        "presentation",
        "public speaking",
      ],
      tools: [
        "excel",
        "word",
        "powerpoint",
        "office",
        "google",
        "suite",
        "slack",
        "teams",
        "jira",
        "trello",
        "asana",
        "salesforce",
        "hubspot",
        "sap",
        "oracle",
      ],
    };

    // Combine all terms for general embedding
    this.allTerms = [
      ...this.skillCategories.technical,
      ...this.skillCategories.business,
      ...this.skillCategories.creative,
      ...this.skillCategories.hr,
      ...this.skillCategories.softSkills,
      ...this.skillCategories.tools,
    ];
  }

  generateEmbedding(text) {
    try {
      const words = this.preprocessText(text);
      const embedding = new Array(this.allTerms.length).fill(0);

      // Count occurrences with basic weighting
      words.forEach((word) => {
        const index = this.allTerms.indexOf(word);
        if (index !== -1) {
          embedding[index] += 1;
        }
      });

      // Apply TF-IDF like weighting
      const totalWords = words.length;
      if (totalWords > 0) {
        for (let i = 0; i < embedding.length; i++) {
          if (embedding[i] > 0) {
            embedding[i] = 1 + Math.log(embedding[i]);
          }
        }
      }

      // Normalize the embedding vector
      const magnitude = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      );
      if (magnitude > 0) {
        return embedding.map((val) => val / magnitude);
      }

      return embedding;
    } catch (error) {
      console.error("Error in universal embedding generation:", error);
      return new Array(this.allTerms.length).fill(0);
    }
  }

  preprocessText(text) {
    return text
      ? text
          .toLowerCase()
          .split(/\W+/)
          .filter((word) => word.length > 2)
          .map((word) => word.replace(/[^a-z]/g, ""))
      : null;
  }

  // Universal keyword extraction for any domain
  extractRelevantKeywords(jobText, resumeText, topN = 10) {
    try {
      const jobWords = this.preprocessText(jobText);
      const resumeWords = this.preprocessText(resumeText);

      // Find overlapping words that are meaningful (not just common words)
      const commonWords = new Set([
        "the",
        "and",
        "for",
        "with",
        "this",
        "that",
        "have",
        "from",
      ]);
      const matchingKeywords = resumeWords.filter(
        (word) =>
          jobWords.includes(word) && !commonWords.has(word) && word.length > 3 // Focus on longer, more meaningful words
      );

      const uniqueKeywords = [...new Set(matchingKeywords)];
      return uniqueKeywords.slice(0, topN);
    } catch (error) {
      console.error("Error in keyword extraction:", error);
      return [];
    }
  }

  // Calculate basic keyword match score
  calculateKeywordMatchScore(jobText, resumeText) {
    try {
      const jobWords = this.preprocessText(jobText);
      const resumeWords = this.preprocessText(resumeText);

      const jobWordSet = new Set(jobWords.filter((word) => word.length > 3));
      const matchingWords = resumeWords.filter((word) => jobWordSet.has(word));

      // Calculate score based on percentage of job keywords found
      const score = (matchingWords.length / Math.max(jobWordSet.size, 1)) * 100;
      return Math.min(score, 100);
    } catch (error) {
      console.error("Error in keyword match calculation:", error);
      return 0;
    }
  }
}

// Smart Groq-based embedding service for better semantic understanding
class SmartGroqEmbeddingService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.baseURL = "https://api.groq.com/openai/v1";
  }

  async generateEmbedding(text) {
    try {
      if (!this.apiKey) {
        throw new Error("GROQ_API_KEY is not configured");
      }

      console.log("Using Smart Groq API for semantic understanding...");

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `Analyze the following job description or resume text and create a semantic vector that captures:
              - Key skills and competencies
              - Experience level and qualifications
              - Domain knowledge and specialization
              - Tools and technologies mentioned
              - Soft skills and personal attributes
              
              Return ONLY a JSON array of 20 numbers between 0 and 1 that represents this semantic understanding.
              Format: [0.85, 0.23, 0.67, ...]`,
            },
            {
              role: "user",
              content: text.substring(0, 3000),
            },
          ],
          temperature: 0.1,
          max_tokens: 500,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const embeddingText = data.choices[0]?.message?.content;

      if (!embeddingText) {
        throw new Error("No embedding content received from Groq");
      }

      let embeddingArray = this.parseEmbeddingFromText(embeddingText);

      if (!embeddingArray || embeddingArray.length === 0) {
        throw new Error("No valid embedding array found");
      }

      // Normalize to 20 dimensions for consistency
      const normalizedEmbedding = this.normalizeEmbedding(embeddingArray, 20);
      console.log(
        `Smart embedding generated with ${normalizedEmbedding.length} dimensions`
      );

      return normalizedEmbedding;
    } catch (error) {
      console.error("Smart Groq embedding error:", error.message);
      throw error;
    }
  }

  parseEmbeddingFromText(text) {
    try {
      // Try to extract JSON array
      const jsonMatch = text.match(/\[[^\]]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Try to extract numbers
      const numberMatches = text.match(/-?\d+\.\d+/g);
      if (numberMatches && numberMatches.length >= 5) {
        return numberMatches.slice(0, 20).map(Number);
      }

      throw new Error("Could not parse embedding from response");
    } catch (error) {
      console.error("Error parsing smart embedding:", error);
      throw error;
    }
  }

  normalizeEmbedding(embedding, targetDimensions) {
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return new Array(targetDimensions).fill(0.5); // Return neutral vector
    }

    if (embedding.length === targetDimensions) {
      return embedding;
    }

    if (embedding.length > targetDimensions) {
      return embedding.slice(0, targetDimensions);
    }

    // Pad with neutral values (0.5) if shorter
    const padded = [...embedding];
    while (padded.length < targetDimensions) {
      padded.push(0.5);
    }
    return padded;
  }
}

// Factory to create appropriate embedding service
const createEmbeddingService = () => {
  if (process.env.GROQ_API_KEY) {
    console.log("Using Smart Groq API for semantic understanding");
    return new SmartGroqEmbeddingService();
  } else {
    console.log("Using Universal embedding service");
    return new UniversalEmbeddingService();
  }
};

const embeddingService = createEmbeddingService();

// Main embedding function
export const getEmbedding = async (text) => {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error("Text cannot be empty for embedding");
    }

    console.log("Generating universal embedding for text length:", text.length);

    const embedding = await embeddingService.generateEmbedding(text);

    console.log(`Generated embedding with ${embedding.length} dimensions`);
    return embedding;
  } catch (error) {
    console.error(
      "Error in getEmbedding, falling back to universal service:",
      error.message
    );

    // Fallback to universal service
    const universalService = new UniversalEmbeddingService();
    return universalService.generateEmbedding(text);
  }
};

// Batch processing
export const getEmbeddings = async (texts) => {
  try {
    const embeddings = await Promise.all(
      texts.map((text) => getEmbedding(text))
    );
    return embeddings;
  } catch (error) {
    console.error("Error in batch embeddings:", error);
    throw error;
  }
};
