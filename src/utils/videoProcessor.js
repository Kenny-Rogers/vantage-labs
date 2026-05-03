/**
 * videoProcessor.js — extract still frames from a video file, in the browser.
 *
 * No server, no library, no upload. The user's video stays on their machine.
 * We use three browser APIs together:
 *
 *   1. URL.createObjectURL — gives us a temporary URL that points at a File
 *                            (the binary data the user just dropped on us).
 *   2. <video>             — knows how to decode H.264 / VP9 / AV1 etc., and
 *                            can be told to seek to any timestamp.
 *   3. <canvas>            — we paint the video's current frame onto it,
 *                            then ask it to encode that frame as a JPEG.
 *
 * USAGE:
 *   const frames = await extractFrames(file, {
 *     interval: 1,              // seconds between frames (default 1)
 *     quality: 0.95,            // JPEG quality 0..1 (default 0.95)
 *     onProgress: (pct) => ..., // called with 0..100 as work proceeds
 *     onFrame:   (f)  => ...,   // called once per frame, as soon as it's ready
 *   });
 *
 *   Each frame is:
 *     { blob, thumbnailUrl, timestamp, frameNumber, width, height }
 *
 *   The CALLER owns each frame's `thumbnailUrl` — call URL.revokeObjectURL
 *   on it when you're done displaying / downloading the frame, or the
 *   browser will keep the underlying Blob alive and memory will pile up.
 */

const DEFAULTS = {
  interval: 1,
  quality: 0.95,
  onProgress: null,
  onFrame: null,
};

// Map the four standard MediaError codes to copy a human can act on.
// (HTMLMediaElement.error.code values, per the HTML spec.)
const MEDIA_ERROR_MESSAGES = {
  1: 'Video loading was aborted.',
  2: 'A network error stopped the video from loading.',
  3: 'The video could not be decoded — the file may be corrupt.',
  4: "This video format or codec isn't supported by your browser.",
};

/**
 * Promise wrapper around an event-driven element.
 *
 * The <video> API is push-based — it fires events when ready. Async/await is
 * pull-based. This bridge lets us write `await waitFor(video, 'seeked')` and
 * read like normal sequential code.
 *
 * Resolves on the first `event`. Rejects on `error` or after `timeoutMs`.
 */
function waitFor(target, event, { errorEvent = 'error', timeoutMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      target.removeEventListener(event, onSuccess);
      target.removeEventListener(errorEvent, onError);
      clearTimeout(timer);
    };

    const onSuccess = (e) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(e);
    };

    const onError = () => {
      if (settled) return;
      settled = true;
      cleanup();
      const code = target.error?.code;
      reject(new Error(MEDIA_ERROR_MESSAGES[code] || `Video error (code ${code ?? 'unknown'}).`));
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(`Timed out waiting for "${event}" — the file may be too slow to decode.`));
    }, timeoutMs);

    target.addEventListener(event, onSuccess);
    target.addEventListener(errorEvent, onError);
  });
}

/**
 * canvas.toBlob is callback-based; this is the awaitable version.
 * The browser does the JPEG encoding off the main thread when it can.
 */
function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas could not encode the frame to a Blob.'));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Extract still frames from a video File at fixed time intervals.
 *
 * Returns a Promise that resolves with the full array of frameData once the
 * last frame has been emitted via onFrame.
 */
