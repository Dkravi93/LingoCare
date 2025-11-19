export default function ResumeCard({ rank, name, score }) {
  return (
    <div className="resume-card">
      <span className="rank">#{rank}</span>
      <span className="name">{name}</span>
      <span className="score">{score} %</span>
    </div>
  );
}