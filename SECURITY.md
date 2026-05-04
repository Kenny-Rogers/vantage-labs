# Security policy

If you believe you've found a security issue in vantage-labs (the site at
[vantage.lodonu.dev](https://vantage.lodonu.dev) or its source), please
report it privately rather than opening a public issue.

## How to report

Email **contact@lodonu.dev** with:

- a short description of the issue,
- steps to reproduce,
- the impact you believe it has,
- any relevant URLs, commit hashes, or screenshots.

If you'd prefer encrypted email, ask in your first message and a public key
will be sent.

## What to expect

- Acknowledgement within **3 business days**.
- A first assessment (severity + intended fix path) within **7 days**.
- Public disclosure only after a fix has shipped, or by mutual agreement
  if no fix is possible.

## Scope

In scope:

- The deployed site at `vantage.lodonu.dev` and any subroute.
- Source in this repository, including the GitHub Actions workflow.
- The Cloudflare Worker that serves the site.

Out of scope:

- Vulnerabilities in third-party services the site links to (Hugging Face,
  GitHub, Cloudflare's own platform).
- Self-XSS or social-engineering attacks against the maintainer.
- Issues that require a compromised end-user device or browser extension.
- Reports generated solely by automated scanners with no proof of impact.

Thanks for helping keep this project safe.
