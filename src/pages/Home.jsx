import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Stripes,
  BoxesOverlay,
  MaskOverlay,
  HeatOverlay,
  EdgeOverlay,
} from '../components/CVPrimitives';

const PROJECTS = [
  {
    n: '01',
    title: 'Frame Extractor',
    kind: 'Frame Extraction',
    desc: 'Pull high-resolution stills from any video at a chosen interval. Runs entirely in your browser via Canvas API. No upload, no server.',
    overlay: 'edges',
    hue: 'cool',
    img: 'frame_stream.mp4',
    href: '/frame-extractor',
    status: 'live',
    span: 'wide',
    metrics: [
      ['formats', 'MP4·MOV·WebM'],
      ['max size', '500 MB'],
      ['runtime', 'in-browser'],
    ],
  },
  {
    n: '02',
    title: 'Sharpness Scorer',
    kind: 'Image Quality',
    desc: "Rank extracted frames by sharpness using Laplacian variance, so the cleanest shots float to the top automatically.",
    overlay: 'depth',
    hue: 'sepia',
    img: 'frames_18.jpg',
    href: '/sharpness-scorer',
    status: 'soon',
    metrics: [
      ['metric', 'Laplacian var'],
      ['status', 'planned'],
    ],
  },
  {
    n: '03',
    title: 'Color Segmentation',
    kind: 'Semantic Segmentation',
    desc: 'Classify aerial imagery into vegetation, water, and built areas using HSV thresholds. A small, transparent baseline before learning-based segmenters.',
    overlay: 'mask',
    hue: 'forest',
    img: 'meadow_07.jpg',
    href: '/color-segmentation',
    status: 'soon',
    metrics: [
      ['classes', '3'],
      ['method', 'HSV'],
    ],
  },
  {
    n: '04',
    title: 'Object Detection',
    kind: 'Object Detection',
    desc: 'YOLOv8 in the browser via ONNX Runtime Web. No upload, no server. Your images never leave your machine.',
    overlay: 'boxes',
    hue: 'dusk',
    img: 'street_22.jpg',
    href: '/object-detection',
    status: 'soon',
    metrics: [
      ['model', 'YOLOv8'],
      ['target', 'in-browser'],
    ],
  },
  {
    n: '05',
    title: 'Traffic Analysis',
    kind: 'Tracking & Counting',
    desc: 'Count and track vehicles from aerial footage, with a heatmap overlay that surfaces congested lanes and intersections at a glance.',
    overlay: 'boxes',
    hue: 'warm',
    img: 'plaza_14.jpg',
    href: '/traffic-analysis',
    status: 'soon',
    metrics: [
      ['output', 'heatmap'],
      ['tracker', 'ByteTrack'],
    ],
  },
  {
    n: '06',
    title: 'Aerial Mapper',
    kind: 'Photogrammetry',
    desc: 'Stitch overlapping aerial photos into a single orthomosaic. Useful for surveying, agriculture, and mapping side-projects.',
    overlay: 'depth',
    hue: 'paper',
    img: 'survey_31.jpg',
    href: '/aerial-mapper',
    status: 'soon',
    span: 'wide',
    metrics: [
      ['output', 'orthomosaic'],
      ['method', 'feature-match'],
    ],
  },
];

const SAMPLE_BOXES = [
  { x: 18, y: 30, w: 24, h: 40, label: 'person', conf: '0.94' },
  { x: 52, y: 42, w: 28, h: 30, label: 'bicycle', conf: '0.86' },
];
const SAMPLE_SEG = [
  { d: 'M0 70 Q 30 55, 60 72 T 100 65 L 100 100 L 0 100 Z', c: 'var(--accent)' },
  { d: 'M20 14 q14 -8 28 4 q4 14 -10 22 q-18 4 -22 -8 z', c: '#3a3a37' },
];

