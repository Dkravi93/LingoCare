import { useEffect, useState } from "react";
import { fetchResults } from "../services/api";
import ResumeCard from "./ResumeCard";

export default function ResultsPanel({ sessionId }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      console.log("No session ID provided");
      return;
    }

    const loadResults = async () => {
      try {
        console.log("Loading results for session:", sessionId);
        setLoading(true);
        setError(null);

        const data = await fetchResults(sessionId);
        console.log("Results data received:", data);

        setResults(data);
      } catch (err) {
        console.error("Error loading results:", err);
        setError(err.message || "Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [sessionId]);

  // Process resumes to handle the actual API response structure
  const getProcessedResumes = () => {
    if (!results?.resumes) return [];

    return results.resumes
      .map((resume, index) => {
        // Create fallback name since originalName is missing
        const originalName = resume.originalName || `Resume ${index + 1}`;

        // Since all resumes in the response are processed (they have scores),
        // we can assume they're processed
        const status = "processed";

        return {
          ...resume,
          originalName,
          status,
        };
      })
      .filter((resume) => resume.score !== undefined && resume.score !== null);
  };

  const processedResumes = getProcessedResumes();

  console.log("Processed resumes:", processedResumes);

  if (loading) {
    return (
      <div className="results-panel">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Analyzing resumes with AI...</p>
          <p className="loading-subtext">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-panel">
        <div className="empty-state error-state">
          <div className="empty-icon">⚠️</div>
          <h3>Error Loading Results</h3>
          <p>{error}</p>
          <button
            className="retry-btn"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="results-panel">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Results Available</h3>
          <p>Unable to load analysis results</p>
        </div>
      </div>
    );
  }

  if (processedResumes.length === 0) {
    return (
      <div className="results-panel">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <h3>No Processed Resumes</h3>
          <p>
            Found {results.resumes?.length || 0} resumes but none have valid
            scores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-panel">
      <div className="results-header">
        <div className="results-title">Ranked Résumés</div>
        <div className="results-count">
          {processedResumes.length} resumes analyzed
        </div>
      </div>

      {results.jobDescription && (
        <div className="job-description-preview">
          <div className="job-description-label">Job Description:</div>
          <div className="job-description-text">
            {results.jobDescription.substring(0, 200)}...
          </div>
        </div>
      )}

      <div className="resume-cards">
        {processedResumes.map((resume, index) => (
          <ResumeCard
            key={resume.originalName || index}
            rank={index + 1}
            name={resume.originalName}
            score={resume.score || 0}
            keywords={resume.keywords || []}
          />
        ))}
      </div>
    </div>
  );
}
