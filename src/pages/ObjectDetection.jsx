import { Link } from 'react-router-dom';

function ObjectDetection() {
  return (
    <div className="container">
      <header className="page-header">
        <h1>Object Detection</h1>
        <p>Detect and count objects from above.</p>
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

export default ObjectDetection;
