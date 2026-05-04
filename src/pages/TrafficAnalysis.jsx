import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

function TrafficAnalysis() {
  return (
    <div className="container">
      <Helmet>
        <title>Traffic Analysis · VantageLabs</title>
        <meta
          name="description"
          content="Count and track vehicles from aerial footage with a heatmap overlay surfacing congested lanes. Coming soon to VantageLabs."
        />
        <link rel="canonical" href="https://vantage.lodonu.dev/traffic-analysis" />
      </Helmet>
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
