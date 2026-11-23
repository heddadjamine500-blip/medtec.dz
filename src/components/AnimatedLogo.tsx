import React, { useEffect } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import logoColored from '../assets/logo.svg';
import logoMonochrome from '../assets/logo-monochrome.svg';

/**
 * Animated logo reveal following the specification:
 * 1. Fine turquoise line appears.
 * 2. Geometric M is progressively constructed.
 * 3. Medical cross appears inside the M.
 * 4. Light pulse travels across the logo.
 * 5. MEDTEC text fades in.
 *
 * For simplicity we animate the whole SVG with staged opacity/scale
 * and a pulse effect. The animation respects `prefers-reduced-motion`.
 */
export const AnimatedLogo: React.FC<{
  /** Show monochrome variant when true */
  monochrome?: boolean;
  /** Size in px */
  size?: number;
}> = ({ monochrome = false, size = 200 }) => {
  const shouldReduce = useReducedMotion();
  const logoSrc = monochrome ? logoMonochrome : logoColored;

  // Variants for the whole logo container
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.3, when: 'beforeChildren', duration: shouldReduce ? 0 : 2 },
    },
  };

  // Simple draw‑in animation for the SVG path (stroke‑dasharray technique)
  const pathVariant: Variants = {
    hidden: { pathLength: 0 },
    visible: { pathLength: 1, transition: { duration: shouldReduce ? 0 : 1 } },
  };

  // Pulse effect – a brief scale‑up and down of the whole logo
  const pulseVariant: Variants = {
    hidden: { scale: 1 },
    visible: {
      scale: [1, 1.05, 1],
      transition: { delay: shouldReduce ? 0 : 1.5, duration: shouldReduce ? 0 : 0.6 },
    },
  };

  // Text fade‑in – we overlay a simple <text> element after the SVG
  const textVariant: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: shouldReduce ? 0 : 2.2, duration: shouldReduce ? 0 : 0.8 } },
  };

  // The SVG we animate – we only animate the first <path> (the M) for demo purposes.
  // A real implementation would split the SVG into separate elements.
  return (
    <motion.div
      className="flex flex-col items-center justify-center"
      variants={container}
      initial="hidden"
      animate="visible"
      style={{ width: size, height: size }}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="overflow-visible"
        variants={pulseVariant}
      >
        {/* M path – we replicate the one from the logo.svg for stroke animation */}
        <motion.path
          d="M40 160 L40 40 L80 100 L120 40 L120 160"
          stroke={monochrome ? '#1E293B' : '#20B8A5'}
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          variants={pathVariant}
        />
        {/* Cross inside the M – simple static rectangles */}
        <rect x="85" y="85" width="30" height="10" fill={monochrome ? '#1E293B' : '#2585D8'} />
        <rect x="95" y="75" width="10" height="30" fill={monochrome ? '#1E293B' : '#2585D8'} />
      </motion.svg>
      {/* MEDTEC text */}
      <motion.div variants={textVariant} className="mt-4 text-2xl font-semibold" style={{ color: monochrome ? '#1E293B' : '#123B65' }}>
        MEDTEC
      </motion.div>
    </motion.div>
  );
};

export default AnimatedLogo;
