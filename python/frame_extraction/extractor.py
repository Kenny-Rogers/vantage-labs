"""
Frame extraction + per-frame analysis using OpenCV / numpy / PIL.

The Python sibling of src/utils/videoProcessor.js — same defaults, same
behavior — so the standalone CLI tool and the in-browser tool stay aligned.
The functions in this module are loaded by Pyodide in the browser, which
is why the core logic is in plain functions and not buried in argparse.

Two entry points:

  extract_frames(video_path, ...)
      Walks a video file's clock and writes JPEG frames. CLI-only —
      requires cv2 (FFmpeg-backed VideoCapture).

  analyze_frame(image_data)
      Scores a single image (sharpness via Laplacian variance, mean
      brightness). Accepts a base64 string, raw bytes, or a numpy
      ndarray. Used by the browser to score each Canvas-extracted frame
      via Pyodide.

Usage as a script:
    python3 extractor.py path/to/video.mp4
    python3 extractor.py video.mp4 --interval 0.5 --output frames/
    python3 extractor.py video.mp4 --quality 90

Usage as a library:
    from extractor import extract_frames, analyze_frame
    frames  = extract_frames("video.mp4", interval=2.0)
    metrics = analyze_frame(open("frame.jpg", "rb").read())
"""

import argparse
import base64
import io
import sys
import time
from pathlib import Path

# cv2 is heavy and only needed for the CLI's video-decoding path. Importing
# it lazily inside _open_capture keeps the module loadable under Pyodide,
# where opencv-python is available via micropip but not bundled by default.


def _open_capture(video_path):
    """
    Open the video and read its metadata.

    cv2.VideoCapture wraps FFmpeg / OS demuxers behind a single API. It can
    read MP4, MOV, AVI, WebM, MKV, etc. — anything OpenCV's underlying build
    supports. .isOpened() returns False if the codec or container isn't
    supported, or the file is corrupt.

    OpenCV exposes properties via integer keys (CAP_PROP_*). The values are
    returned as floats; we cast width/height to int.
        FPS:         frames per second (e.g. 30.0)
        FRAME_COUNT: total frames in the video
        FRAME_WIDTH/HEIGHT: native pixel size

    Returns: (cap, fps, frame_count, width, height)
    Raises:  ValueError if open or metadata read fails. The capture is
             released before raising so we don't leak handles.
    """
    import cv2  # local import; see module docstring

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(
            f"Could not open {video_path.name} — the file may be corrupt or "
            "the codec isn't supported by this OpenCV build."
        )
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    if fps <= 0 or frame_count <= 0:
        cap.release()
        raise ValueError(
            "Could not read this video's duration — the file may be corrupt "
            "or use a container that doesn't report frame count."
        )
    return cap, fps, frame_count, width, height


def _compute_timestamps(duration, interval):
    """
    Build the list of timestamps (in seconds) we'll seek to.

    Always starts at t=0, then steps by `interval`, stopping before the
    video's end. For very short videos (< interval), yields a single frame
    at t=0 — the only sensible behavior.
    """
    timestamps = []
    t = 0.0
    while t < duration:
        timestamps.append(t)
        t += interval
    if not timestamps:
        timestamps.append(0.0)
    return timestamps


