import { Link, NavLink } from 'react-router-dom';

const GITHUB_URL = 'https://github.com/Kenny-Rogers/vantage-labs';

function Header() {
  return (
    <nav className="nav-top">
      <div className="wrap nav-row">
        <Link to="/" className="brand">
          <span className="mark" aria-hidden="true"></span>
          Vantage<span className="italic">Labs</span>
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
          <li>
            <NavLink className="nav-link" to="/#about">
              About
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
      </div>
    </nav>
  );
}

export default Header;
