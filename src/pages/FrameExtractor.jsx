import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import VideoDropZone from '../components/VideoDropZone';
import ProgressBar from '../components/ProgressBar';
import ImageGrid from '../components/ImageGrid';
import DownloadButton from '../components/DownloadButton';
import { extractFrames } from '../utils/videoProcessor';
import { usePyodide, loadScript } from '../utils/pyodideLoader';

const PY_SCRIPT_PATH = '/python/frame_extraction/extractor.py';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

// Read a Blob as a base64 string (the body, no `data:` URL prefix).
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(typeof result === 'string' ? result.split(',', 2)[1] : '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function EngineToggle({ engine, onChange, disabled }) {
  const options = [
    { value: 'js', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
  ];
  return (
    <div className="engine-toggle" role="group" aria-label="Compute engine">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          data-active={engine === opt.value}
          onClick={() => onChange(opt.value)}
          disabled={disabled}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function FrameExtractor() {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'extracting' | 'done' | 'error'
  const [file, setFile] = useState(null);
  const [frames, setFrames] = useState([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [extractTotal, setExtractTotal] = useState(null);
  const [error, setError] = useState(null);

  // ── Engine selection (JS default; Python opt-in via Pyodide) ──────────
  const [engine, setEngine] = useState('js');
  const [scores, setScores] = useState({});           // { [frameNumber]: { sharpness, ... } }
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState(null);

  // Only fetch the 10 MB Pyodide runtime when the user actually picks Python.
  const pyodideEnabled = engine === 'python';
  const {
    pyodide,
    loading: pyLoading,
    error: pyError,
  } = usePyodide({ enabled: pyodideEnabled });

  // generationRef: every new extract or reset bumps this. Callbacks captured
  // by an in-flight extractFrames check it before mutating state — so if the
  // user hits "Start over" or navigates away mid-extraction, late frames
  // can't resurrect cleared state. We also revoke their object URLs inline
  // so they don't leak.
  const generationRef = useRef(0);
  const framesRef = useRef([]);

  // Cleanup on unmount.
  useEffect(
    () => () => {
      generationRef.current += 1;
      framesRef.current.forEach((f) => URL.revokeObjectURL(f.thumbnailUrl));
      framesRef.current = [];
    },
    []
  );

  // When Pyodide is ready, load extractor.py once. Subsequent runs reuse it.
  useEffect(() => {
    if (!pyodide || scriptReady) return undefined;
    let cancelled = false;
    loadScript(PY_SCRIPT_PATH)
      .then(() => {
        if (cancelled) return;
        setScriptReady(true);
        setScriptError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setScriptError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [pyodide, scriptReady]);

  // If Pyodide or the script fails to load, transparently fall back to JS.
  // The status pill below the title surfaces what happened.
  useEffect(() => {
    if ((pyError || scriptError) && engine === 'python') {
      setEngine('js');
    }
  }, [pyError, scriptError, engine]);

  // Score a frame in Python. Best-effort and async — failures are logged
  // and the JS extraction keeps going.
  const scoreFrameInPython = useCallback(
    async (frame, gen) => {
      if (!pyodide || !scriptReady) return;
      let result = null;
      try {
        const b64 = await blobToBase64(frame.blob);
        if (gen !== generationRef.current) return;
        // Pass through pyodide.globals so we don't string-interpolate a
        // huge base64 blob into the source we hand to runPythonAsync.
        pyodide.globals.set('vl_image_b64', b64);
        result = await pyodide.runPythonAsync(
          'analyze_frame(vl_image_b64)'
        );
        pyodide.globals.delete('vl_image_b64');
        if (gen !== generationRef.current) return;
        const obj =
          result && typeof result.toJs === 'function'
            ? result.toJs({ dict_converter: Object.fromEntries })
            : result;
        setScores((prev) => ({ ...prev, [frame.frameNumber]: obj }));
      } catch (e) {
        // Per-frame failures shouldn't break the run.
        // eslint-disable-next-line no-console
        console.warn(
          `[Python] sharpness analysis failed for frame ${frame.frameNumber}:`,
          e
        );
      } finally {
        if (result && typeof result.destroy === 'function') result.destroy();
      }
    },
    [pyodide, scriptReady]
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
    setScores({});
    setPhase('extracting');

    // Capture once — if the user toggles engines mid-extraction, this run
    // sticks with whatever was selected when the user clicked Extract.
    const usePython = engine === 'python' && !!pyodide && scriptReady;
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
          if (usePython) {
            // Fire-and-forget; the next seek can start before this finishes.
            scoreFrameInPython(frame, myGen);
          }
        },
      });
      if (myGen === generationRef.current) setPhase('done');
    } catch (err) {
      if (myGen === generationRef.current) {
        setError(
          err.message || 'Something went wrong while extracting frames.'
        );
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
    setScores({});
    setPhase('idle');
  };

  const zipFilename = file
    ? `${file.name.replace(/\.[^/.]+$/, '')}-frames.zip`
    : 'frames.zip';

  const showStage = phase === 'extracting' || phase === 'done';
  const pythonActive = engine === 'python' && !!pyodide && scriptReady;
  const scoredCount = Object.keys(scores).length;

  // Build the inline status line for the engine row.
  let pythonStatus = null;
  if (engine === 'python') {
    if (pyError) {
      pythonStatus = {
        kind: 'error',
        text: 'Couldn’t start Python. Falling back to JavaScript.',
      };
    } else if (scriptError) {
      pythonStatus = {
        kind: 'error',
        text: 'Couldn’t load extractor.py. Falling back to JavaScript.',
      };
    } else if (pyLoading || !pyodide) {
      pythonStatus = { kind: 'info', text: 'Loading Python runtime…' };
    } else if (!scriptReady) {
      pythonStatus = { kind: 'info', text: 'Loading extractor.py…' };
    } else {
      pythonStatus = { kind: 'ok', text: 'Ready' };
    }
  }

  return (
    <div className="container">
      <Helmet>
        <title>Frame Extractor · VantageLabs</title>
        <meta
          name="description"
          content="Pull high-resolution stills from any video at a chosen interval. Runs entirely in your browser via Canvas API. Supports MP4, MOV, WebM. No upload, no server."
        />
        <link rel="canonical" href="https://vantage.lodonu.dev/frame-extractor" />
      </Helmet>
      <header className="page-header">
        <h1>Frame Extractor</h1>
        <p>Extract high-res still frames from any video file.</p>
        <div className="engine-row">
          <span className="mono engine-label">Engine</span>
          <EngineToggle
            engine={engine}
            onChange={setEngine}
            disabled={phase === 'extracting'}
          />
          {pythonStatus && (
            <span className="engine-status" data-kind={pythonStatus.kind}>
              {pythonStatus.text}
            </span>
          )}
        </div>
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
          {pythonActive && scoredCount > 0 && (
            <div
              className="python-badge"
              title="Frame metrics computed in-browser by Pyodide running python/frame_extraction/extractor.analyze_frame"
            >
              <span className="python-badge-dot" aria-hidden="true" />
              Powered by Python · {scoredCount} frame
              {scoredCount === 1 ? '' : 's'} analysed
            </div>
          )}
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
