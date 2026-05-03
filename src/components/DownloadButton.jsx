import { useState } from 'react';
import { downloadSingleFrame, downloadAllFrames } from '../utils/downloadHelper';

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ZipIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="10" y1="11" x2="10" y2="13" />
      <line x1="14" y1="13" x2="14" y2="15" />
      <line x1="10" y1="15" x2="10" y2="17" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="spinner"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DownloadButton({ mode, blob, filename, frames }) {
  const [busy, setBusy] = useState(false);
  const [percent, setPercent] = useState(0);

  if (mode === 'zip') {
    const count = frames?.length ?? 0;
    const handleZip = async () => {
      if (busy || count === 0) return;
      setBusy(true);
      setPercent(0);
      try {
        await downloadAllFrames(
          frames,
          filename || 'frames.zip',
          (p) => setPercent(Math.round(p))
        );
      } finally {
        setBusy(false);
        setPercent(0);
      }
    };

    return (
      <button
        type="button"
        className="btn-primary download-btn"
        onClick={handleZip}
        disabled={busy || count === 0}
      >
        {busy ? <Spinner /> : <ZipIcon />}
        <span>
          {busy ? `Zipping… ${percent}%` : `Download All (${count} frames)`}
        </span>
      </button>
    );
  }

  const handleSingle = () => {
    if (busy || !blob) return;
    downloadSingleFrame(blob, filename);
  };

  return (
    <button
      type="button"
      className="btn-primary download-btn"
      onClick={handleSingle}
      disabled={busy || !blob}
    >
      <DownloadIcon />
      <span>Download</span>
    </button>
  );
}

export default DownloadButton;
