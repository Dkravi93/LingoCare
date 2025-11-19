import dotenv from 'dotenv';
dotenv.config();

// Direct Groq API implementation for embeddings
class GroqEmbeddingService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.baseURL = 'https://api.groq.com/openai/v1';
  }

  async generateEmbedding(text) {
    try {
      if (!this.apiKey) {
        throw new Error('GROQ_API_KEY is not configured');
      }   
      // Use chat completion to generate semantic representation
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant', // Fast and cost-effective for this task
          messages: [
            {
              role: 'system',
              content: `You are an embedding generator. Convert the following text into a semantic vector representation.
              Return ONLY a JSON array of exactly 50 numbers between -1 and 1 that represents the text's meaning.
              Focus on technical skills, experience, education, and domain knowledge.
              Format: [0.123, -0.456, 0.789, ...] and make sure the array is COMPLETE and properly closed.
              Return exactly 50 numbers, no more, no less.`
            },
            {
              role: 'user',
              content: text.substring(0, 2000) // Limit token usage
            }
          ],
          temperature: 0.1,
          max_tokens: 1000, // Increased to ensure complete response
          stream: false
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const embeddingText = data.choices[0]?.message?.content;

      if (!embeddingText) {
        throw new Error('No embedding content received from Groq');
      }

      // Parse the JSON array from the response - handle incomplete arrays
      let embeddingArray = this.parseEmbeddingFromText(embeddingText);
      
      if (!embeddingArray || embeddingArray.length === 0) {
        throw new Error('No valid embedding array found in response');
      }

      // Normalize to 50 dimensions (smaller to avoid truncation)
      const normalizedEmbedding = this.normalizeEmbedding(embeddingArray, 50);
      
      return normalizedEmbedding;

    } catch (error) {
      throw error;
    }
  }

  parseEmbeddingFromText(text) {
    try {
      // First, try to find a complete JSON array
      const jsonMatch = text.match(/\[[^\]]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // If no complete array found, try to extract numbers and build array
      const numberMatches = text.match(/-?\d+\.\d+/g);
      if (numberMatches && numberMatches.length >= 10) { // Require at least 10 numbers
        return numberMatches.slice(0, 50).map(Number);
      }

      // Last resort: try to parse the entire text as JSON
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        // Ignore JSON parse errors here

      }

      throw new Error('Could not extract embedding from response');
    } catch (error) {
      throw error;
    }
  }

  normalizeEmbedding(embedding, targetDimensions) {
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('Invalid embedding array');
    }

    if (embedding.length === targetDimensions) {
      return embedding;
    }
    
    if (embedding.length > targetDimensions) {
      return embedding.slice(0, targetDimensions);
    }
    
    // Pad with zeros if shorter
    const padded = [...embedding];
    while (padded.length < targetDimensions) {
      padded.push(0);
    }
    return padded;
  }
}

// Simple local embedding fallback
class LocalEmbeddingService {
  generateEmbedding(text) {
    // Simple TF-IDF like embedding based on common tech terms
    const techTerms = [
      'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue', 'node', 
      'express', 'mongodb', 'mysql', 'postgresql', 'aws', 'azure', 'docker', 'kubernetes',
      'git', 'rest', 'api', 'graphql', 'html', 'css', 'sass', 'bootstrap', 'tailwind',
      'redux', 'context', 'hooks', 'jest', 'testing', 'ci', 'cd', 'devops', 'agile',
      'scrum', 'frontend', 'backend', 'fullstack', 'mobile', 'web', 'cloud', 'serverless',
      'microservices', 'architecture', 'design', 'patterns', 'security', 'authentication',
      'authorization', 'oauth', 'jwt', 'redis', 'elasticsearch'
    ];

    const embedding = new Array(techTerms.length).fill(0);
    const words = text.toLowerCase().split(/\W+/);
    
    words.forEach(word => {
      const index = techTerms.indexOf(word);
      if (index !== -1) {
        embedding[index] += 1;
      }
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return embedding.map(val => val / magnitude);
    }
    
    return embedding;
  }
}

// Factory to create embedding service
const createEmbeddingService = () => {
  if (process.env.GROQ_API_KEY) {
    return new GroqEmbeddingService();
  } else {
    return new LocalEmbeddingService();
  }
};

const embeddingService = createEmbeddingService();

// Main embedding function
export const getEmbedding = async (text) => {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty for embedding');
    }

    
    const embedding = await embeddingService.generateEmbedding(text);
    
    return embedding;

  } catch (error) {
    const localService = new LocalEmbeddingService();
    return localService.generateEmbedding(text);
  }
};

// Batch processing
export const getEmbeddings = async (texts) => {
  try {
    const embeddings = await Promise.all(
      texts.map(text => getEmbedding(text))
    );
    return embeddings;
  } catch (error) {
    console.error('Error in batch embeddings:', error);
    throw error;
  }
};