'use client';

import { useState } from 'react';

const EXPRESSIONS = {
  idle: {
    leftEye: { cx: 38, cy: 48, rx: 4, ry: 5 },
    rightEye: { cx: 62, cy: 48, rx: 4, ry: 5 },
    eyeType: 'soft',
    mouth: 'M 40 62 Q 50 72 60 62',
    sparkles: false,
  },
  falling: {
    leftEye: { cx: 38, cy: 47, rx: 5.5, ry: 7 },
    rightEye: { cx: 62, cy: 47, rx: 5.5, ry: 7 },
    eyeType: 'wide',
    mouth: 'M 44 63 Q 50 69 56 63',
    sparkles: false,
  },
  thinking: {
    leftEye: { cx: 40, cy: 44, rx: 3.5, ry: 4.5 },
    rightEye: { cx: 64, cy: 44, rx: 3.5, ry: 4.5 },
    eyeType: 'lookUp',
    mouth: 'M 43 63 Q 50 66 57 63',
    sparkles: false,
    dots: true,
  },
  encouraging: {
    leftEye: { cx: 38, cy: 48, rx: 5, ry: 6 },
    rightEye: { cx: 62, cy: 48, rx: 5, ry: 6 },
    eyeType: 'wide',
    mouth: 'M 37 60 Q 50 75 63 60',
    sparkles: false,
  },
  celebrating: {
    leftEye: { cx: 38, cy: 48 },
    rightEye: { cx: 62, cy: 48 },
    eyeType: 'squeezed',
    mouth: 'M 36 59 Q 50 78 64 59',
    sparkles: true,
  },
  wrong: {
    leftEye: { cx: 38, cy: 50, rx: 4, ry: 4 },
    rightEye: { cx: 62, cy: 50, rx: 4, ry: 4 },
    eyeType: 'sad',
    mouth: 'M 40 68 Q 50 58 60 68',
    sparkles: false,
    sweat: true,
  },
};

