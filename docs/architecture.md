# Architecture

VantageLabs uses a hybrid architecture that keeps most processing in the browser and reaches for a backend only when a model is too heavy to ship to the client.

## Layers

1. **React frontend** — UI, routing, drag-and-drop video ingestion, frame display, and download/export. Built with Create React App and React Router.
2. **In-browser Python (Pyodide)** — runs the lightweight CV scripts in `python/` directly inside the user's browser. No upload required, files never leave the device.
3. **Optional Hugging Face backend** — when a tool needs a heavier model than Pyodide can handle (e.g. YOLO inference, large segmentation models), the frontend posts to a Hugging Face Space / Inference Endpoint and streams the result back.

## Data flow

```
User video / image
  → React (VideoDropZone, ImageGrid)
    → Canvas API (frame extraction)
      → Pyodide (lightweight CV: sharpness, HSV segmentation)
      → HF endpoint (heavy CV: YOLO, mapping)
    → Download (single frame or ZIP)
```

## Deploy target

Static build is published to GitHub Pages from the `main` branch via `.github/workflows/deploy.yml`. There is no server we own — Pages serves the static bundle, and the optional HF endpoint is the only network hop at runtime.
