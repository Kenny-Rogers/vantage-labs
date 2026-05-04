import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import FrameExtractor from './pages/FrameExtractor';
import SharpnessScorer from './pages/SharpnessScorer';
import ColorSegmentation from './pages/ColorSegmentation';
import ObjectDetection from './pages/ObjectDetection';
import TrafficAnalysis from './pages/TrafficAnalysis';
import AerialMapper from './pages/AerialMapper';

// React Router doesn't reset scroll position on navigation by default —
// pushState preserves whatever scroll the user had on the previous page.
// On every pathname change, jump to the top. If the URL has a hash
// (e.g. /#work from the nav), scroll to that element instead so anchor
// navigation still works.
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function App() {
  return (
    <div className="app">
      <ScrollToTop />
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