export default function NewtonMascot({ expression = 'idle', size = 40 }) {
  const [hovered, setHovered] = useState(false);
  const expr = EXPRESSIONS[expression] || EXPRESSIONS.idle;

  const animClass =
    expression === 'thinking' ? 'newton-bob' :
    expression === 'celebrating' ? 'newton-bounce' :
    expression === 'wrong' ? 'newton-wobble' :
    'newton-breathe';

  return (
    <div
      className={`inline-flex items-center justify-center flex-shrink-0 ${animClass} ${hovered ? 'newton-hover' : ''}`}
      style={{ width: size, height: size }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Apple gradient */}
          <linearGradient id="appleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E53935" />
            <stop offset="100%" stopColor="#FF7043" />
          </linearGradient>
          {/* Highlight */}
          <radialGradient id="appleHighlight" cx="35%" cy="35%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          {/* Sparkle filter */}
          <filter id="sparkleGlow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Shadow */}
        <ellipse cx="50" cy="92" rx="22" ry="4" fill="rgba(0,0,0,0.12)" />

        {/* Apple body - slightly taller than wide, narrower at bottom */}
        <path d="M 50 24 C 38 24 19 35 19 55 C 19 72 32 88 50 88 C 68 88 81 72 81 55 C 81 35 62 24 50 24 Z" fill="url(#appleGrad)" />
        {/* Top indent / dimple */}
        <path d="M 43 26 Q 50 32 57 26" fill="#C62828" opacity="0.5" />
        {/* Highlight overlay */}
        <path d="M 50 24 C 38 24 19 35 19 55 C 19 72 32 88 50 88 C 68 88 81 72 81 55 C 81 35 62 24 50 24 Z" fill="url(#appleHighlight)" />

        {/* Stem */}
        <path d="M 50 24 Q 51 18 49 14" fill="none" stroke="#5D4037" strokeWidth="2.5" strokeLinecap="round" />

        {/* Leaf */}
        <path d="M 50 20 Q 60 10 68 16 Q 60 18 52 22" fill="#43A047" />
        <path d="M 54 19 Q 60 14 64 16" fill="none" stroke="#2E7D32" strokeWidth="0.7" opacity="0.6" />

        {/* Eyes */}
        {expr.eyeType === 'soft' && (
          <>
            {/* Half-moon eyes */}
            <ellipse cx={expr.leftEye.cx} cy={expr.leftEye.cy} rx={expr.leftEye.rx} ry={expr.leftEye.ry} fill="#3E2723" />
            <ellipse cx={expr.leftEye.cx} cy={expr.leftEye.cy - 1} rx={2} ry={1.5} fill="white" opacity="0.7" />
            <ellipse cx={expr.rightEye.cx} cy={expr.rightEye.cy} rx={expr.rightEye.rx} ry={expr.rightEye.ry} fill="#3E2723" />
            <ellipse cx={expr.rightEye.cx} cy={expr.rightEye.cy - 1} rx={2} ry={1.5} fill="white" opacity="0.7" />
          </>
        )}
        {expr.eyeType === 'lookUp' && (
          <>
            <ellipse cx={expr.leftEye.cx} cy={expr.leftEye.cy} rx={expr.leftEye.rx} ry={expr.leftEye.ry} fill="#3E2723" />
            <ellipse cx={expr.leftEye.cx + 1} cy={expr.leftEye.cy - 2} rx={1.5} ry={1.5} fill="white" opacity="0.8" />
            <ellipse cx={expr.rightEye.cx} cy={expr.rightEye.cy} rx={expr.rightEye.rx} ry={expr.rightEye.ry} fill="#3E2723" />
            <ellipse cx={expr.rightEye.cx + 1} cy={expr.rightEye.cy - 2} rx={1.5} ry={1.5} fill="white" opacity="0.8" />
          </>
        )}
        {expr.eyeType === 'wide' && (
          <>
            <ellipse cx={expr.leftEye.cx} cy={expr.leftEye.cy} rx={expr.leftEye.rx} ry={expr.leftEye.ry} fill="#3E2723" />
            <ellipse cx={expr.leftEye.cx - 1} cy={expr.leftEye.cy - 2} rx={2.5} ry={2} fill="white" opacity="0.8" />
            <ellipse cx={expr.rightEye.cx} cy={expr.rightEye.cy} rx={expr.rightEye.rx} ry={expr.rightEye.ry} fill="#3E2723" />
            <ellipse cx={expr.rightEye.cx - 1} cy={expr.rightEye.cy - 2} rx={2.5} ry={2} fill="white" opacity="0.8" />
          </>
        )}
        {expr.eyeType === 'squeezed' && (
          <>
            {/* Happy squeezed shut eyes */}
            <path d="M 33 48 Q 38 44 43 48" fill="none" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 57 48 Q 62 44 67 48" fill="none" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}
        {expr.eyeType === 'sad' && (
          <>
            {/* Gentle worried eyes */}
            <ellipse cx={expr.leftEye.cx} cy={expr.leftEye.cy} rx={expr.leftEye.rx} ry={expr.leftEye.ry} fill="#3E2723" />
            <ellipse cx={expr.leftEye.cx} cy={expr.leftEye.cy - 1} rx={1.8} ry={1.5} fill="white" opacity="0.6" />
            <ellipse cx={expr.rightEye.cx} cy={expr.rightEye.cy} rx={expr.rightEye.rx} ry={expr.rightEye.ry} fill="#3E2723" />
            <ellipse cx={expr.rightEye.cx} cy={expr.rightEye.cy - 1} rx={1.8} ry={1.5} fill="white" opacity="0.6" />
            {/* Worried eyebrows */}
            <path d="M 33 42 Q 38 40 43 43" fill="none" stroke="#3E2723" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 67 42 Q 62 40 57 43" fill="none" stroke="#3E2723" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}

        {/* Mouth */}
        <path d={expr.mouth} fill="none" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" />
        {/* Fill for big smiles */}
        {(expression === 'celebrating' || expression === 'encouraging') && (
          <path d={expr.mouth} fill="#3E2723" opacity="0.15" />
        )}

        {/* Cheek blush */}
        <ellipse cx="30" cy="58" rx="5" ry="3" fill="#FF8A80" opacity="0.4" />
        <ellipse cx="70" cy="58" rx="5" ry="3" fill="#FF8A80" opacity="0.4" />

        {/* Thinking dots */}
        {expr.dots && (
          <g className="newton-thinking-dots">
            <circle cx="72" cy="28" r="2" fill="#9E9E9E" opacity="0.8">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="78" cy="22" r="2.5" fill="#9E9E9E" opacity="0.6">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.2s" begin="0.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="85" cy="16" r="3" fill="#9E9E9E" opacity="0.4">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* Sparkles for celebrating */}
        {expr.sparkles && (
          <g filter="url(#sparkleGlow)">
            <circle cx="20" cy="30" r="2" fill="#FFD600">
              <animate attributeName="r" values="0;2.5;0" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;0" dur="0.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="80" cy="28" r="2" fill="#FFD600">
              <animate attributeName="r" values="0;2;0" dur="0.8s" begin="0.15s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;0" dur="0.8s" begin="0.15s" repeatCount="indefinite" />
            </circle>
            <circle cx="25" cy="70" r="1.5" fill="#FF80AB">
              <animate attributeName="r" values="0;2;0" dur="0.8s" begin="0.3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;0" dur="0.8s" begin="0.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="78" cy="72" r="2" fill="#80D8FF">
              <animate attributeName="r" values="0;2.5;0" dur="0.8s" begin="0.45s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;0" dur="0.8s" begin="0.45s" repeatCount="indefinite" />
            </circle>
            <circle cx="15" cy="50" r="1.5" fill="#B9F6CA">
              <animate attributeName="r" values="0;2;0" dur="0.8s" begin="0.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;0" dur="0.8s" begin="0.6s" repeatCount="indefinite" />
            </circle>
            {/* Star sparkle */}
            <path d="M 85 45 L 86.5 41 L 88 45 L 92 46.5 L 88 48 L 86.5 52 L 85 48 L 81 46.5 Z" fill="#FFD600">
              <animate attributeName="opacity" values="0;1;0" dur="1s" begin="0.2s" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="rotate" values="0 86.5 46.5;180 86.5 46.5" dur="1.5s" repeatCount="indefinite" />
            </path>
          </g>
        )}

        {/* Sweat drop for wrong */}
        {expr.sweat && (
          <path d="M 72 38 Q 74 34 73 30 Q 75 34 73 39 Z" fill="#64B5F6" opacity="0.7">
            <animate attributeName="opacity" values="0;0.7;0" dur="2s" repeatCount="indefinite" />
          </path>
        )}
      </svg>

      <style>{`
        .newton-breathe {
          animation: newton-breathe 3s ease-in-out infinite;
        }
        .newton-bob {
          animation: newton-bob 1.5s ease-in-out infinite;
        }
        .newton-bounce {
          animation: newton-bounce 0.5s ease-out;
        }
        .newton-wobble {
          animation: newton-wobble 0.6s ease-out 3;
        }
        .newton-drop {
          animation: newton-drop 0.6s cubic-bezier(0.55, 0, 1, 0.45) forwards;
        }
        .newton-hover {
          animation: newton-hover-bump 0.25s ease-out !important;
        }
        @keyframes newton-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes newton-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes newton-bounce {
          0% { transform: scale(1); }
          40% { transform: scale(1.18); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes newton-wobble {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
          75% { transform: rotate(-2deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes newton-drop {
          0% { transform: translateY(-60px); opacity: 0; }
          60% { transform: translateY(4px); opacity: 1; }
          75% { transform: translateY(-6px); }
          90% { transform: translateY(2px); }
          100% { transform: translateY(0); }
        }
        @keyframes newton-hover-bump {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
