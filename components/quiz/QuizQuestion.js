'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Component to render text with math support
function MathText({ children }) {
  if (!children) return null;

  let text = children;

  // If already has $ signs, assume it's properly formatted LaTeX
  if (text.includes('$')) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <span>{children}</span>
        }}
      >
        {text}
      </ReactMarkdown>
    );
  }

  // Convert common math patterns to proper LaTeX
  // Handle variables with subscripts like x1, y2 → x₁, y₂
  text = text.replace(/([a-zA-Z])(\d)(?!\d)/g, '$$$1_$2$$');

  // Handle exponents like x^2, x^3
  text = text.replace(/(\w)\^(\d+)/g, '$$$1^{$2}$$');

  // Handle fractions in parentheses like (6 - 2) / (3 - 1)
  text = text.replace(/\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g, '$$\\frac{$1}{$2}$$');

  // Handle simple fractions like 4/2
  text = text.replace(/(\d+)\s*\/\s*(\d+)/g, '$$\\frac{$1}{$2}$$');

  // Handle equals signs with spacing
  text = text.replace(/\s*=\s*/g, ' $=$ ');

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }) => <span>{children}</span>
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

export default function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  onSubmit,
  disabled,
  onPasteBlocked
}) {
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confidence, setConfidence] = useState(3);

  const handleSubmit = async () => {
    if (disabled || submitting) return;

    let finalAnswer = answer;
    if (question.questionType === 'multiple_choice') {
      finalAnswer = selectedOption;
    } else if (question.questionType === 'true_false') {
      finalAnswer = selectedOption;
    }

    if (!finalAnswer || finalAnswer.trim() === '') return;

    setSubmitting(true);
    await onSubmit(finalAnswer, confidence);
    setSubmitting(false);
  };

  const getLevelBadge = () => {
    const styles = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-amber-100 text-amber-700',
      hard: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[question.level]}`}>
        {question.level.charAt(0).toUpperCase() + question.level.slice(1)}
      </span>
    );
  };

  const renderAnswerInput = () => {
    switch (question.questionType) {
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedOption(option)}
                disabled={disabled}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                  selectedOption === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="font-medium"><MathText>{option}</MathText></span>
              </button>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="flex gap-4">
            {['True', 'False'].map((option) => (
              <button
                key={option}
                onClick={() => setSelectedOption(option)}
                disabled={disabled}
                className={`flex-1 py-4 px-6 text-center rounded-xl border-2 font-medium transition-all ${
                  selectedOption === option
                    ? option === 'True'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-red-500 bg-red-50 text-red-700'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case 'short_answer':
        return (
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onPaste={(e) => { e.preventDefault(); onPasteBlocked?.(); }}
            disabled={disabled}
            placeholder="Type your answer..."
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
        );

      case 'explain':
        return (
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onPaste={(e) => { e.preventDefault(); onPasteBlocked?.(); }}
            disabled={disabled}
            placeholder="Explain your reasoning..."
            rows={4}
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
          />
        );

      default:
        return null;
    }
  };

  const isAnswerValid = () => {
    if (question.questionType === 'multiple_choice' || question.questionType === 'true_false') {
      return selectedOption !== null;
    }
    return answer.trim().length > 0;
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      {/* Question Header */}
      <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-neutral-500">
            Question {questionNumber} of {totalQuestions}
          </span>
          {getLevelBadge()}
        </div>
        <span className="text-xs text-neutral-400 uppercase tracking-wide">
          {question.questionType.replace('_', ' ')}
        </span>
      </div>

      {/* Question Content */}
      <div className="p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">
          <MathText>{question.questionText}</MathText>
        </h2>

        {renderAnswerInput()}

        {/* Confidence Slider */}
        {isAnswerValid() && (
          <div className="mt-4 p-4 bg-neutral-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700">How confident are you?</span>
              <span className="text-sm font-semibold text-blue-600">{confidence}/5</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={confidence}
              onChange={(e) => setConfidence(parseInt(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-neutral-400">Guessing</span>
              <span className="text-xs text-neutral-400">Very sure</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={!isAnswerValid() || disabled || submitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Checking...</span>
              </>
            ) : (
              'Submit Answer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
