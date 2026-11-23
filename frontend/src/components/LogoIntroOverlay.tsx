import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedLogo from './AnimatedLogo';

interface LogoIntroOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoIntroOverlay: React.FC<LogoIntroOverlayProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="medtec-intro-splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#123B65] overflow-hidden select-none"
        >
          {/* Subtle medical tech background elements */}
          <div className="absolute inset-0 bg-[radial-gradient(#2585D8_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.12]" />

          {/* Glowing gradients in corners */}
          <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-[#2585D8]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-[#20B8A5]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Only the skip button ("Passer") top right */}
          <div className="absolute top-6 right-6 z-20">
            <button
              onClick={onClose}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-xs font-bold text-gray-700 hover:text-[#123B65] border border-gray-200 shadow-sm hover:shadow transition-all cursor-pointer active:scale-95"
            >
              <span>Passer</span>
              <span className="text-[10px] text-gray-400 font-normal">ESC</span>
            </button>
          </div>

          {/* Centerpiece: The Animated Logo */}
          <div className="relative z-10 flex flex-col items-center px-4">
            <AnimatedLogo size={200} onComplete={onClose} autoPlay={true} />
          </div>

          {/* Bottom subtle progress indicator */}
          <div className="absolute bottom-8 flex flex-col items-center gap-2 z-20">
            <div className="w-44 h-1 bg-gray-200/80 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 5.0, ease: 'linear' }}
                className="h-full bg-gradient-to-r from-[#20B8A5] to-[#2585D8]"
              />
            </div>
            <p className="text-[11px] font-medium text-gray-400">
              Initialisation du système de santé connecté...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LogoIntroOverlay;
