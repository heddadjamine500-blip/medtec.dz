import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface AnimatedLogoProps {
  size?: number;
  onComplete?: () => void;
  className?: string;
  autoPlay?: boolean;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  size = 220,
  onComplete,
  className = '',
  autoPlay = true,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [stage, setStage] = useState<number>(0);

  // Time sequence across ~5 seconds:
  // 0.0s - 0.8s: Step 1: Fine turquoise pulse line
  // 0.8s - 2.2s: Step 2: Geometric M constructed with path drawing
  // 2.2s - 3.2s: Step 3: Medical cross reveals inside the M
  // 3.2s - 4.0s: Step 4: Light sweep / pulse travels across
  // 4.0s - 5.0s: Step 5: MEDTEC typography and slogan reveal
  // 5.0s+: Completion callback
  useEffect(() => {
    if (!autoPlay) return;

    if (shouldReduceMotion) {
      setStage(5);
      const timer = setTimeout(() => {
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }

    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 800);
    const t3 = setTimeout(() => setStage(3), 2200);
    const t4 = setTimeout(() => setStage(4), 3200);
    const t5 = setTimeout(() => setStage(5), 4000);
    const tEnd = setTimeout(() => {
      onComplete?.();
    }, 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(tEnd);
    };
  }, [autoPlay, shouldReduceMotion, onComplete]);

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <div 
        className="relative flex items-center justify-center" 
        style={{ width: size, height: size }}
      >
        {/* Glow ambient background aura */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: stage >= 3 ? [0.2, 0.45, 0.2] : 0,
            scale: stage >= 3 ? [1, 1.15, 1] : 0.8,
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#20B8A5]/30 via-[#2585D8]/20 to-[#123B65]/40 blur-2xl"
        />

        <svg
          width={size}
          height={size}
          viewBox="0 0 240 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 overflow-visible drop-shadow-xl"
        >
          <defs>
            <linearGradient id="anim-m-grad" x1="40" y1="40" x2="200" y2="200" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#20B8A5" />
              <stop offset="50%" stopColor="#2585D8" />
              <stop offset="100%" stopColor="#123B65" />
            </linearGradient>

            <linearGradient id="anim-cross-grad" x1="80" y1="80" x2="160" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2585D8" />
              <stop offset="100%" stopColor="#20B8A5" />
            </linearGradient>

            <linearGradient id="pulse-sweep-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#20B8A5" stopOpacity="0" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#2585D8" stopOpacity="0" />
            </linearGradient>

            <filter id="med-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Badge container */}
          <motion.rect
            x="14"
            y="14"
            width="212"
            height="212"
            rx="46"
            fill="#123B65"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{
              opacity: stage >= 1 ? 1 : 0,
              scale: stage >= 1 ? 1 : 0.85,
            }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Step 1: Initial fine turquoise vital line / baseline scan */}
          <motion.path
            d="M 24 120 L 70 120 L 85 95 L 100 145 L 115 110 L 130 125 L 140 120 L 216 120"
            stroke="#20B8A5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: stage >= 1 ? 1 : 0,
              opacity: stage >= 1 && stage < 3 ? 0.9 : 0.15,
            }}
            transition={{
              pathLength: { duration: 0.8, ease: 'easeInOut' },
              opacity: { duration: 0.6 },
            }}
          />

          {/* Step 2: Geometric M progressively constructed */}
          <motion.path
            d="M 52 176 V 68 L 120 128 L 188 68 V 176"
            stroke="url(#anim-m-grad)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: stage >= 2 ? 1 : 0,
              opacity: stage >= 2 ? 1 : 0,
            }}
            transition={{
              pathLength: { duration: 1.4, ease: [0.65, 0, 0.35, 1] },
              opacity: { duration: 0.3 },
            }}
          />

          {/* Step 3: Medical cross appears inside the M */}
          {/* Vertical Bar */}
          <motion.path
            d="M 120 94 V 162"
            stroke="url(#anim-cross-grad)"
            strokeWidth="14"
            strokeLinecap="round"
            filter="url(#med-glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: stage >= 3 ? 1 : 0,
              opacity: stage >= 3 ? 1 : 0,
            }}
            transition={{
              pathLength: { duration: 0.8, ease: 'easeOut' },
              opacity: { duration: 0.3 },
            }}
          />
          {/* Horizontal Bar */}
          <motion.path
            d="M 86 128 H 154"
            stroke="url(#anim-cross-grad)"
            strokeWidth="14"
            strokeLinecap="round"
            filter="url(#med-glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: stage >= 3 ? 1 : 0,
              opacity: stage >= 3 ? 1 : 0,
            }}
            transition={{
              pathLength: { duration: 0.8, ease: 'easeOut', delay: 0.2 },
              opacity: { duration: 0.3 },
            }}
          />

          {/* Step 4: Light Pulse / Sweep across the logo */}
          {stage >= 4 && (
            <motion.rect
              x="-60"
              y="14"
              width="60"
              height="212"
              fill="url(#pulse-sweep-grad)"
              rx="10"
              initial={{ x: -60, opacity: 0.7 }}
              animate={{ x: 260, opacity: [0, 0.85, 0] }}
              transition={{ duration: 1.0, ease: 'easeInOut' }}
              style={{ mixBlendMode: 'screen' }}
            />
          )}
        </svg>
      </div>

      {/* Step 5: Typography Fade-In */}
      <div className="mt-6 flex flex-col items-center text-center overflow-hidden">
        <motion.h1
          initial={{ opacity: 0, y: 18, letterSpacing: '0.25em' }}
          animate={{
            opacity: stage >= 5 ? 1 : 0,
            y: stage >= 5 ? 0 : 18,
            letterSpacing: stage >= 5 ? '0.08em' : '0.25em',
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-5xl font-black text-[#123B65] tracking-wider leading-none"
        >
          MED<span className="text-[#20B8A5]">TEC</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: stage >= 5 ? 1 : 0,
            y: stage >= 5 ? 0 : 10,
          }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          className="mt-2 text-xs md:text-sm font-bold tracking-widest text-[#2585D8] uppercase"
        >
          Healthcare, Connected.
        </motion.p>
      </div>
    </div>
  );
};

export default AnimatedLogo;
