# Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+ (only needed for running the standalone scripts in `python/` and the notebooks)

## Frontend

```bash
npm install
npm start
```

The app runs at http://localhost:3000.

To build a production bundle:

```bash
npm run build
```

## Python scripts

Each subfolder under `python/` is a standalone tool. Setup will be documented per-tool as they come online.

## Notebooks

```bash
pip install jupyter
jupyter lab
```

Open any notebook under `notebooks/` to follow the experiments behind each tool.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds the React app and publishes it to GitHub Pages. Update the `homepage` field in `package.json` to your GitHub Pages URL before the first deploy.
