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
// On every navigation, jump to the top, or to the hashed element if the
// URL has one. We depend on `key` (not just pathname/hash) so clicking
// the same hash link twice still triggers a scroll — `key` changes on
// every navigation event, even to the same URL.
function ScrollToTop() {
  const { pathname, hash, key } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hash, key]);
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