export async function extractFrames(file, options = {}) {
  const { interval, quality, onProgress, onFrame } = { ...DEFAULTS, ...options };

  // ──────────────────────────────────────────────────────────────────────
  // Validate inputs early so the caller gets a clear error before we spin
  // up a video element.
  // ──────────────────────────────────────────────────────────────────────
  if (!(file instanceof Blob)) {
    throw new Error('extractFrames expects a File or Blob as the first argument.');
  }
  if (!Number.isFinite(interval) || interval <= 0) {
    throw new Error('options.interval must be a positive number of seconds.');
  }
  if (!Number.isFinite(quality) || quality <= 0 || quality > 1) {
    throw new Error('options.quality must be a number between 0 (exclusive) and 1.');
  }

  // ──────────────────────────────────────────────────────────────────────
  // Step 1 — Create a hidden <video> and a <canvas> we control.
  //
  // The video is attached to the document but visually hidden. Some browsers
  // (notably Safari) won't reliably render frames into a fully-detached
  // video element, so we keep it in the DOM but offscreen.
  //
  // The canvas is just a memory buffer — it never touches the DOM.
  // ──────────────────────────────────────────────────────────────────────
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;        // some autoplay/seek code paths require muted
  video.playsInline = true;  // iOS: don't try to enter fullscreen
  Object.assign(video.style, {
    position: 'fixed',
    left: '-9999px',
    top: '0',
    width: '1px',
    height: '1px',
    opacity: '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(video);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Give the video element a URL backed by the local File. This URL is only
  // valid in this tab and only until we revokeObjectURL it.
  const sourceUrl = URL.createObjectURL(file);
  video.src = sourceUrl;

  const frames = [];

  try {
    // ────────────────────────────────────────────────────────────────────
    // Step 2 — Wait for the browser to read the file's container header.
    //
    // Without this, video.duration / videoWidth / videoHeight are NaN/0.
    // 'loadedmetadata' fires after just enough of the file is parsed to
    // know those values — usually a few KB, not the whole file.
    //
    // If the codec isn't supported (e.g. some HEVC variants on Firefox),
    // this is also where we'll find out, via an 'error' event with
    // MediaError code 4 — handled inside waitFor.
    // ────────────────────────────────────────────────────────────────────
    await waitFor(video, 'loadedmetadata');

    const { duration, videoWidth, videoHeight } = video;

    // Some files report duration = Infinity (rare WebM streams without a
    // duration cue) or 0 (corrupt). We can't seek through what we can't
    // measure, so bail with a clear message.
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("We couldn't read this video's duration — the file may be corrupt or in an unusual format.");
    }
    if (!videoWidth || !videoHeight) {
      throw new Error("We couldn't read this video's dimensions.");
    }

    // ────────────────────────────────────────────────────────────────────
    // Step 3 — Size the canvas to match the video's NATIVE resolution.
    //
    // We want full-quality stills, so we don't downscale here. drawImage
    // will paint each video frame at its true pixel size; if the caller
    // wants thumbnails or a smaller export, that's a transform on top.
    // ────────────────────────────────────────────────────────────────────
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // ────────────────────────────────────────────────────────────────────
    // Step 4 — Build the list of timestamps we'll seek to.
    //
    // Always include t=0 (the first frame), then step forward by the
    // requested interval. We stop as soon as the next step would meet or
    // pass the duration — seeking exactly to `duration` is undefined-ish
    // across browsers and tends to error or yield a black frame.
    //
    // For very short videos (duration < interval) the loop runs once at
    // t=0 — i.e. one frame, which is the only sensible behaviour.
    // ────────────────────────────────────────────────────────────────────
    const timestamps = [];
    for (let t = 0; t < duration; t += interval) {
      timestamps.push(t);
    }
    if (timestamps.length === 0) {
      timestamps.push(0);
    }

    onProgress?.(0);

    // ────────────────────────────────────────────────────────────────────
    // Step 5 — Walk the timestamps SERIALLY.
    //
    // A <video> element has one decoder; you can only seek to one place at
    // a time. Trying to parallelise this just creates a queue against the
    // same decoder and slows things down (or breaks).
    // ────────────────────────────────────────────────────────────────────
    for (let i = 0; i < timestamps.length; i++) {
      const requested = timestamps[i];

      // Setting currentTime triggers an asynchronous seek. The 'seeked'
      // event fires once the new frame has been decoded and is ready to
      // paint — that's the green light to call drawImage.
      video.currentTime = requested;
      await waitFor(video, 'seeked');

      // The browser may have rounded the seek to the nearest available
      // frame boundary, so the actual time can differ slightly from what
      // we asked for. Record what really happened.
      const actualTime = video.currentTime;

      // Paint the current video frame onto the canvas.
      // (video, dx, dy, dw, dh) — full frame, no scaling.
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

      // Encode the canvas pixels as a JPEG. JPEG compresses photographic
      // content far better than PNG, and at quality ~0.95 the difference
      // is invisible to the eye but the file is dramatically smaller.
      const blob = await canvasToBlob(canvas, 'image/jpeg', quality);

      // Object URL for previewing this frame in an <img src=...>. The
      // caller is responsible for revoking it.
      const thumbnailUrl = URL.createObjectURL(blob);

      const frameData = {
        blob,
        thumbnailUrl,
        timestamp: actualTime,
        frameNumber: i + 1,
        width: videoWidth,
        height: videoHeight,
      };

      frames.push(frameData);
      onFrame?.(frameData);
      onProgress?.(((i + 1) / timestamps.length) * 100);
    }

    return frames;
  } finally {
    // ────────────────────────────────────────────────────────────────────
    // Step 6 — Release everything we allocated, no matter how we exit.
    //
    // Revoking the source URL lets the browser drop its reference to the
    // File data. Removing the video element lets the GC clean up the
    // decoder. (We deliberately do NOT revoke the per-frame thumbnail
    // URLs — those belong to the caller until they're done with them.)
    // ────────────────────────────────────────────────────────────────────
    URL.revokeObjectURL(sourceUrl);
    video.removeAttribute('src');
    video.load();
    video.remove();
  }
}

export default extractFrames;
