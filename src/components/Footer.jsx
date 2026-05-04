import { useState } from 'react';
import { Link } from 'react-router-dom';

const GITHUB_URL = 'https://github.com/Kenny-Rogers/vantage-labs';
const EMAIL = 'contact@lodonu.dev';

function CopyEmailButton() {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = EMAIL;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button
      type="button"
      className="footer-copy"
      onClick={onClick}
      aria-label={copied ? 'Email copied' : 'Copy email address'}
    >
      {copied ? 'copied' : 'copy'}
    </button>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <h4>Get in touch</h4>
            <p style={{ margin: 0, maxWidth: '32ch', color: 'var(--ink-2)' }}>
              For collaborations, papers, or borrowing a model, drop a line.
            </p>
            <div className="footer-contact-row">
              <a className="footer-contact" href={`mailto:${EMAIL}`}>
                {EMAIL} <span>↗</span>
              </a>
              <CopyEmailButton />
            </div>
          </div>
          <div>
            <h4>Work</h4>
            <ul>
              <li><Link to="/#work">All projects</Link></li>
              <li><Link to="/frame-extractor">Frame Extractor</Link></li>
              <li><Link to="/#about">About</Link></li>
            </ul>
          </div>
          <div>
            <h4>Elsewhere</h4>
            <ul>
              <li>
                <a
                  href="https://www.lodonu.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Lodonu ↗
                </a>
              </li>
              <li>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  GitHub ↗
                </a>
              </li>
              <li>
                <a
                  href="https://huggingface.co/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Hugging Face ↗
                </a>
              </li>
              <li>
                <a
                  href={`${GITHUB_URL}/issues`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Notes ↗
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Subscribe</h4>
            <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 13 }}>
              Quarterly notes, no spam.
            </p>
            <form
              className="footer-form"
              onSubmit={(e) => e.preventDefault()}
            >
              <input type="email" placeholder="you@somewhere" />
              <button type="submit" aria-label="Subscribe">↵</button>
            </form>
          </div>
        </div>

        <div className="bigmark">
          Vantage<em>Labs</em>
        </div>

        <div className="colofon">
          <div className="mono">© MMXXVI · Vantage Labs · Built by hand</div>
          <div className="mono">Built in Accra, Ghana</div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
