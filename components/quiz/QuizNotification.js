'use client';

import { useState } from 'react';

export default function QuizNotification({
  topicName,
  topicId,
  subject,
  classId,
  onStartQuiz,
  onDismiss
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleStartQuiz = async () => {
    setGenerating(true);
    setError(null);

    try {
      const token = localStorage.getItem('newton-auth-token');
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topicId,
          topicName,
          subject,
          classId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      const data = await response.json();
      if (onStartQuiz) {
        onStartQuiz(data.quiz);
      }
    } catch (err) {
      console.error('Failed to generate quiz:', err);
      setError('Failed to create quiz. Try again.');
      setGenerating(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slideUp">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 p-5 w-80">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">Ready to test yourself?</h3>
              <p className="text-xs text-neutral-500">On: {topicName}</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-neutral-600 mb-4">
          You've been discussing this topic for a while. Take a quick quiz to check your understanding!
        </p>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600 mb-3">{error}</p>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            disabled={generating}
            className="flex-1 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleStartQuiz}
            disabled={generating}
            className="flex-1 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                <span>Start Quiz</span>
              </>
            )}
          </button>
        </div>

        {/* Quiz Info */}
        <p className="text-xs text-neutral-400 text-center mt-3">
          15 questions • 3 difficulty levels
        </p>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
