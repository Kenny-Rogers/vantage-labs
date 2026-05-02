const GITHUB_URL = 'https://github.com/Kenny-Rogers/vantage-labs';

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>Built by [Your Name] in Accra, Ghana</span>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
    </footer>
  );
}

export default Footer;
