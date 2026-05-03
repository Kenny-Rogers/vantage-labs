import { Link } from 'react-router-dom';

function ColorSegmentation() {
  return (
    <div className="container">
      <header className="page-header">
        <h1>Color Segmentation</h1>
        <p>Classify land cover from aerial imagery.</p>
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

export default ColorSegmentation;
