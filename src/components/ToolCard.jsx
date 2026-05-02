import { Link } from 'react-router-dom';

function ToolCard({ title, description, icon, link, active }) {
  const body = (
    <>
      {!active && <span className="coming-soon">Coming Soon</span>}
      <span className="icon" aria-hidden="true">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </>
  );

  if (active) {
    return (
      <Link to={link} className="tool-card active">
        {body}
      </Link>
    );
  }

  return (
    <div className="tool-card inactive" aria-disabled="true">
      {body}
    </div>
  );
}

export default ToolCard;
