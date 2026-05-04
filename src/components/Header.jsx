import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const GITHUB_URL = 'https://github.com/Kenny-Rogers/vantage-labs';

function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <nav className="nav-top">
      <div className="wrap nav-row">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="mark" aria-hidden="true"></span>
          <span>Vantage<span className="italic">Labs</span></span>
        </Link>
        <ul className="nav-list">
          <li>
            <NavLink className="nav-link" to="/#work">
              Work
            </NavLink>
          </li>
          <li>
            <NavLink className="nav-link" to="/frame-extractor">
              Try it
            </NavLink>
          </li>
        </ul>
        <a
          className="nav-cta"
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub <span style={{ opacity: 0.5 }}>↗</span>
        </a>
        <button
          type="button"
          className="nav-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`nav-toggle-bars${open ? ' open' : ''}`} aria-hidden="true">
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`nav-mobile${open ? ' open' : ''}`}
        hidden={!open}
      >
        <ul>
          <li>
            <Link to="/#work" onClick={() => setOpen(false)}>Work</Link>
          </li>
          <li>
            <Link to="/frame-extractor" onClick={() => setOpen(false)}>Try it</Link>
          </li>
          <li>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              GitHub ↗
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Header;
