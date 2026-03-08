'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Returns [ref, inView].
 * Attach ref to the element you want to observe.
 * inView becomes true once the element enters the viewport.
 *
 * @param {object} options
 * @param {number} [options.threshold=0.15]
 * @param {string} [options.rootMargin='0px']
 * @param {boolean} [options.once=true]  — disconnect after first trigger
 */
export function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (options.once !== false) observer.disconnect();
        } else if (options.once === false) {
          setInView(false);
        }
      },
      {
        threshold: options.threshold ?? 0.15,
        rootMargin: options.rootMargin ?? '0px 0px -60px 0px',
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin, options.once]);

  return [ref, inView];
}
