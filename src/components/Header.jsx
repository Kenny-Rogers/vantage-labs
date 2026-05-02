import { Link } from 'react-router-dom';

const GITHUB_URL = 'https://github.com/Kenny-Rogers/vantage-labs';

function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo">VantageLabs</Link>
        <nav className="nav">
          <Link to="/">Tools</Link>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
