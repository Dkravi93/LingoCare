import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import JobDescriptionInput from '../components/JobDescriptionInput';
import ResultsPanel from '../components/ResultsPanel';
import { uploadFiles } from '../services/api';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const handleAnalyse = async () => {
    if (!files.length || !jd.trim()) return alert('Upload résumés and paste a JD');
    setLoading(true);
    try {
      const id = await uploadFiles(files, jd);
      setSessionId(id);
    } catch (e) {
      alert('Upload failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <h1>AI Résumé Recommender</h1>
      <JobDescriptionInput value={jd} onChange={setJd} />
      <FileUpload files={files} setFiles={setFiles} />
      <button onClick={handleAnalyse} disabled={loading || !files.length || !jd}>
        {loading ? 'Analysing…' : 'Rank résumés'}
      </button>
      {sessionId && <ResultsPanel sessionId={sessionId} />}
    </div>
  );
}