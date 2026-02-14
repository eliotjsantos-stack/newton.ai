'use client';

import { useState } from 'react';

export default function UnderstandingRatingModal({
  topicName,
  topicId,
  messageCount,
  classId,
  onClose,
  onSubmit
}) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('newton-auth-token');
      const response = await fetch('/api/ratings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topicId,
          rating,
          unclearFeedback: feedback.trim() || null,
          messageCount,
          classId
        })
      });

      if (response.ok) {
        setSubmitted(true);
        if (onSubmit) {
          onSubmit({ rating, feedback });
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels = [
    '',
    'Still confused',
    'Somewhat unclear',
    'Getting there',
    'Mostly understand',
    'Fully confident'
  ];

  const ratingEmojis = ['', '😕', '🤔', '😐', '😊', '🎉'];

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-scaleIn text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-2">Thanks for your feedback!</h3>
          <p className="text-sm text-neutral-500">This helps us understand how you're learning.</p>
        </div>

        <style jsx>{`
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-scaleIn {
            animation: scaleIn 0.2s ease-out forwards;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-slideUp">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">How well do you understand</h2>
            <p className="text-lg font-bold text-blue-600">{topicName}?</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Star Rating */}
        <div className="mb-6">
          <div className="flex justify-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110 active:scale-95"
              >
                <svg
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-neutral-300 fill-neutral-200'
                  }`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              </button>
            ))}
          </div>
          <p className="text-center text-sm font-medium text-neutral-600 h-5">
            {rating > 0 && (
              <span className="flex items-center justify-center gap-2">
                <span>{ratingEmojis[rating]}</span>
                <span>{ratingLabels[rating]}</span>
              </span>
            )}
          </p>
        </div>

        {/* Feedback Input (shown after rating) */}
        {rating > 0 && rating < 4 && (
          <div className="mb-6 animate-fadeIn">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              What's still unclear? <span className="text-neutral-400">(optional)</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Let Newton know what confused you..."
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
