import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

function ColorSegmentation() {
  return (
    <div className="container">
      <Helmet>
        <title>Color Segmentation · VantageLabs</title>
        <meta
          name="description"
          content="Classify aerial imagery into vegetation, water, and built areas using HSV thresholds. Coming soon to VantageLabs."
        />
        <link rel="canonical" href="https://vantage.lodonu.dev/color-segmentation" />
      </Helmet>
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
