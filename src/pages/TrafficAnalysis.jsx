import { Link } from 'react-router-dom';

function TrafficAnalysis() {
  return (
    <div className="container">
      <header className="page-header">
        <h1>Traffic Analysis</h1>
        <p>Count vehicles and map traffic flow.</p>
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

export default TrafficAnalysis;
