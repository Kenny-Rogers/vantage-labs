import ToolCard from '../components/ToolCard';

const tools = [
  {
    icon: '🎞️',
    title: 'Frame Extractor',
    description: 'Extract high-res stills from any video',
    link: '/frame-extractor',
    active: true,
  },
  {
    icon: '✨',
    title: 'Sharpness Scorer',
    description: 'Auto-rank frames by image quality',
    active: false,
  },
  {
    icon: '🌿',
    title: 'Color Segmentation',
    description: 'Classify land cover from aerial imagery',
    active: false,
  },
  {
    icon: '🎯',
    title: 'Object Detection',
    description: 'Detect and count objects from above',
    active: false,
  },
  {
    icon: '🚗',
    title: 'Traffic Analysis',
    description: 'Count vehicles and map traffic flow',
    active: false,
  },
  {
    icon: '🗺️',
    title: 'Aerial Mapper',
    description: 'Stitch photos into orthomosaic maps',
    active: false,
  },
];

function Home() {
  return (
    <div className="container">
      <section className="hero">
        <h1>Computer vision tools for aerial footage</h1>
        <p>Process drone and video footage directly in your browser. No uploads. No servers. Free.</p>
      </section>
      <section className="tool-grid">
        {tools.map((tool) => (
          <ToolCard key={tool.title} {...tool} />
        ))}
      </section>
    </div>
  );
}

export default Home;
