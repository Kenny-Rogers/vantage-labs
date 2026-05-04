import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

function SharpnessScorer() {
  return (
    <div className="container">
      <Helmet>
        <title>Sharpness Scorer · VantageLabs</title>
        <meta
          name="description"
          content="Auto-rank extracted frames by image quality using Laplacian variance. Coming soon to VantageLabs."
        />
        <link rel="canonical" href="https://vantage.lodonu.dev/sharpness-scorer" />
      </Helmet>
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
