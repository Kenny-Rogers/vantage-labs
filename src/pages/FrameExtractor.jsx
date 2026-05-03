import { useState, useEffect, useRef } from 'react';
import VideoDropZone from '../components/VideoDropZone';
import ProgressBar from '../components/ProgressBar';
import ImageGrid from '../components/ImageGrid';
import DownloadButton from '../components/DownloadButton';
import { extractFrames } from '../utils/videoProcessor';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

function FrameExtractor() {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'extracting' | 'done' | 'error'
  const [file, setFile] = useState(null);
  const [frames, setFrames] = useState([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [extractTotal, setExtractTotal] = useState(null);
  const [error, setError] = useState(null);

  // generationRef: every new extract or reset bumps this. Callbacks captured
  // by an in-flight extractFrames check it before mutating state — so if the
  // user hits "Start over" or navigates away mid-extraction, late frames
  // can't resurrect cleared state. We also revoke their object URLs inline
  // so they don't leak.
  const generationRef = useRef(0);
  // framesRef mirrors `frames` for synchronous access in cleanup paths.
  const framesRef = useRef([]);

  // Cleanup on unmount: invalidate any in-flight extraction and revoke every
  // thumbnail URL we created. Without this, navigating to Home and back
  // would leak Blob memory.
  useEffect(
    () => () => {
      generationRef.current += 1;
      framesRef.current.forEach((f) => URL.revokeObjectURL(f.thumbnailUrl));
      framesRef.current = [];
    },
    []
  );

  const handleExtract = async (selectedFile) => {
    generationRef.current += 1;
    const myGen = generationRef.current;
    framesRef.current = [];

    setFile(selectedFile);
    setFrames([]);
    setProgressPercent(0);
    setExtractTotal(null);
    setError(null);
    setPhase('extracting');

    // We don't know the total frame count until the first onProgress tick.
    // After 1 frame, percent = 100/total, so total = round(100/percent).
    // Compute it once and lock it in `knownTotal` for the rest of this run.
    let knownTotal = null;

    try {
      await extractFrames(selectedFile, {
        interval: 1,
        quality: 0.95,
        onProgress: (p) => {
          if (myGen !== generationRef.current) return;
          setProgressPercent(p);
          if (knownTotal === null && p > 0) {
            knownTotal = Math.round(100 / p);
            setExtractTotal(knownTotal);
          }
        },
        onFrame: (frame) => {
          if (myGen !== generationRef.current) {
            URL.revokeObjectURL(frame.thumbnailUrl);
            return;
          }
          framesRef.current = [...framesRef.current, frame];
          setFrames(framesRef.current);
        },
      });
      if (myGen === generationRef.current) setPhase('done');
    } catch (err) {
      if (myGen === generationRef.current) {
        setError(err.message || 'Something went wrong while extracting frames.');
        setPhase('error');
      }
    }
  };

  const handleStartOver = () => {
    generationRef.current += 1;
    framesRef.current.forEach((f) => URL.revokeObjectURL(f.thumbnailUrl));
    framesRef.current = [];
    setFile(null);
    setFrames([]);
    setProgressPercent(0);
    setExtractTotal(null);
    setError(null);
    setPhase('idle');
  };

  const zipFilename = file
    ? `${file.name.replace(/\.[^/.]+$/, '')}-frames.zip`
    : 'frames.zip';

  const showStage = phase === 'extracting' || phase === 'done';

  return (
    <div className="container">
      <header className="page-header">
        <h1>Frame Extractor</h1>
        <p>Extract high-res still frames from any video file.</p>
      </header>

      {phase !== 'idle' && file && (
        <div className="extract-toolbar">
          <span className="extract-toolbar-file">
            <strong>{file.name}</strong>
            <span> · {formatBytes(file.size)}</span>
          </span>
          <button type="button" className="btn-link" onClick={handleStartOver}>
            Start over
          </button>
        </div>
      )}

      {phase === 'idle' && <VideoDropZone onExtract={handleExtract} />}

      {showStage && (
        <div className="extract-stage">
          <ProgressBar
            percent={progressPercent}
            current={frames.length}
            total={extractTotal || 0}
            done={phase === 'done'}
          />
          <ImageGrid frames={frames} />
          {phase === 'done' && frames.length > 0 && (
            <div className="extract-actions">
              <DownloadButton
                mode="zip"
                frames={frames}
                filename={zipFilename}
              />
            </div>
          )}
        </div>
      )}

      {phase === 'error' && (
        <div className="drop-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default FrameExtractor;