def extract_frames(
    video_path,
    output_dir=None,
    interval=1.0,
    quality=95,
    on_progress=None,
    on_frame=None,
):
    """
    Extract still frames from a video at a given time interval.

    Walks the video clock at `interval` seconds, jumping to each timestamp,
    decoding that frame, and saving it as a JPEG.

    Args:
        video_path: Path to the input video file (str or pathlib.Path).
        output_dir: Directory to write frames into. If None, a directory
                    named "<video-stem>-frames" is created next to the
                    video file.
        interval: Seconds between extracted frames (default 1.0).
        quality: JPEG quality, 1..100 (default 95).
        on_progress: Optional callable(percent: float) called once after each
                     frame is saved. Value is in [0, 100].
        on_frame: Optional callable(info: dict) called once per saved frame
                  with {path, timestamp, frame_number, width, height}.

    Returns:
        A list of dicts (one per saved frame) with the same keys passed to
        on_frame.

    Raises:
        FileNotFoundError: If the video file doesn't exist.
        ValueError: If args are bad, the file can't be opened, or the video's
                    duration/dimensions can't be read.
    """
    import cv2  # local import; see module docstring

    video_path = Path(video_path)
    if not video_path.exists():
        raise FileNotFoundError(f"Video file not found: {video_path}")
    if interval <= 0:
        raise ValueError("interval must be a positive number of seconds")
    if not (1 <= int(quality) <= 100):
        raise ValueError("quality must be between 1 and 100")

    # Step 1 — Open the video and read metadata. (See _open_capture.)
    cap, fps, frame_count, width, height = _open_capture(video_path)
    try:
        duration = frame_count / fps  # seconds

        # Step 2 — Decide where to write.
        if output_dir is None:
            output_dir = video_path.parent / f"{video_path.stem}-frames"
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Step 3 — Plan the timestamps to seek to.
        timestamps = _compute_timestamps(duration, interval)
        results = []

        # ──────────────────────────────────────────────────────────────────
        # Step 4 — Walk the timestamps SERIALLY.
        #
        # We tell OpenCV "go to T milliseconds" via CAP_PROP_POS_MSEC, then
        # cap.read() decodes the frame at (or just past) that point.
        # cap.read() returns (success, frame) where:
        #   success: bool — False at end-of-stream or on a decode error
        #   frame:   numpy.ndarray of shape (height, width, 3), dtype uint8.
        #            Pixel order is BGR, *not* RGB. (Legacy OpenCV convention
        #            from old image-format code; cv2.imwrite expects BGR
        #            input, so for save-and-load we don't need to convert.
        #            If you ever pass the array to matplotlib or PIL, do
        #            cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) first.)
        # ──────────────────────────────────────────────────────────────────
        for i, ts in enumerate(timestamps):
            cap.set(cv2.CAP_PROP_POS_MSEC, ts * 1000.0)
            success, frame = cap.read()
            if not success:
                # Decode failed at this timestamp — usually a flaky seek near
                # the end of a poorly-muxed file. Skip so one bad timestamp
                # doesn't kill the whole run.
                continue

            # Zero-pad so files sort lexically in any file browser.
            output_path = output_dir / f"frame-{i + 1:03d}.jpg"

            # imwrite encodes the in-memory numpy array and writes it to
            # disk. The third arg is per-format params: for JPEG, the
            # quality 1..100 (higher = larger file, less compression).
            cv2.imwrite(
                str(output_path),
                frame,
                [int(cv2.IMWRITE_JPEG_QUALITY), int(quality)],
            )

            info = {
                "path": str(output_path),
                "timestamp": ts,
                "frame_number": i + 1,
                "width": width,
                "height": height,
            }
            results.append(info)

            if on_frame is not None:
                on_frame(info)
            if on_progress is not None:
                on_progress((i + 1) / len(timestamps) * 100.0)

        return results
    finally:
        # Step 5 — Always release the capture.
        # Each VideoCapture holds an OS file handle and a decoder context.
        # Leaking these is fine for a script that exits anyway, but bad form
        # for a library that may be called many times in one process.
        cap.release()


