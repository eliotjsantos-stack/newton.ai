'use client';

import { useState, useEffect } from 'react';
import NewtonMascot from './NewtonMascot';

export default function NewtonTree({ detaching = false, onAppleFall }) {
  const [appleVisible, setAppleVisible] = useState(true);
  const [branchSprung, setBranchSprung] = useState(false);

  useEffect(() => {
    if (detaching && appleVisible) {
      setBranchSprung(true);
      // Apple falls for 700ms, then notify parent
      const fallTimer = setTimeout(() => {
        setAppleVisible(false);
        if (onAppleFall) onAppleFall();
      }, 750);
      return () => clearTimeout(fallTimer);
    }
  }, [detaching]);

  return (
    <div className="relative w-full flex items-center justify-center" style={{ height: '340px' }}>
      <svg
        viewBox="0 0 400 440"
        width="360"
        height="380"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {/* Trunk gradient */}
          <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5D4037" />
            <stop offset="50%" stopColor="#4E342E" />
            <stop offset="100%" stopColor="#3E2723" />
          </linearGradient>
          {/* Canopy gradients */}
          <radialGradient id="canopyDark" cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#2E7D32" />
            <stop offset="100%" stopColor="#1B5E20" />
          </radialGradient>
          <radialGradient id="canopyMid" cx="40%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#43A047" />
            <stop offset="100%" stopColor="#2E7D32" />
          </radialGradient>
          <radialGradient id="canopyLight" cx="35%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#66BB6A" />
            <stop offset="100%" stopColor="#43A047" />
          </radialGradient>
          <radialGradient id="canopyHighlight" cx="30%" cy="25%" r="40%">
            <stop offset="0%" stopColor="#81C784" />
            <stop offset="100%" stopColor="#66BB6A" />
          </radialGradient>
          {/* Leaf shape for particles */}
          <path id="leafShape" d="M 0 0 Q 4 -3 8 0 Q 4 3 0 0 Z" />
        </defs>

        {/* Ground shadow */}
        <ellipse cx="200" cy="420" rx="120" ry="12" fill="rgba(0,0,0,0.08)" />

        {/* Trunk */}
        <path
          d="M 185 420 L 180 320 Q 178 280 185 250 L 195 250 Q 205 280 200 320 L 215 420 Z"
          fill="url(#trunkGrad)"
        />
        {/* Bark texture */}
        <path d="M 188 380 Q 192 375 190 360" fill="none" stroke="#3E2723" strokeWidth="1" opacity="0.3" />
        <path d="M 196 400 Q 200 390 198 370" fill="none" stroke="#3E2723" strokeWidth="0.8" opacity="0.25" />
        <path d="M 192 340 Q 195 330 193 310" fill="none" stroke="#3E2723" strokeWidth="0.7" opacity="0.2" />

        {/* Root bumps */}
        <ellipse cx="182" cy="418" rx="10" ry="5" fill="#4E342E" />
        <ellipse cx="216" cy="419" rx="8" ry="4" fill="#4E342E" />

        {/* Canopy layers - back to front for depth */}
        <g className="tree-canopy-sway">
          {/* Deep shadow layer */}
          <ellipse cx="200" cy="180" rx="130" ry="95" fill="url(#canopyDark)" opacity="0.9" />
          {/* Main middle layer */}
          <ellipse cx="190" cy="170" rx="120" ry="90" fill="url(#canopyMid)" />
          {/* Left cluster */}
          <ellipse cx="140" cy="165" rx="70" ry="60" fill="url(#canopyMid)" opacity="0.85" />
          {/* Right cluster */}
          <ellipse cx="250" cy="160" rx="75" ry="65" fill="url(#canopyMid)" opacity="0.8" />
          {/* Upper light layer */}
          <ellipse cx="195" cy="150" rx="95" ry="65" fill="url(#canopyLight)" opacity="0.7" />
          {/* Top highlight */}
          <ellipse cx="180" cy="130" rx="60" ry="40" fill="url(#canopyHighlight)" opacity="0.5" />
          {/* Small highlight spots */}
          <ellipse cx="150" cy="145" rx="25" ry="18" fill="#A5D6A7" opacity="0.3" />
          <ellipse cx="220" cy="135" rx="20" ry="15" fill="#A5D6A7" opacity="0.25" />
        </g>

        {/* Branch extending left from canopy */}
        <g
          className={branchSprung ? 'tree-branch-spring' : ''}
          style={{ transformOrigin: '170px 200px' }}
        >
          <path
            d="M 170 200 Q 130 205 100 215 Q 80 222 70 228"
            fill="none"
            stroke="#5D4037"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Branch highlight */}
          <path
            d="M 165 198 Q 130 203 102 213"
            fill="none"
            stroke="#6D4C41"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.4"
          />
          {/* Small twig */}
          <path
            d="M 110 218 Q 105 210 100 205"
            fill="none"
            stroke="#5D4037"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Leaves on branch */}
          <ellipse cx="100" cy="207" rx="12" ry="8" fill="#43A047" opacity="0.7" transform="rotate(15 100 207)" />
          <ellipse cx="85" cy="220" rx="10" ry="7" fill="#66BB6A" opacity="0.6" transform="rotate(-10 85 220)" />
        </g>

        {/* Floating leaf particles */}
        <g opacity="0.6">
          <use href="#leafShape" fill="#43A047" className="leaf-drift-1" transform="translate(100, 100)" />
          <use href="#leafShape" fill="#66BB6A" className="leaf-drift-2" transform="translate(280, 120)" />
          <use href="#leafShape" fill="#81C784" className="leaf-drift-3" transform="translate(150, 200)" />
          <use href="#leafShape" fill="#43A047" className="leaf-drift-4" transform="translate(260, 180)" />
          <use href="#leafShape" fill="#A5D6A7" className="leaf-drift-5" transform="translate(120, 260)" />
          <use href="#leafShape" fill="#66BB6A" className="leaf-drift-6" transform="translate(300, 150)" />
        </g>
      </svg>

      {/* Apple hanging from branch - positioned absolutely over the SVG */}
      {appleVisible && (
        <div
          className={`absolute ${detaching ? 'tree-apple-fall' : 'tree-apple-sway'}`}
          style={{
            // Position at the end of the left branch
            top: '52%',
            left: 'calc(50% - 128px)',
            transformOrigin: 'top center',
          }}
        >
          {/* Stem connecting to branch */}
          <div className="flex flex-col items-center">
            <div
              className={`w-0.5 bg-amber-800 ${detaching ? 'h-0' : 'h-3'}`}
              style={{ transition: 'height 0.1s' }}
            />
            <NewtonMascot size={56} expression={detaching ? 'falling' : 'idle'} />
          </div>
        </div>
      )}

      <style>{`
        .tree-canopy-sway {
          animation: tree-sway 5s ease-in-out infinite;
          transform-origin: 200px 250px;
        }
        @keyframes tree-sway {
          0%, 100% { transform: rotate(-0.5deg); }
          50% { transform: rotate(0.5deg); }
        }

        .tree-apple-sway {
          animation: apple-sway 3s ease-in-out infinite;
        }
        @keyframes apple-sway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }

        .tree-apple-fall {
          animation: apple-tree-fall 0.7s cubic-bezier(0.55, 0, 1, 0.45) forwards;
        }
        @keyframes apple-tree-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          10% { transform: translateY(-5px) rotate(0deg); }
          80% { opacity: 1; }
          100% { transform: translateY(350px) rotate(-10deg); opacity: 0; }
        }

        .tree-branch-spring {
          animation: branch-spring 0.6s ease-out forwards;
        }
        @keyframes branch-spring {
          0% { transform: rotate(0deg); }
          30% { transform: rotate(6deg); }
          60% { transform: rotate(-2deg); }
          80% { transform: rotate(1deg); }
          100% { transform: rotate(0deg); }
        }

        /* Floating leaf particles */
        .leaf-drift-1 {
          animation: leaf-drift-a 8s ease-in-out infinite;
        }
        .leaf-drift-2 {
          animation: leaf-drift-b 9s ease-in-out infinite 1s;
        }
        .leaf-drift-3 {
          animation: leaf-drift-a 10s ease-in-out infinite 2s;
        }
        .leaf-drift-4 {
          animation: leaf-drift-b 7s ease-in-out infinite 0.5s;
        }
        .leaf-drift-5 {
          animation: leaf-drift-a 11s ease-in-out infinite 3s;
        }
        .leaf-drift-6 {
          animation: leaf-drift-b 8.5s ease-in-out infinite 1.5s;
        }

        @keyframes leaf-drift-a {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.4; }
          25% { transform: translate(15px, -10px) rotate(45deg); opacity: 0.6; }
          50% { transform: translate(-10px, 5px) rotate(90deg); opacity: 0.5; }
          75% { transform: translate(20px, -5px) rotate(135deg); opacity: 0.4; }
        }
        @keyframes leaf-drift-b {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.3; }
          25% { transform: translate(-12px, 8px) rotate(-30deg); opacity: 0.5; }
          50% { transform: translate(8px, -12px) rotate(-60deg); opacity: 0.6; }
          75% { transform: translate(-15px, 5px) rotate(-100deg); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
