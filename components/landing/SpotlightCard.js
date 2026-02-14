'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';

export default function SpotlightCard({ children, className = '', ...motionProps }) {
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [hovered, setHovered] = useState(false);

  const spotlight = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.07), transparent 80%)`;

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative overflow-hidden ${className}`}
      {...motionProps}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-500"
        style={{ background: spotlight, opacity: hovered ? 1 : 0 }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