def analyze_frame(image_data):
    """
    Score a single frame for sharpness and brightness.

    Designed for the browser path: Pyodide hands us each Canvas-extracted
    frame and we compute a Laplacian-variance focus score plus mean
    luminance. Returns plain Python types so Pyodide can convert the
    result straight into a JS object.

    Args:
        image_data: One of
          - base64 string (with or without `data:` URL prefix)
          - bytes / bytearray (raw JPEG/PNG/etc. file contents)
          - numpy.ndarray of shape (H, W) or (H, W, 3), dtype uint8

    Returns:
        dict with:
          width, height       — int pixels
          sharpness           — float, Laplacian variance (higher = sharper)
          mean_brightness     — float in [0, 255]

    Raises:
        TypeError if image_data is none of the supported types.
        ValueError if bytes can't be decoded as an image.
    """
    import numpy as np

    if isinstance(image_data, np.ndarray):
        return _analyze_array(image_data)

    if isinstance(image_data, str):
        # Strip data URL prefix if present (e.g. "data:image/jpeg;base64,...")
        if image_data.startswith("data:"):
            image_data = image_data.split(",", 1)[1]
        img_bytes = base64.b64decode(image_data)
    elif isinstance(image_data, (bytes, bytearray)):
        img_bytes = bytes(image_data)
    else:
        raise TypeError(
            f"Unsupported image_data type: {type(image_data).__name__}. "
            "Pass a base64 str, bytes, or a numpy ndarray."
        )

    # Decode JPEG/PNG bytes via Pillow. Pillow is light, pre-built for
    # Pyodide, and avoids pulling in cv2 just to decode an image.
    from PIL import Image

    try:
        with Image.open(io.BytesIO(img_bytes)) as im:
            im.load()
            arr = np.asarray(im.convert("RGB"))
    except Exception as e:  # noqa: BLE001  (Pillow raises a stew of types)
        raise ValueError(f"Could not decode image bytes: {e}") from e

    return _analyze_array(arr)


def _analyze_array(img):
    """Compute sharpness + brightness for a numpy image array.

    Uses a numpy-only Laplacian (no cv2 dependency), so this works in
    Pyodide with just numpy + Pillow loaded — no opencv-python needed.
    """
    import numpy as np

    h, w = img.shape[:2]

    # Luminance via standard weights. Works for either BGR or RGB inputs
    # because we only use the result to compute variance.
    if img.ndim == 3:
        gray = (
            0.299 * img[..., 0]
            + 0.587 * img[..., 1]
            + 0.114 * img[..., 2]
        ).astype(np.float32)
    else:
        gray = img.astype(np.float32)

    # Discrete 4-neighbour Laplacian via array slicing.
    # Kernel: [[0,1,0],[1,-4,1],[0,1,0]]
    lap = (
        -4 * gray[1:-1, 1:-1]
        + gray[:-2, 1:-1]
        + gray[2:, 1:-1]
        + gray[1:-1, :-2]
        + gray[1:-1, 2:]
    )

    return {
        "width": int(w),
        "height": int(h),
        "sharpness": float(lap.var()),
        "mean_brightness": float(gray.mean()),
    }


def _build_parser():
    parser = argparse.ArgumentParser(
        description="Extract still frames from a video at a fixed interval, using OpenCV.",
    )
    parser.add_argument("video", type=Path, help="Path to the input video file.")
    parser.add_argument(
        "--interval",
        type=float,
        default=1.0,
        help="Seconds between frames (default: 1.0).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output directory (default: <video-stem>-frames next to the video).",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=95,
        help="JPEG quality 1..100 (default: 95).",
    )
    return parser


def main(argv=None):
    args = _build_parser().parse_args(argv)

    # In-place percent line: only re-print when the whole-number percent
    # changes, so the terminal isn't flooded on long videos.
    last_whole = -1

    def on_progress(pct):
        nonlocal last_whole
        whole = int(pct)
        if whole != last_whole:
            last_whole = whole
            print(f"\rExtracting frames... {whole:3d}%", end="", flush=True)

    started = time.time()

    try:
        results = extract_frames(
            args.video,
            output_dir=args.output,
            interval=args.interval,
            quality=args.quality,
            on_progress=on_progress,
        )
    except (FileNotFoundError, ValueError) as e:
        print(f"\nError: {e}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("\nInterrupted.", file=sys.stderr)
        return 130

    elapsed = time.time() - started
    out_dir = args.output if args.output else (
        args.video.parent / f"{args.video.stem}-frames"
    )
    print()  # close the in-place progress line
    print(
        f"Extracted {len(results)} frame{'' if len(results) == 1 else 's'} "
        f"in {elapsed:.2f}s → {out_dir}"
    )
    return 0


# Skip the CLI entry point under Pyodide. Pyodide's runPython sets
# __name__ == "__main__" by default, which would otherwise call main() →
# argparse → SystemExit when we import this module from the browser.
if __name__ == "__main__" and sys.platform != "emscripten":
    sys.exit(main())
