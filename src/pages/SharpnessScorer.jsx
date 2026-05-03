import { Link } from 'react-router-dom';

function SharpnessScorer() {
  return (
    <div className="container">
      <header className="page-header">
        <h1>Sharpness Scorer</h1>
        <p>Auto-rank frames by image quality.</p>
      </header>
      <div className="coming-soon-block">
        <span className="coming-soon">Coming Soon</span>
        <p>
          This tool is still in development.{' '}
          <Link to="/">Back to all tools →</Link>
        </p>
      </div>
    </div>
  );
}

export default SharpnessScorer;
