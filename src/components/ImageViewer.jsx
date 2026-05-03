import { useEffect, useRef } from 'react';

function formatTimestamp(seconds) {
  if (seconds == null || !isFinite(seconds) || seconds < 0) return '—';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function downloadFrame(frame) {
  const a = document.createElement('a');
  a.href = frame.thumbnailUrl;
  a.download = `frame-${String(frame.frameNumber).padStart(3, '0')}.jpg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function ImageViewer({ frames, selectedIndex, onSelect, onClose }) {
  const touchStartX = useRef(null);

  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex < frames.length - 1;

  // Keyboard: Esc closes, ←/→ navigate
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && hasPrev) onSelect(selectedIndex - 1);
      else if (e.key === 'ArrowRight' && hasNext) onSelect(selectedIndex + 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedIndex, hasPrev, hasNext, onSelect, onClose]);

  // Prevent the page behind the lightbox from scrolling
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (selectedIndex == null || !frames[selectedIndex]) return null;
  const frame = frames[selectedIndex];

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0 && hasNext) onSelect(selectedIndex + 1);
      else if (delta > 0 && hasPrev) onSelect(selectedIndex - 1);
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="viewer-backdrop"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label={`Frame ${frame.frameNumber} of ${frames.length}`}
    >
      <button
        type="button"
        className="viewer-close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <button
        type="button"
        className="viewer-nav viewer-nav-prev"
        onClick={(e) => {
          e.stopPropagation();
          if (hasPrev) onSelect(selectedIndex - 1);
        }}
        disabled={!hasPrev}
        aria-label="Previous frame"
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="viewer-content" onClick={(e) => e.stopPropagation()}>
        <img
          className="viewer-image"
          src={frame.thumbnailUrl}
          alt={`Frame ${frame.frameNumber}`}
        />
        <div className="viewer-caption">
          <span className="viewer-caption-ts">
            {formatTimestamp(frame.timestamp)}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Frame {frame.frameNumber} of {frames.length}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {frame.width} × {frame.height}
          </span>
        </div>
        <div className="viewer-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => downloadFrame(frame)}
          >
            Download
          </button>
        </div>
      </div>

      <button
        type="button"
        className="viewer-nav viewer-nav-next"
        onClick={(e) => {
          e.stopPropagation();
          if (hasNext) onSelect(selectedIndex + 1);
        }}
        disabled={!hasNext}
        aria-label="Next frame"
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

export default ImageViewer;
