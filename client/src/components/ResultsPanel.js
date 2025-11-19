import { useEffect, useState } from 'react';
import { fetchResults } from '../services/api';
import ResumeCard from './ResumeCard';

export default function ResultsPanel({ sessionId }) {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults(sessionId)
      .then(res => setSummary(res.summary))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <p>Ranking…</p>;
  if (!summary.length) return <p>No results</p>;

  return (
    <div className="results">
      <h2>Ranked résumés</h2>
      {summary.map((r, idx) => <ResumeCard key={idx} {...r} />)}
    </div>
  );
}