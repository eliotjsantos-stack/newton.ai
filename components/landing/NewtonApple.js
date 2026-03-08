'use client';

import { cn } from '../../lib/cn';

/**
 * Refined Newton apple SVG.
 * @param {number} size - px size (width/height)
 * @param {boolean} animate - float + glow animation
 * @param {string} className
 */
export default function NewtonApple({ size = 200, animate = true, glow = true, className }) {
  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size * 1.1 }}
    >
      {/* Glow */}
      {glow && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: size * 1.3,
            height: size * 1.3,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.08) 50%, transparent 70%)',
            animation: animate ? 'glow-pulse 4s ease-in-out infinite' : 'none',
          }}
        />
      )}

      {/* Apple SVG */}
      <svg
        viewBox="0 0 120 138"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size * 1.1}
        style={{ animation: animate ? 'float 5s ease-in-out infinite' : 'none' }}
      >
        {/* Stem */}
        <path
          d="M60 28 Q63 16 70 19"
          stroke="#78850A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Leaf */}
        <path
          d="M67 20 Q80 8 76 20 Q72 28 63 22 Z"
          fill="#4A7C35"
          opacity="0.95"
        />
        <path
          d="M70 14 Q74 17 70 21"
          stroke="#3A6228"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Main apple body */}
        <path
          d="
            M60 34
            C 44 26, 14 32, 13 62
            C 12 88, 26 115, 46 126
            C 51 129, 56 130, 60 130
            C 64 130, 69 129, 74 126
            C 94 115, 108 88, 107 62
            C 106 32, 76 26, 60 34
            Z
          "
          fill="#F59E0B"
        />

        {/* Left body shading */}
        <path
          d="
            M60 34
            C 44 26, 14 32, 13 62
            C 12 88, 26 115, 46 126
            C 38 116, 28 92, 28 66
            C 28 44, 40 33, 60 34
            Z
          "
          fill="#D97706"
          opacity="0.35"
        />

        {/* Bottom shading */}
        <path
          d="
            M38 118
            C 46 128, 54 132, 60 130
            C 66 132, 74 128, 82 118
            C 74 125, 66 128, 60 128
            C 54 128, 46 125, 38 118
            Z
          "
          fill="#B45309"
          opacity="0.4"
        />

        {/* Specular highlight */}
        <ellipse
          cx="40"
          cy="60"
          rx="9"
          ry="16"
          fill="white"
          opacity="0.18"
          transform="rotate(-25 40 60)"
        />
        <ellipse
          cx="37"
          cy="56"
          rx="4"
          ry="7"
          fill="white"
          opacity="0.12"
          transform="rotate(-25 37 56)"
        />

        {/* Top centre cleft hint */}
        <path
          d="M52 36 Q60 31 68 36"
          stroke="#B45309"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />

        {/* Subtle rim light on right edge */}
        <path
          d="M100 55 Q108 80 100 108"
          stroke="#FCD34D"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.12"
        />
      </svg>
    </div>
  );
}
