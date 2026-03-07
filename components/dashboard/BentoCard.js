'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function BentoCard({
  children,
  className = '',
  colSpan = '',
  rowSpan = '',
  disableTilt = false,
  onClick,
  as: Tag = 'div',
}) {
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rawRotateX = useTransform(mouseY, [-0.5, 0.5], [4, -4]);
  const rawRotateY = useTransform(mouseX, [-0.5, 0.5], [-4, 4]);
  const rotateX = useSpring(rawRotateX, { stiffness: 200, damping: 20 });
  const rotateY = useSpring(rawRotateY, { stiffness: 200, damping: 20 });

  function handleMouseMove(e) {
    if (disableTilt) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  const tiltStyle = disableTilt
    ? {}
    : { rotateX, rotateY, transformPerspective: 800 };

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
      onClick={onClick}
      className={`
        bg-white
        border border-gray-200
        rounded-2xl
        shadow-sm hover:shadow-md
        hover:border-gray-300
        transition-all duration-300
        overflow-hidden
        ${colSpan} ${rowSpan} ${className}
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {children}
    </motion.div>
  );
}
