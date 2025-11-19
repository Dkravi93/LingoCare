export default function JobDescriptionInput({ value, onChange }) {
  return (
    <div className="jd-input">
      <label className="jd-label">📝 Job Description</label>
      <textarea
        className="jd-textarea"
        rows={8}
        placeholder="Paste the job description here...&#10;&#10;Example:&#10;We are looking for a skilled developer with experience in React, Node.js, and cloud technologies. The ideal candidate should have 3+ years of experience in full-stack development and strong problem-solving skills."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <div className="jd-character-count">{value.length} characters</div>
      )}
    </div>
  );
}
