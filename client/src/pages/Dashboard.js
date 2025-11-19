import { useState } from "react";
import FileUpload from "../components/FileUpload";
import JobDescriptionInput from "../components/JobDescriptionInput";
import ResultsPanel from "../components/ResultsPanel";
import { uploadFiles } from "../services/api";

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyse = async () => {
    if (!files.length) {
      setError("Please upload at least one resume PDF");
      return;
    }

    if (!jd.trim()) {
      setError("Please provide a job description");
      return;
    }

    setLoading(true);
    setError(null);
    setSessionId(null); // Reset previous session

    try {
      console.log("Starting analysis...");
      const id = await uploadFiles(files, jd);
      console.log("Analysis complete, session ID:", id);
      setSessionId(id);
    } catch (error) {
      console.error("Analysis failed:", error);
      setError(error.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canAnalyse = files.length > 0 && jd.trim().length > 0;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">AI Résumé Recommender</h1>
        <p className="dashboard-subtitle">
          Upload resumes and get AI-powered rankings based on job description
          match
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="dashboard-content">
        <div className="upload-section">
          <h2 className="section-title">Upload Resumes</h2>
          <FileUpload files={files} setFiles={setFiles} />

          <JobDescriptionInput value={jd} onChange={setJd} />

          <div className="action-section">
            <button
              className="analyse-btn"
              onClick={handleAnalyse}
              disabled={!canAnalyse || loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner-small"></span>
                  Analyzing...
                </>
              ) : (
                "🎯 Rank Résumés"
              )}
            </button>
          </div>
        </div>

        <div className="results-section">
          {sessionId && <ResultsPanel sessionId={sessionId} />}
          {!sessionId && !loading && (
            <div className="results-panel">
              <div className="empty-state">
                <div className="empty-icon">🚀</div>
                <h3>Ready to Analyze</h3>
                <p>
                  Upload resumes and a job description to see AI-powered
                  rankings
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
