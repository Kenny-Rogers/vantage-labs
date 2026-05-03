# Frame Extraction

Extracts still frames from a video at a fixed time interval, using OpenCV.
The Python sibling of [`src/utils/videoProcessor.js`](../../src/utils/videoProcessor.js) — same defaults, same behavior — so the standalone CLI tool and the in-browser tool stay aligned.

## Status: Active

## What it does

Walks a video clock at one frame per `--interval` seconds (default `1.0`), seeks to each timestamp, decodes the frame, and writes it as a high-quality JPEG. Output goes into a folder next to the source video by default.

## Install

```bash
pip install opencv-python
```

(If you're on a headless server with no GUI, `pip install opencv-python-headless` is the same library minus GTK/Qt and ~50 MB lighter.)

## Run

```bash
# Default: 1 frame/second, saves into <video-stem>-frames/ next to the video
python3 extractor.py path/to/drone-footage.mp4

# Every half-second, into a chosen folder
python3 extractor.py drone-footage.mp4 --interval 0.5 --output ./stills

# Lower JPEG quality if you want smaller files
python3 extractor.py drone-footage.mp4 --quality 80
```

### CLI options

| Flag         | Default              | Description                                                       |
| ------------ | -------------------- | ----------------------------------------------------------------- |
| `video`      | (required)           | Path to the input video (MP4, MOV, AVI, WebM, MKV, ...)           |
| `--interval` | `1.0`                | Seconds between frames                                            |
| `--output`   | `<stem>-frames/`     | Output directory (created if missing)                             |
| `--quality`  | `95`                 | JPEG quality (1–100)                                              |

## Sample output

```
$ python3 extractor.py drone-footage.mp4
Extracting frames... 100%
Extracted 28 frames in 1.43s → drone-footage-frames
```

The output folder contains zero-padded JPEGs that sort lexically in any file browser:

```
drone-footage-frames/
├── frame-001.jpg
├── frame-002.jpg
├── frame-003.jpg
├── ...
└── frame-028.jpg
```

## Use as a library

```python
from extractor import extract_frames

frames = extract_frames(
    "drone-footage.mp4",
    output_dir="stills",
    interval=2.0,
    quality=92,
    on_progress=lambda pct: print(f"{pct:.0f}%"),
)
print(f"Saved {len(frames)} frames")
```

`extract_frames` returns a list of dicts:

```python
[
    {"path": "stills/frame-001.jpg", "timestamp": 0.0,  "frame_number": 1, "width": 1920, "height": 1080},
    {"path": "stills/frame-002.jpg", "timestamp": 2.0,  "frame_number": 2, "width": 1920, "height": 1080},
    ...
]
```

The same function is what the browser-side Pyodide build will load and call, so the CLI behavior is also the in-browser behavior.
