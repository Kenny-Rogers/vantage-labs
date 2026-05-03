/**
 * Pyodide loader — singleton, on-demand.
 *
 * ARCHITECTURE NOTES
 * ──────────────────
 * VantageLabs ships every CV tool in TWO forms:
 *   - a JavaScript implementation that runs in the browser via
 *     <video> / <canvas> / TypedArrays;
 *   - a Python implementation under python/ that runs as a CLI.
 *
 * Pyodide is what lets the SAME Python script run in the browser tab
 * too. It's CPython compiled to WebAssembly, so pure-Python packages
 * (and many C extensions, including numpy) work unchanged.
 *
 * Why this fits the roadmap:
 *   - The Sharpness Scorer (Laplacian variance), Color Segmentation
 *     (HSV thresholds via numpy), and a YOLOv8 inference path can all
 *     share Python code with their CLI siblings — no double maintenance.
 *   - Privacy story holds: Pyodide runs on the user's machine. No
 *     upload, no server.
 *   - The CLI scripts under python/ are fetched via HTTPS by Pyodide
 *     in the browser, so the in-browser tools always reflect the
 *     latest CLI code without a separate publish step.
 *
 * Why singleton:
 *   The Pyodide runtime is ~10 MB and takes a few seconds to boot.
 *   We initialise it lazily on first use and cache the resolved
 *   instance, so subsequent .py scripts reuse the same interpreter.
 *
 * Same script, two worlds:
 *   python/frame_extraction/extractor.py runs identically:
 *     - At the CLI:     python3 extractor.py video.mp4
 *     - In the browser: loadScript('/python/frame_extraction/extractor.py')
 *                       then call analyze_frame(...) via runPython.
 *   The library functions take the same arguments and return the same
 *   shapes; only the entry point differs (argparse vs. JS interop).
 */

import { useEffect, useState, useCallback } from 'react';

const PYODIDE_VERSION = '0.27.0';
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PYODIDE_SCRIPT = `${PYODIDE_CDN}pyodide.js`;

// Module-level cache so any number of components share one runtime.
let pyodidePromise = null;

/**
 * Inject the Pyodide loader <script> if it isn't already on the page.
 * Resolves once window.loadPyodide is callable.
 */
function loadPyodideScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Pyodide can only be loaded in a browser context.'));
      return;
    }
    if (window.loadPyodide) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${PYODIDE_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('The Pyodide loader script failed to load.'))
      );
      return;
    }
    const script = document.createElement('script');
    script.src = PYODIDE_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('The Pyodide loader script failed to load.'));
    document.head.appendChild(script);
  });
}

/**
 * Resolve a public asset path against CRA's PUBLIC_URL.
 * Pyodide runs in the browser, so paths must include the /vantage-labs/
 * prefix in production.
 */
function resolveAssetUrl(rawPath) {
  if (rawPath.startsWith('http')) return rawPath;
  const base = process.env.PUBLIC_URL || '';
  const sep = rawPath.startsWith('/') ? '' : '/';
  return `${base}${sep}${rawPath}`;
}

/**
 * Initialise Pyodide once, with numpy and micropip preloaded.
 * Subsequent calls return the cached instance.
 *
 * Resets the cached promise on failure so the next call retries
 * instead of returning a permanently rejected promise.
 */
export function getPyodide() {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = (async () => {
    await loadPyodideScript();
    const pyodide = await window.loadPyodide({ indexURL: PYODIDE_CDN });
    // numpy is the workhorse for image data; micropip lets us install
    // anything else later (opencv-python, torch, etc.).
    await pyodide.loadPackage(['numpy', 'micropip']);
    return pyodide;
  })().catch((err) => {
    pyodidePromise = null;
    throw new Error(
      `Could not start the Python runtime: ${err.message || err}`
    );
  });

  return pyodidePromise;
}

/**
 * Run a string of Python and return whatever the last expression
 * evaluates to, converted to a JS-side value where possible.
 */
export async function runPython(code) {
  const pyodide = await getPyodide();
  const result = await pyodide.runPythonAsync(code);
  if (result && typeof result.toJs === 'function') {
    const js = result.toJs({ dict_converter: Object.fromEntries });
    if (typeof result.destroy === 'function') result.destroy();
    return js;
  }
  return result;
}

/**
 * Fetch a .py file from the deployed /python/ folder and run it inside
 * Pyodide. After this resolves, every top-level function in the script
 * is callable via runPython(`my_func(...)`).
 *
 * `loadPackagesFromImports` discovers the script's imports (numpy, PIL,
 * etc.) and pulls them in automatically — so a script written for the
 * CLI works in the browser without us having to declare its packages.
 */
export async function loadScript(rawPath) {
  const pyodide = await getPyodide();
  const url = resolveAssetUrl(rawPath);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Could not fetch ${rawPath} (${res.status} ${res.statusText}).`
    );
  }
  const source = await res.text();
  await pyodide.loadPackagesFromImports(source);
  await pyodide.runPythonAsync(source);
}

/**
 * Install a Python package via micropip — for anything not bundled in
 * Pyodide's default index (e.g. some pure-Python wheels on PyPI).
 */
export async function installPackage(packageName) {
  const pyodide = await getPyodide();
  const micropip = pyodide.pyimport('micropip');
  await micropip.install(packageName);
}

/**
 * React hook for components that want to use Pyodide.
 *
 * Returns { pyodide, loading, error, ready, reload } so the UI can
 * show a spinner / error banner / fall back to the JS engine.
 *
 * The hook only kicks off the load when `enabled` is true, so you can
 * keep Pyodide opt-in: if the user never selects the Python engine,
 * the 10 MB runtime is never fetched.
 */
export function usePyodide({ enabled = true } = {}) {
  const [state, setState] = useState({
    pyodide: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    getPyodide()
      .then((py) => {
        if (cancelled) return;
        setState({ pyodide: py, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ pyodide: null, loading: false, error: err });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const reload = useCallback(() => {
    pyodidePromise = null;
    setState({ pyodide: null, loading: true, error: null });
    getPyodide()
      .then((py) => setState({ pyodide: py, loading: false, error: null }))
      .catch((err) =>
        setState({ pyodide: null, loading: false, error: err })
      );
  }, []);

  return {
    pyodide: state.pyodide,
    loading: state.loading,
    error: state.error,
    ready: !!state.pyodide && !state.loading,
    reload,
  };
}

const api = {
  getPyodide,
  runPython,
  loadScript,
  installPackage,
  usePyodide,
};

export default api;
