import {createRoot} from 'react-dom/client';
import {MotionConfig} from 'motion/react';
import App from './App.tsx';
import {LanguageProvider} from './contexts/LanguageContext.tsx';
import './index.css';
import { installRafFallback } from './utils/rafFallback';

installRafFallback();

createRoot(document.getElementById('root')!).render(
  <LanguageProvider>
    {/* Framer-motion animates on rAF; background/idle tabs throttle rAF to zero,
        which froze AnimatePresence mode='wait' swaps (views never changed).
        reducedMotion='always' makes it switch to instant opacity classes —
        transitions complete everywhere, including background tabs. */}
    <MotionConfig reducedMotion="always" transition={{ duration: 0 }}>
      <App />
    </MotionConfig>
  </LanguageProvider>
);
