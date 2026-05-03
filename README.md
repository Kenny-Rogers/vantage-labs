<div align="center">

# VantageLabs

**Computer vision tools for aerial and video footage that run entirely in your browser**

[Live Demo](https://labs.lodonu.dev/) · [Available Tools](#available-tools) · [How It Works](#how-it-works) · [Run Locally](#run-locally)

[![Live Demo](https://img.shields.io/badge/demo-labs.lodonu.dev-b15a2c?style=flat-square)](https://labs.lodonu.dev/)
[![License: MIT](https://img.shields.io/badge/license-MIT-64748b?style=flat-square)](LICENSE)
[![React](https://img.shields.io/badge/react-19-0d9488?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Made in Ghana](https://img.shields.io/badge/made%20in-Accra-64748b?style=flat-square)](#about)

![VantageLabs](docs/screenshots/hero.png)

</div>

---

## What is VantageLabs?

A small, focused toolkit for working with drone footage and video files in the browser. Drop a video in, get the frames out. No upload, no server, no account.

The same computer-vision logic ships twice: once as TypeScript-style JavaScript that runs on the user's GPU/CPU via the Canvas API, and once as Python that runs locally on your machine (and, soon, in the same browser tab via [Pyodide](https://pyodide.org/)).

## Available Tools

| Tool | Description | Status |
| --- | --- | --- |
| **Frame Extractor** | Extract high-resolution stills from any video at a chosen interval | 🟢 Live |
| **Sharpness Scorer** | Auto-rank extracted frames by image quality (Laplacian variance) | 🔜 Coming Soon |
| **Color Segmentation** | Classify aerial imagery into vegetation / water / built areas (HSV thresholds) | 🔜 Coming Soon |
| **Object Detection** | Detect and count objects in aerial footage (YOLOv8 in-browser via ONNX Runtime Web) | 🔜 Coming Soon |
| **Traffic Analysis** | Count and track vehicles from above, with a heatmap visualization | 🔜 Coming Soon |
| **Aerial Mapper** | Stitch overlapping aerial photos into orthomosaic maps | 🔜 Coming Soon |

## How It Works

VantageLabs is a **client-only** app. There is no backend we own. When you drop a video in:

1. The browser creates an in-memory `URL.createObjectURL` from the file. No network request, no upload.
2. A hidden `<video>` element decodes the video, and a `<canvas>` paints each frame at full resolution.
3. The canvas encodes each frame as a JPEG `Blob`, all in your tab's memory.
4. JSZip (lazy-loaded only when you click *Download All*) bundles the JPEGs into a ZIP.

For heavier algorithms that don't fit comfortably in JavaScript, the same logic is written in Python under `python/` and will load in the browser via Pyodide (same entry points, same defaults) so the standalone CLI tool and the in-browser tool stay aligned. For models that even Pyodide can't carry (large YOLO weights, mapping pipelines), an optional Hugging Face Inference Endpoint is the only network hop.

## Tech Stack

- **React 19 + React Router 7**: UI and routing
- **Canvas API + HTML5 Video**: in-browser frame extraction
- **JSZip**: client-side ZIP packaging (lazy-loaded chunk)
- **OpenCV (cv2)**: Python sibling of the in-browser pipeline
- **Pyodide** *(planned)*: runs the Python tools in the same browser tab
- **YOLOv8 / ONNX Runtime Web** *(planned)*: object detection without a server
- **GitHub Pages + GitHub Actions**: static hosting, deploys on push to `main`

## Project Structure

```
.
├── public/                Static assets (favicon, OG image, SPA 404 fallback)
├── src/
│   ├── components/        Header, Footer, VideoDropZone, ImageGrid,
│   │                      ImageViewer, ProgressBar, DownloadButton, ToolCard
│   ├── pages/             Home, FrameExtractor, and per-tool placeholders
│   ├── utils/             videoProcessor, downloadHelper, pyodideLoader
│   ├── App.jsx            Routes
│   ├── index.js           Mount point + BrowserRouter basename
│   └── styles.css         Global styles, single accent color
├── python/
│   └── frame_extraction/  CLI sibling of utils/videoProcessor.js (OpenCV)
├── notebooks/             Jupyter notebooks documenting experiments
├── docs/                  Architecture and setup notes
└── .github/workflows/     GitHub Pages deploy
```

## Run Locally

```bash
git clone git@github.com:Kenny-Rogers/vantage-labs.git
cd vantage-labs
npm install
npm start
```

The app runs at <http://localhost:3000/>. Drop in any MP4, MOV, or WebM up to 500 MB.

To produce a production build:

```bash
npm run build
```

## Python Scripts

Each tool under `python/` is a standalone CLI. Frame Extractor is the first one wired up:

```bash
cd python/frame_extraction
pip install opencv-python

# Default: 1 frame per second, written into <video-stem>-frames/
python3 extractor.py path/to/drone-footage.mp4

# Tweak interval / output / quality
python3 extractor.py drone-footage.mp4 --interval 0.5 --output ./stills --quality 90
```

`extract_frames` is also importable as a library; see [python/frame_extraction/README.md](python/frame_extraction/README.md). The same function is what the browser-side Pyodide build will load.

## Roadmap

- [x] **Frame Extractor**: Extract high-res stills from any video
- [x] **Python sibling** for Frame Extractor (OpenCV CLI)
- [x] **GitHub Pages** deploy + SPA fallback for deep links
- [ ] **Sharpness Scorer**: Auto-rank by Laplacian variance
- [ ] **Color Segmentation**: HSV thresholds for vegetation / water / built
- [ ] **Pyodide integration**: run the Python tools in-browser
- [ ] **Object Detection**: YOLOv8 in-browser via ONNX Runtime Web
- [ ] **Traffic Analysis**: vehicle counting with heatmap overlay
- [ ] **Aerial Mapper**: orthomosaic stitching

## About

Built by **[Your Name]**, a software engineer in Accra, Ghana, exploring the intersection of aerial footage and computer vision.

## License

[MIT](LICENSE)
