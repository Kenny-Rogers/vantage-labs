import { useState } from 'react';
import ImageViewer from './ImageViewer';

const PREVIEW_LIMIT = 30;

function formatTimestamp(seconds) {
  if (seconds == null || !isFinite(seconds) || seconds < 0) return '—';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ImageGrid({ frames }) {
  const [showAll, setShowAll] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  if (!frames || frames.length === 0) return null;

  const visible =
    showAll || frames.length <= PREVIEW_LIMIT
      ? frames
      : frames.slice(0, PREVIEW_LIMIT);
  const hidden = frames.length - visible.length;

  return (
    <>
      <div className="image-grid">
        {visible.map((frame, index) => (
          <button
            key={frame.frameNumber}
            type="button"
            className="image-grid-item"
            onClick={() => setSelectedIndex(index)}
            aria-label={`Frame ${frame.frameNumber} at ${formatTimestamp(frame.timestamp)}`}
          >
            <img src={frame.thumbnailUrl} alt="" loading="lazy" />
            <span className="image-grid-timestamp">
              {formatTimestamp(frame.timestamp)}
            </span>
          </button>
        ))}
      </div>

      {hidden > 0 && (
        <div className="image-grid-show-all">
          <button
            type="button"
            className="btn-link"
            onClick={() => setShowAll(true)}
          >
            Show all {frames.length} frames
          </button>
        </div>
      )}

      {selectedIndex !== null && (
        <ImageViewer
          frames={frames}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}

export default ImageGrid;
