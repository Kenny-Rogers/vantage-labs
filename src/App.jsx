import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import FrameExtractor from './pages/FrameExtractor';
import SharpnessScorer from './pages/SharpnessScorer';
import ColorSegmentation from './pages/ColorSegmentation';
import ObjectDetection from './pages/ObjectDetection';
import TrafficAnalysis from './pages/TrafficAnalysis';
import AerialMapper from './pages/AerialMapper';

function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/frame-extractor" element={<FrameExtractor />} />
          <Route path="/sharpness-scorer" element={<SharpnessScorer />} />
          <Route path="/color-segmentation" element={<ColorSegmentation />} />
          <Route path="/object-detection" element={<ObjectDetection />} />
          <Route path="/traffic-analysis" element={<TrafficAnalysis />} />
          <Route path="/aerial-mapper" element={<AerialMapper />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
