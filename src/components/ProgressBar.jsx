function Checkmark() {
  return (
    <svg
      className="progress-check"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ProgressBar({ percent = 0, current = 0, total = 0, done }) {
  const isDone = done ?? (total > 0 && current >= total);
  const clamped = Math.max(0, Math.min(100, percent));
  const fillWidth = isDone ? 100 : clamped;
  const displayPct = Math.round(isDone ? 100 : clamped);

  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={displayPct}
    >
      <div className="progress-row">
        <div className="progress-track">
          <div
            className={`progress-fill${isDone ? ' done' : ''}`}
            style={{ width: `${fillWidth}%` }}
          />
        </div>
        <span className="progress-percent">{displayPct}%</span>
      </div>
      <div className={`progress-status${isDone ? ' done' : ''}`}>
        {isDone ? (
          <>
            <Checkmark />
            <span>Done! {total} frames extracted</span>
          </>
        ) : (
          <span>
            {total > 0
              ? `Extracting frame ${current} of ${total}...`
              : 'Preparing...'}
          </span>
        )}
      </div>
    </div>
  );
}

export default ProgressBar;
