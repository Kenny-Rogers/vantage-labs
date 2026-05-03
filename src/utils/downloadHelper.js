// Download helpers for single frame and ZIP export.
//
// JSZip is heavy (~30 KB gzipped). It's loaded on demand so users who never
// click "Download All" don't pay for it on initial page load.

function triggerDownload(href, filename) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadSingleFrame(blob, filename) {
  if (!(blob instanceof Blob)) {
    throw new Error('downloadSingleFrame expects a Blob.');
  }
  const url = URL.createObjectURL(blob);
  try {
    triggerDownload(url, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function downloadAllFrames(frames, zipFilename = 'frames.zip', onProgress) {
  if (!Array.isArray(frames) || frames.length === 0) {
    throw new Error('downloadAllFrames expects a non-empty array of frames.');
  }

  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  for (const { blob, frameNumber } of frames) {
    const name = `frame-${String(frameNumber).padStart(3, '0')}.jpg`;
    zip.file(name, blob);
  }

  // STORE = no compression. JPEGs are already compressed; running DEFLATE
  // on top burns CPU for ~0% size gain.
  const zipBlob = await zip.generateAsync(
    { type: 'blob', compression: 'STORE' },
    (metadata) => onProgress?.(metadata.percent)
  );

  const url = URL.createObjectURL(zipBlob);
  try {
    triggerDownload(url, zipFilename);
  } finally {
    URL.revokeObjectURL(url);
  }
}
