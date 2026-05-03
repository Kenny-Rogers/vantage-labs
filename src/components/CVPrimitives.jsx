// CV-overlay primitives — placeholder image plus the five overlay
// styles from the design (boxes / mask / keypoints / depth / edges)
// and the hero's scanning reticle. Pure SVG, no dependencies.

const PALETTES = {
  warm: ['#cfc6b1', '#bdb39a', '#a89e85', '#928871'],
  cool: ['#b8bdc1', '#a3a9af', '#8d949b', '#777e86'],
  sepia: ['#d3c5a8', '#bcad8c', '#a39472', '#8c7d5c'],
  forest: ['#9aa893', '#8a9883', '#7a8773', '#6a7763'],
  dusk: ['#a8a3b6', '#928da3', '#7c7790', '#67627c'],
  paper: ['#e7e1d3', '#dcd5c4', '#cec6b3', '#bfb6a1'],
};

export function Stripes({ seed = 0, label = 'image', caption = '', hue = 'warm' }) {
  const colors = PALETTES[hue] || PALETTES.warm;

  // Deterministic-looking horizontal-bar placeholder. LCG so the same
  // seed yields the same pattern across renders.
  let r = seed * 9301 + 49297;
  const rand = () => {
    r = (r * 9301 + 49297) % 233280;
    return r / 233280;
  };
  const bars = [];
  let y = 0;
  while (y < 100) {
    const h = 4 + rand() * 14;
    bars.push({ y, h, c: colors[Math.floor(rand() * colors.length)] });
    y += h;
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: colors[0],
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        {bars.map((b, i) => (
          <rect
            key={i}
            x="0"
            y={b.y}
            width="100"
            height={b.h}
            fill={b.c}
            opacity="0.85"
          />
        ))}
        <radialGradient id={`vg${seed}`} cx="50%" cy="40%" r="70%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.18" />
        </radialGradient>
        <rect x="0" y="0" width="100" height="100" fill={`url(#vg${seed})`} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 12,
          bottom: 10,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.85)',
          mixBlendMode: 'difference',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: 'currentColor',
          }}
        />
        {label}
        {caption ? <span style={{ opacity: 0.65 }}>· {caption}</span> : null}
      </div>
    </div>
  );
}

export function BoxesOverlay({ boxes = [], visible = true }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.35s ease',
        pointerEvents: 'none',
      }}
    >
      {boxes.map((b, i) => (
        <g key={i}>
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="0.4"
            vectorEffect="non-scaling-stroke"
          />
          {[
            [b.x, b.y, 1.6, 0, 0, 1.6],
            [b.x + b.w, b.y, -1.6, 0, 0, 1.6],
            [b.x, b.y + b.h, 1.6, 0, 0, -1.6],
            [b.x + b.w, b.y + b.h, -1.6, 0, 0, -1.6],
          ].map((c, j) => (
            <g key={j}>
              <line
                x1={c[0]}
                y1={c[1]}
                x2={c[0] + c[2]}
                y2={c[1] + c[3]}
                stroke="var(--accent)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={c[0]}
                y1={c[1]}
                x2={c[0] + c[4]}
                y2={c[1] + c[5]}
                stroke="var(--accent)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </g>
      ))}
      {boxes.map((b, i) => (
        <foreignObject
          key={`l${i}`}
          x={b.x}
          y={Math.max(0, b.y - 4)}
          width="40"
          height="4"
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              font: '500 2.1px var(--mono)',
              color: '#fff',
              background: 'var(--accent)',
              padding: '0.4px 1.2px',
              display: 'inline-block',
              letterSpacing: '0.04em',
            }}
          >
            {b.label} · {b.conf}
          </div>
        </foreignObject>
      ))}
    </svg>
  );
}

export function MaskOverlay({ visible = true, paths = [] }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: visible ? 0.55 : 0,
        transition: 'opacity 0.35s ease',
        pointerEvents: 'none',
        mixBlendMode: 'multiply',
      }}
    >
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.c} opacity={0.85} />
      ))}
    </svg>
  );
}

export function KeypointsOverlay({ visible = true, points = [], links = [] }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.35s ease',
        pointerEvents: 'none',
      }}
    >
      {links.map((l, i) => (
        <line
          key={i}
          x1={points[l[0]].x}
          y1={points[l[0]].y}
          x2={points[l[1]].x}
          y2={points[l[1]].y}
          stroke="var(--accent)"
          strokeWidth="0.6"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="0.9"
          fill="#fff"
          stroke="var(--accent)"
          strokeWidth="0.4"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

export function HeatOverlay({ visible = true, mode = 'depth', seed = 0 }) {
  const stops = ['#1a1a17', '#5a3a2a', '#b06a3a', '#f0c878', '#fff5dd'];
  const idA = `heatA-${seed}-${mode}`;
  const idB = `heatB-${seed}-${mode}`;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: visible ? 0.85 : 0,
        transition: 'opacity 0.35s ease',
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }}
    >
      <defs>
        <radialGradient id={idA} cx="40%" cy="55%" r="60%">
          {stops.map((s, i) => (
            <stop
              key={i}
              offset={`${(i / (stops.length - 1)) * 100}%`}
              stopColor={s}
            />
          ))}
        </radialGradient>
        <radialGradient id={idB} cx="75%" cy="35%" r="35%">
          {stops.map((s, i) => (
            <stop
              key={i}
              offset={`${(i / (stops.length - 1)) * 100}%`}
              stopColor={s}
              stopOpacity={1 - i * 0.15}
            />
          ))}
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill={`url(#${idA})`} />
      <rect
        x="0"
        y="0"
        width="100"
        height="100"
        fill={`url(#${idB})`}
        opacity="0.7"
      />
    </svg>
  );
}

export function EdgeOverlay({ visible = true, seed = 1 }) {
  let r = seed * 7919;
  const rand = () => {
    r = (r * 9301 + 49297) % 233280;
    return r / 233280;
  };
  const lines = Array.from({ length: 28 }).map(() => ({
    x1: rand() * 100,
    y1: rand() * 100,
    x2: rand() * 100,
    y2: rand() * 100,
  }));
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.35s ease',
        pointerEvents: 'none',
        background: visible ? 'rgba(0,0,0,0.55)' : 'transparent',
      }}
    >
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="#fff"
          strokeOpacity="0.6"
          strokeWidth="0.25"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

export function ScanReticle({ active = true }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: active ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    >
      <div className="vl-scan-line" />
    </div>
  );
}
