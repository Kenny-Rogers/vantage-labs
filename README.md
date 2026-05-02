# VantageLabs

A browser-first toolkit for working with drone footage: extract frames, score sharpness, segment color, detect objects, analyze traffic, and build aerial maps.

## Stack

- **React + React Router** for the UI (scaffolded with Create React App)
- **Pyodide** for running Python CV scripts in the browser
- **Optional Hugging Face backend** for heavier models that don't fit in-browser
- **GitHub Pages** for hosting (deployed via GitHub Actions)

## Layout

```
src/         React app (components, pages, utils)
python/      Standalone CV tools, one folder per tool
notebooks/   Jupyter notebooks documenting experiments
docs/        Architecture and setup notes
```

## Getting started

```bash
npm install
npm start
```

See [docs/setup-guide.md](docs/setup-guide.md) for full setup instructions and [docs/architecture.md](docs/architecture.md) for how the pieces fit together.

## License

MIT — see [LICENSE](LICENSE).
