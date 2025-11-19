export default function JobDescriptionInput({ value, onChange }) {
  return (
    <div className="jd-input">
      <label>Job Description</label>
      <textarea
        rows={6}
        placeholder="Paste the job description here…"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}