function Hero() {
  return (
    <header className="hero-section">
      <div className="wrap">
        <div className="mono eyebrow" style={{ marginBottom: 28 }}>
          <span>Index №01 · Vision systems &amp; experiments · MMXXVI</span>
        </div>

        <h1>
          Teaching machines<br />
          to <span className="italic">see</span> what we see.
        </h1>

        <div className="hero-grid">
          <p className="lead" style={{ maxWidth: '44ch' }}>
            A working studio for computer-vision systems: detectors,
            segmenters, pose estimators, depth networks, built to run on
            everyday photographs, not just aerial footage.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              className="mono"
              style={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <span>currently shipping</span>
              <span>↦ 06 systems</span>
            </div>
            <div className="hairline" />
            <div className="hero-tags">
              {[
                'Detection',
                'Segmentation',
                'Pose',
                'Depth',
                'OCR',
                'Tracking',
                'Diffusion',
              ].map((t) => (
                <span key={t} className="hero-tag">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function ProjectCard({ p, idx }) {
  return (
    <article className="project-card" data-span={p.span}>
      <Link
        to={p.href}
        className="project-card-image"
        style={{ display: 'block', position: 'relative', aspectRatio: 'inherit' }}
        aria-label={`${p.title}: ${p.kind}`}
      >
        <Stripes
          seed={idx + 7}
          hue={p.hue}
          label={p.img}
          caption="placeholder"
        />

        <div className="project-card-overlay">
          {p.overlay === 'boxes' && <BoxesOverlay boxes={SAMPLE_BOXES} visible />}
          {p.overlay === 'mask' && <MaskOverlay paths={SAMPLE_SEG} visible />}
          {p.overlay === 'depth' && <HeatOverlay mode="depth" visible seed={idx} />}
          {p.overlay === 'edges' && <EdgeOverlay visible seed={idx + 3} />}
        </div>

        <div className="project-card-watermark">{p.n}</div>
        <div className="project-card-tag mono">{p.kind}</div>
        <div
          className="project-card-status"
          data-live={p.status === 'live'}
        >
          {p.status === 'live' && <span className="dot" />}
          <span>{p.status === 'live' ? 'live' : 'soon'}</span>
        </div>
      </Link>

      <div className="project-card-head">
        <h3 style={{ flex: 1 }}>
          <span className="project-card-num">{p.n}</span>
          {p.title}
        </h3>
        <Link to={p.href} className="project-card-arrow" aria-hidden="true">
          ↗
        </Link>
      </div>

      <p className="project-card-desc">{p.desc}</p>

      {p.metrics && (
        <dl className="project-card-metrics">
          {p.metrics.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}

function ProjectsIndex() {
  return (
    <ol className="projects-index">
      {PROJECTS.map((p) => (
        <li key={p.n} onClick={(e) => {
          // Make the whole row clickable, navigating via the inner Link
          const link = e.currentTarget.querySelector('a');
          if (link && e.target.tagName !== 'A') link.click();
        }}>
          <span className="mono" style={{ color: 'var(--muted)' }}>{p.n}</span>
          <Link to={p.href} className="pi-title">
            {p.title}
          </Link>
          <span className="mono pi-kind">{p.kind}</span>
          <span className="mono pi-view">
            {p.status === 'live' ? 'try ↓' : 'view ↓'}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Projects() {
  return (
    <section id="work">
      <div className="wrap">
        <div className="projects-header">
          <div>
            <div className="mono eyebrow" style={{ marginBottom: 18 }}>
              <span>§ Selected work · 2024-2026 · 06 entries</span>
            </div>
            <h2>
              An index of <span className="italic">visual</span> systems,
              <br />
              built and tuned in the open.
            </h2>
          </div>
          <p className="lead" style={{ maxWidth: '34ch', margin: 0 }}>
            One live, the rest in flight. Each entry will eventually ship with
            weights, training notes, and a small interactive demo.
          </p>
        </div>

        <ProjectsIndex />

        <div className="projects-grid">
          {PROJECTS.map((p, i) => (
            <ProjectCard key={p.n} p={p} idx={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about">
      <div className="wrap">
        <div className="about-grid">
          <div>
            <div className="mono eyebrow" style={{ marginBottom: 18 }}>
              <span>§ Notes from the lab</span>
            </div>
            <h2>
              A practice, not a <span className="italic">product</span>.
            </h2>
          </div>
          <div className="about-body">
            <p>
              VantageLabs began as a sandbox for drone footage. It's since
              broadened into a working studio for vision systems on any image:
              streets, studios, manuscripts, kitchens.
            </p>
            <p>
              Each project is built end to end: data, training, evaluation, and
              a small artefact you can try in the browser. Code, weights, and
              the things that didn't work are written down alongside the things
              that did.
            </p>
          </div>
        </div>

        <div className="stats-grid">
          {[
            ['01', 'Live tool'],
            ['05', 'In progress'],
            ['100%', 'In-browser'],
            ['MIT', 'License, where I can'],
          ].map(([k, v]) => (
            <div key={v}>
              <div className="stat-num">{k}</div>
              <div className="mono" style={{ marginTop: 10 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Home() {
  return (
    <>
      <Helmet>
        <title>VantageLabs · Computer Vision Tools for Aerial Footage</title>
        <meta
          name="description"
          content="A working studio for computer-vision systems on everyday photographs. Extract frames, score sharpness, segment colour, detect objects, all in your browser. No upload, no server."
        />
        <link rel="canonical" href="https://vantage.lodonu.dev/" />
      </Helmet>
      <Hero />
      <div className="wrap">
        <div className="hairline" style={{ marginTop: 60 }} />
      </div>
      <Projects />
      <About />
    </>
  );
}

export default Home;
