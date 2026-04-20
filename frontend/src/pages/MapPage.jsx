import { motion } from 'framer-motion';
import CrowdHeatmap from '../components/map/CrowdHeatmap.jsx';
import NLPSearchBar from '../components/ui/NLPSearchBar.jsx';

export default function MapPage() {
  return (
    <motion.div
      className="page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'relative', zIndex: 50, height: '100%', width: '100%' }}>
         <NLPSearchBar />
         <CrowdHeatmap />
      </div>
    </motion.div>
  );
}
