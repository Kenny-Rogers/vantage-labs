import { Link } from 'react-router-dom';

function AerialMapper() {
  return (
    <div className="container">
      <header className="page-header">
        <h1>Aerial Mapper</h1>
        <p>Stitch photos into orthomosaic maps.</p>
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

export default AerialMapper;
