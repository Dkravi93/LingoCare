export default function ResumeCard({
  rank,
  name,
  score,
  keywords = [],
  similarity,
  keywordScore,
  semanticScore,
  error,
}) {
  const scoreWidth = Math.min(score, 100);

  return (
    <div className="resume-card">
      <div className="rank-badge">#{rank}</div>

      <div className="resume-info">
        <div className="resume-name">{name}</div>

        {/* Show error state if present */}
        {error && <div className="error-message">⚠️ {error}</div>}

        {/* Enhanced keyword display */}
        {keywords && keywords.length > 0 ? (
          <div className="resume-keywords">
            <div className="keywords-label">Matching Keywords:</div>
            <div className="keywords-list">
              {keywords.slice(0, 5).map((keyword, index) => (
                <span key={index} className="keyword-tag">
                  {keyword}
                </span>
              ))}
              {keywords.length > 5 && (
                <span className="keyword-tag-more">
                  +{keywords.length - 5} more
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="no-keywords">No keywords extracted</div>
        )}

        {/* Detailed score breakdown - optional */}
        {(semanticScore !== undefined || keywordScore !== undefined) && (
          <div className="score-breakdown">
            <small>
              {semanticScore !== undefined && `Semantic: ${semanticScore}%`}
              {keywordScore !== undefined && ` • Keyword: ${keywordScore}%`}
            </small>
          </div>
        )}
      </div>

      <div className="score-display">
        <span className="score-value">{score}%</span>
        <div className="score-bar">
          <div
            className={`score-fill ${
              score >= 80
                ? "high-score"
                : score >= 60
                ? "medium-score"
                : "low-score"
            }`}
            style={{ width: `${scoreWidth}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
