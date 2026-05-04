import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

function ObjectDetection() {
  return (
    <div className="container">
      <Helmet>
        <title>Object Detection · VantageLabs</title>
        <meta
          name="description"
          content="YOLOv8 object detection running in the browser via ONNX Runtime Web. Coming soon to VantageLabs."
        />
        <link rel="canonical" href="https://vantage.lodonu.dev/object-detection" />
      </Helmet>
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
