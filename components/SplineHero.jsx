'use client';

import { useEffect } from 'react';

export default function SplineHero() {
  useEffect(() => {
    const id = 'spline-viewer-script';
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.src = 'https://unpkg.com/@splinetool/viewer@1.12.68/build/spline-viewer.js';
    script.type = 'module';
    document.head.appendChild(script);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <spline-viewer
        url="https://prod.spline.design/PK4Z8F-Gl4Q5RQyX/scene.splinecode"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
