import { useState, useRef, useEffect } from 'react';

const MAX_BYTES = 500 * 1024 * 1024;
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const ACCEPTED_EXTENSIONS = ['.mp4', '.mov', '.webm'];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

function formatDuration(seconds) {
  if (seconds == null || !isFinite(seconds) || seconds < 0) return '-';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function isAcceptedVideo(file) {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function VideoDropZone({ onExtract }) {
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [duration, setDuration] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const dragDepth = useRef(0);

  // Revoke any object URL when it changes or on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const acceptFile = (f) => {
    if (!isAcceptedVideo(f)) {
      setError("That file format isn't supported. Try an MP4, MOV, or WebM video.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`That video is ${formatBytes(f.size)}. Please keep it under 500 MB.`);
      return;
    }
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setDuration(null);
    setError(null);
  };

  const reset = () => {
    setFile(null);
    setVideoUrl(null);
    setDuration(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDragEnter = (e) => {
    e.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setIsDragging(false);
    }
  };
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (e) => {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  };
  const onInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  };
  const openPicker = () => inputRef.current?.click();
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  };

  return (
    <div className="video-drop-zone">
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        className="visually-hidden"
        onChange={onInputChange}
      />

      {!file ? (
        <>
          <div
            className={`drop-area${isDragging ? ' dragging' : ''}`}
            onClick={openPicker}
            onKeyDown={onKeyDown}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            aria-label="Drop a video here, or click to select a file"
          >
            <svg
              className="upload-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="drop-title">Drop a video here</p>
            <p className="drop-hint">or click to select a file</p>
            <p className="drop-formats">MP4, MOV, or WebM · up to 500 MB</p>
          </div>
          {error && (
            <div className="drop-error" role="alert">
              {error}
            </div>
          )}
        </>
      ) : (
        <div className="video-preview">
          <video
            src={videoUrl}
            controls
            preload="metadata"
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          />
          <div className="video-meta">
            <span className="video-meta-name">{file.name}</span>
            <span className="video-meta-dot" aria-hidden="true">·</span>
            <span>{formatBytes(file.size)}</span>
            <span className="video-meta-dot" aria-hidden="true">·</span>
            <span>{formatDuration(duration)}</span>
          </div>
          <div className="video-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => onExtract?.(file)}
            >
              Extract Frames
            </button>
            <button type="button" className="btn-link" onClick={reset}>
              Choose another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoDropZone;
