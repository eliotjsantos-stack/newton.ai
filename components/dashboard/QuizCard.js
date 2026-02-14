'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

function getScoreColor(score) {
  const pct = (score / 15) * 100;
  if (pct >= 80) return 'text-emerald-400';
  if (pct >= 60) return 'text-amber-400';
  return 'text-red-400';
}

export default function QuizCard({
  quizzes = [],
  creatingQuiz = false,
  onNewQuiz,
  onDelete,
  onRestart,
}) {
  const [tab, setTab] = useState('active');

  const pending = quizzes.filter((q) => q.status !== 'completed');
  const completed = quizzes.filter((q) => q.status === 'completed');
  const visible = tab === 'active' ? pending.slice(0, 4) : completed.slice(0, 4);

  return (
    <div className="p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-100">Quizzes</h3>
          {creatingQuiz && (
            <motion.div
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(59,130,246,0.6)',
                  '0 0 0 6px rgba(59,130,246,0)',
                ],
                scale: [1, 1.3, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
        <button
          onClick={onNewQuiz}
          className="text-xs font-semibold text-neutral-500 hover:text-neutral-100 transition-colors"
        >
          + New
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-0.5 bg-white/[0.04] border border-white/[0.06] rounded-lg mb-3">
        {[
          { key: 'active', label: 'In Progress', count: pending.length },
          { key: 'completed', label: 'Completed', count: completed.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200 ${
              tab === t.key
                ? 'bg-white/[0.1] text-neutral-100 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Quiz List */}
      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <div className="w-10 h-10 bg-white/[0.06] rounded-lg flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-xs text-neutral-400">
              {tab === 'active' ? 'No quizzes in progress' : 'No completed quizzes'}
            </p>
            {tab === 'active' && (
              <button
                onClick={onNewQuiz}
                className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
              >
                Create one →
              </button>
            )}
          </div>
        ) : (
          visible.map((quiz) => (
            <div
              key={quiz.id}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <Link href={tab === 'active' ? `/quiz/${quiz.id}` : `/quiz/${quiz.id}/results`}>
                  <p className="text-sm font-medium text-neutral-100 truncate">
                    {quiz.topicName}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {quiz.subject}
                  </p>
                </Link>
              </div>

              {tab === 'completed' && quiz.scores && (
                <span className={`text-sm font-bold tabular-nums ${getScoreColor(quiz.scores.total || 0)}`}>
                  {quiz.scores.total || 0}/15
                </span>
              )}

              {tab === 'active' && (
                <Link
                  href={`/quiz/${quiz.id}`}
                  className="px-2.5 py-1 bg-[#0071e3] text-white text-[11px] font-semibold rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"
                >
                  Continue
                </Link>
              )}

              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => onRestart(quiz.id, e)}
                  className="p-1 text-neutral-400 hover:text-blue-600 rounded-md transition-colors"
                  title="Restart"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </button>
                <button
                  onClick={(e) => onDelete(quiz.id, e)}
                  className="p-1 text-neutral-400 hover:text-red-500 rounded-md transition-colors"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View all link */}
      {quizzes.length > 4 && (
        <Link
          href="/quiz"
          className="mt-3 pt-3 border-t border-white/[0.06] block text-center text-xs font-semibold text-neutral-500 hover:text-neutral-100 transition-colors"
        >
          View all quizzes →
        </Link>
      )}
    </div>
  );
}
