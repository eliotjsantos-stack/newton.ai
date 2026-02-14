'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const spring = { type: 'spring', stiffness: 100, damping: 20, mass: 1 };

function ThinkingDots() {
  return (
    <div className="flex gap-1 mt-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1 h-1 rounded-full bg-[#0071e3]/50"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default function ChatDemo({ messages, active = false, dark = true, loop = true, onMessageReveal, onReset }) {
  const [visible, setVisible] = useState([]);
  const [thinking, setThinking] = useState(false);
  const timeoutsRef = useRef([]);
  const runningRef = useRef(false);
  const revealCountRef = useRef(0);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const run = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    setVisible([]);
    setThinking(false);
    clearAllTimeouts();
    revealCountRef.current = 0;
    if (onReset) onReset();

    let delay = 600;

    messages.forEach((msg, i) => {
      if (msg.role === 'newton') {
        timeoutsRef.current.push(setTimeout(() => setThinking(true), delay));
        delay += 1400;
        timeoutsRef.current.push(
          setTimeout(() => {
            setThinking(false);
            revealCountRef.current += 1;
            setVisible((prev) => [...prev, { ...msg, id: `${i}-${Date.now()}` }]);
            if (onMessageReveal) onMessageReveal(revealCountRef.current);
          }, delay)
        );
      } else {
        timeoutsRef.current.push(
          setTimeout(() => {
            revealCountRef.current += 1;
            setVisible((prev) => [...prev, { ...msg, id: `${i}-${Date.now()}` }]);
            if (onMessageReveal) onMessageReveal(revealCountRef.current);
          }, delay)
        );
      }
      delay += 1100;
    });

    if (loop) {
      timeoutsRef.current.push(
        setTimeout(() => {
          runningRef.current = false;
          setVisible([]);
          setThinking(false);
          timeoutsRef.current.push(setTimeout(run, 800));
        }, delay + 2500)
      );
    }
  }, [messages, loop, clearAllTimeouts, onMessageReveal, onReset]);

  useEffect(() => {
    if (active) {
      run();
    } else {
      runningRef.current = false;
      clearAllTimeouts();
      setVisible([]);
      setThinking(false);
    }
    return clearAllTimeouts;
  }, [active, run, clearAllTimeouts]);

  return (
    <div className="space-y-3 min-h-[120px]">
      <AnimatePresence mode="popLayout">
        {visible.map((msg) => {
          const isStudent = msg.role === 'student';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={spring}
              layout
              className={`flex gap-2.5 ${isStudent ? 'justify-end' : 'justify-start'}`}
            >
              {!isStudent && (
                <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[7px] font-bold text-black">N</span>
                </div>
              )}
              <div className={`max-w-[80%] ${isStudent ? 'text-right' : ''}`}>
                <p className={`text-[12px] leading-relaxed ${dark ? 'text-white/80' : 'text-neutral-800'}`}>
                  {msg.text}
                </p>
              </div>
              {isStudent && (
                <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[7px] font-semibold text-white/50">You</span>
                </div>
              )}
            </motion.div>
          );
        })}
        {thinking && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={spring}
            layout
            className="flex gap-2.5"
          >
            <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[7px] font-bold text-black">N</span>
            </div>
            <ThinkingDots />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
