'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

function MathText({ children }) {
  if (!children) return null;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{ p: ({ children }) => <span>{children}</span> }}
    >
      {children}
    </ReactMarkdown>
  );
}

export default function QuizResultsPage({ params }) {
  const { id: quizId } = use(params);
  const router = useRouter();
  const [quiz, setQuiz] = useState(null);
  const [reviewData, setReviewData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all'); // all, incorrect, skipped

  useEffect(() => {
    loadQuizResults();
    // Load flagged questions from localStorage
    const saved = localStorage.getItem(`quiz-flagged-${quizId}`);
    if (saved) {
      try {
        setFlaggedQuestions(JSON.parse(saved));
      } catch (e) {}
    }
  }, [quizId]);

  const loadQuizResults = async () => {
    try {
      const token = localStorage.getItem('newton-auth-token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/quiz/${quizId}?review=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        router.push('/quiz');
        return;
      }

      const data = await response.json();
      setQuiz(data.quiz);
      setReviewData(data.reviewData || []);
    } catch (error) {
      console.error('Failed to load quiz results:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviewData = reviewData.filter(q => {
    if (reviewFilter === 'all') return true;
    if (reviewFilter === 'incorrect') return !q.isCorrect && !q.skipped;
    if (reviewFilter === 'skipped') return q.skipped;
    if (reviewFilter === 'correct') return q.isCorrect;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-500">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading results...</span>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">Quiz not found</p>
          <Link href="/quiz" className="text-blue-600 hover:underline">
            Back to quizzes
          </Link>
        </div>
      </div>
    );
  }

  const totalScore = quiz.easyScore + quiz.mediumScore + quiz.hardScore;
  const quizTotalMarks = quiz.totalMarks || 15;
  const marksEarned = quiz.marksEarned ?? totalScore;
  const percentage = Math.round((marksEarned / quizTotalMarks) * 100);

  const getGrade = () => {
    if (percentage >= 90) return { grade: 'A*', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (percentage >= 60) return { grade: 'C', color: 'text-amber-600', bg: 'bg-amber-100' };
    if (percentage >= 50) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { grade: 'E', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const gradeInfo = getGrade();

  const getMessage = () => {
    if (percentage >= 90) return "Outstanding! You've mastered this topic!";
    if (percentage >= 80) return "Excellent work! You have a strong understanding.";
    if (percentage >= 70) return "Good job! You're getting there.";
    if (percentage >= 60) return "Not bad! A bit more practice will help.";
    if (percentage >= 50) return "Keep going! Review the topic and try again.";
    return "Don't give up! Let's go over this topic together.";
  };

  // Compute marks per level from reviewData
  const levelMarks = { easy: { earned: 0, total: 0 }, medium: { earned: 0, total: 0 }, hard: { earned: 0, total: 0 } };
  reviewData.forEach(q => {
    const lv = q.level || 'easy';
    if (levelMarks[lv]) {
      levelMarks[lv].total += (q.marks || 1);
      levelMarks[lv].earned += (q.marksAwarded || 0);
    }
  });

  const getLevelBar = (score, level) => {
    const colors = {
      easy: { bg: 'bg-green-500', light: 'bg-green-100' },
      medium: { bg: 'bg-amber-500', light: 'bg-amber-100' },
      hard: { bg: 'bg-red-500', light: 'bg-red-100' }
    };

    const lm = levelMarks[level];
    const displayEarned = lm.total > 0 ? lm.earned : score;
    const displayTotal = lm.total > 0 ? lm.total : 5;
    const pct = displayTotal > 0 ? (displayEarned / displayTotal) * 100 : 0;

    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-neutral-600 w-16 capitalize">{level}</span>
        <div className={`flex-1 h-3 ${colors[level].light} rounded-full overflow-hidden`}>
          <div
            className={`h-full ${colors[level].bg} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm font-bold text-neutral-700 w-16 text-right">{displayEarned}/{displayTotal}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/quiz" className="p-2 -ml-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="font-semibold text-neutral-900">Quiz Results</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Score Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center mb-6">
          <div className={`w-24 h-24 ${gradeInfo.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <span className={`text-4xl font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-1">{marksEarned} / {quizTotalMarks} marks</h2>
          <p className="text-lg text-neutral-500 mb-4">{percentage}%</p>
          <p className="text-neutral-600">{getMessage()}</p>
        </div>

        {/* Topic Info */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900">{quiz.topicName}</h3>
              <p className="text-sm text-neutral-500">{quiz.subject}</p>
            </div>
            {quiz.completedAt && (
              <p className="text-xs text-neutral-400">
                Completed {new Date(quiz.completedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Level Breakdown */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
          <h3 className="font-semibold text-neutral-900 mb-4">Score Breakdown</h3>
          <div className="space-y-4">
            {getLevelBar(quiz.easyScore, 'easy')}
            {getLevelBar(quiz.mediumScore, 'medium')}
            {getLevelBar(quiz.hardScore, 'hard')}
          </div>
        </div>

        {/* Weak Areas */}
        {(quiz.easyScore < 4 || quiz.mediumScore < 3 || quiz.hardScore < 2) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <h4 className="font-semibold text-amber-800 mb-1">Areas to Review</h4>
                <p className="text-sm text-amber-700">
                  {quiz.easyScore < 4 && 'Consider reviewing the basics. '}
                  {quiz.mediumScore < 3 && 'Practice applying concepts to problems. '}
                  {quiz.hardScore < 2 && 'Work on deeper analysis and connections.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Flagged Questions */}
        {flaggedQuestions.length > 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
              </svg>
              <h3 className="font-semibold text-neutral-900">Flagged for Review</h3>
              <span className="ml-auto text-sm text-neutral-500">{flaggedQuestions.length} question{flaggedQuestions.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-2 mb-4">
              {flaggedQuestions.map((q, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize flex-shrink-0 ${
                    q.level === 'easy' ? 'bg-green-100 text-green-700' :
                    q.level === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {q.level}
                  </span>
                  <p className="text-sm text-neutral-700 flex-1"><MathText>{q.questionText}</MathText></p>
                </div>
              ))}
            </div>
            <Link
              href={`/chat?subject=${encodeURIComponent(quiz.subject)}&topic=${encodeURIComponent(quiz.topicName)}&flagged=${encodeURIComponent(JSON.stringify(flaggedQuestions))}`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              Review flagged questions with Newton
            </Link>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 mb-8">
          <button
            onClick={() => setShowReview(!showReview)}
            className="flex items-center justify-center gap-2 w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            {showReview ? 'Hide Answers' : 'Review Answers'}
          </button>
          <Link
            href={`/chat?subject=${encodeURIComponent(quiz.subject)}&topic=${encodeURIComponent(quiz.topicName)}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            Review with Newton
          </Link>
          <Link
            href="/quiz"
            className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium rounded-xl transition-colors"
          >
            Back to Quizzes
          </Link>
        </div>

        {/* Review Answers Section */}
        {showReview && (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="font-semibold text-neutral-900 mb-3">Review Your Answers</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All', count: reviewData.length },
                  { id: 'correct', label: 'Correct', count: reviewData.filter(q => q.isCorrect).length },
                  { id: 'incorrect', label: 'Incorrect', count: reviewData.filter(q => !q.isCorrect && !q.skipped).length },
                  { id: 'skipped', label: 'Skipped', count: reviewData.filter(q => q.skipped).length },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setReviewFilter(filter.id)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                      reviewFilter === filter.id
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-neutral-100">
              {filteredReviewData.length === 0 ? (
                <div className="p-8 text-center text-neutral-500">
                  No questions match this filter
                </div>
              ) : (
                filteredReviewData.map((question, idx) => (
                  <div key={question.index} className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        question.isCorrect
                          ? 'bg-emerald-100 text-emerald-700'
                          : question.skipped
                            ? 'bg-neutral-100 text-neutral-500'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {question.isCorrect ? '✓' : question.skipped ? '−' : '✗'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                            question.level === 'easy' ? 'bg-green-100 text-green-700' :
                            question.level === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {question.level}
                          </span>
                          <span className="text-xs text-neutral-400 capitalize">
                            {question.questionType.replace('_', ' ')}
                          </span>
                          {question.marks > 0 && (
                            <span className="text-xs font-mono text-neutral-400">
                              {question.marksAwarded}/{question.marks} marks
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-900 font-medium mb-3">
                          <MathText>{question.questionText}</MathText>
                        </p>

                        {/* Options for multiple choice */}
                        {question.questionType === 'multiple_choice' && question.options && (
                          <div className="space-y-1 mb-3">
                            {question.options.map((option, optIdx) => {
                              const isCorrectOption = option === question.correctAnswer ||
                                option.charAt(0).toUpperCase() === question.correctAnswer?.charAt(0)?.toUpperCase();
                              const isStudentAnswer = option === question.studentAnswer ||
                                option.charAt(0).toUpperCase() === question.studentAnswer?.charAt(0)?.toUpperCase();
                              return (
                                <div
                                  key={optIdx}
                                  className={`px-3 py-2 rounded-lg text-sm ${
                                    isCorrectOption
                                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                      : isStudentAnswer && !question.isCorrect
                                        ? 'bg-red-50 border border-red-200 text-red-800'
                                        : 'bg-neutral-50 text-neutral-600'
                                  }`}
                                >
                                  <MathText>{option}</MathText>
                                  {isCorrectOption && <span className="ml-2 text-emerald-600 font-medium">✓ Correct</span>}
                                  {isStudentAnswer && !isCorrectOption && <span className="ml-2 text-red-600 font-medium">Your answer</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* For non-multiple choice questions */}
                        {question.questionType !== 'multiple_choice' && (
                          <div className="space-y-2 mb-3">
                            {question.studentAnswer && !question.skipped && (
                              <div className={`px-3 py-2 rounded-lg text-sm ${
                                question.isCorrect
                                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                  : 'bg-red-50 border border-red-200 text-red-800'
                              }`}>
                                <span className="font-medium">Your answer: </span>
                                <MathText>{question.studentAnswer}</MathText>
                              </div>
                            )}
                            {question.skipped && (
                              <div className="px-3 py-2 rounded-lg text-sm bg-neutral-100 text-neutral-600">
                                <span className="font-medium">Skipped</span>
                              </div>
                            )}
                            <div className="px-3 py-2 rounded-lg text-sm bg-emerald-50 border border-emerald-200 text-emerald-800">
                              <span className="font-medium">Correct answer: </span>
                              <MathText>{question.correctAnswer}</MathText>
                            </div>
                          </div>
                        )}

                        {/* Explanation */}
                        {question.explanation && (
                          <div className="px-3 py-2 rounded-lg text-sm bg-blue-50 border border-blue-100 text-blue-800">
                            <span className="font-medium">Explanation: </span>
                            <MathText>{question.explanation}</MathText>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
