"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function FloatingPaths({ position, inView, className }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.2 + i * 0.01,
  }));

  return (
    <div className={cn("absolute inset-x-0 pointer-events-none", className)}>
      <svg className="w-full h-full" viewBox="0 0 696 316" fill="none" preserveAspectRatio="xMidYMid slice">
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="white"
            strokeWidth={path.width}
            strokeOpacity={0.08 + path.id * 0.015}
            initial={{ pathLength: 0.3, opacity: 0 }}
            animate={inView ? {
              pathLength: 1,
              opacity: [0.2, 0.5, 0.2],
              pathOffset: [0, 1, 0],
            } : { pathLength: 0.3, opacity: 0 }}
            transition={{
              duration: 20 + (path.id % 7) * 3,
              repeat: Infinity,
              ease: "linear",
              delay: path.id * 0.05,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export function BackgroundPaths({ title = "Guide Every Student Further" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const words = title.split(" ");

  return (
    <div
      ref={ref}
      className="relative w-full flex items-center justify-center overflow-hidden py-32"
      style={{ background: "#1a1a1a" }}
    >
      <div className="absolute inset-0">
        <FloatingPaths position={1} inView={inView} />
        <FloatingPaths position={-1} inView={inView} />
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-10 tracking-tighter leading-tight">
            {words.map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ y: 80, opacity: 0 }}
                    animate={inView ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 }}
                    transition={{
                      delay: wordIndex * 0.08 + letterIndex * 0.025,
                      type: "spring",
                      stiffness: 150,
                      damping: 25,
                    }}
                    className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="inline-block group relative p-px rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0.05))" }}
          >
            <Link
              href="/signup"
              className="flex items-center gap-3 rounded-[1.15rem] px-8 py-4 text-base font-semibold transition-all duration-300 group-hover:-translate-y-0.5"
              style={{ background: "rgba(255,255,255,0.08)", color: "white", backdropFilter: "blur(12px)" }}
            >
              <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                Get started free
              </span>
              <span className="opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 inline-block">
                →
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
