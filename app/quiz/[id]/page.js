'use client';

import { useState, useEffect, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Calculator from '@/components/quiz/Calculator';

function MathText({ children }) {
  if (!children) return null;
  let text = String(children);

  // If already has $ delimiters, render directly
  if (text.includes('$')) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{ p: ({ children }) => <span>{children}</span> }}
      >
        {text}
      </ReactMarkdown>
    );
  }

  // Detect raw LaTeX commands and wrap in $...$
  if (/\\(frac|sqrt|sum|int|prod|lim|infty|alpha|beta|gamma|delta|theta|pi|sigma|omega|times|div|pm|mp|cdot|leq|geq|neq|approx|equiv|rightarrow|leftarrow|Rightarrow|Leftarrow|text|mathrm|mathbf|overline|underline|hat|bar|vec|dot|ddot|binom|log|ln|sin|cos|tan|sec|csc|cot)\b/.test(text)) {
    // Wrap the entire text in $ delimiters for KaTeX
    return (
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{ p: ({ children }) => <span>{children}</span> }}
      >
        {`$${text}$`}
      </ReactMarkdown>
    );
  }

  // Light transforms for simple math patterns
  let transformed = text;
  transformed = transformed.replace(/(\d+)\s*\/\s*(\d+)/g, '$\\frac{$1}{$2}$');
  transformed = transformed.replace(/(\w)\^(\{[^}]+\}|\d+)/g, '$$$1^{$2}$$');

  if (transformed !== text) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{ p: ({ children }) => <span>{children}</span> }}
      >
        {transformed}
      </ReactMarkdown>
    );
  }

  // Plain text — no math detected
  return <span>{text}</span>;
}

export default function QuizPage({ params }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    }>
      <QuizPageContent params={params} />
    </Suspense>
  );
}

function QuizPageContent({ params }) {
  const { id: quizId } = use(params);
  const router = useRouter();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [scores, setScores] = useState({ easy: 0, medium: 0, hard: 0 });
  const [levelUnlockMessage, setLevelUnlockMessage] = useState(null);
  const [answeredInLevel, setAnsweredInLevel] = useState(new Set());
  const [error, setError] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(0);
  const [streak, setStreak] = useState(0);
  const [confidence, setConfidence] = useState(3);
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const searchParams = useSearchParams();

  // Load flagged questions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`quiz-flagged-${quizId}`);
    if (saved) {
      try {
        setFlaggedQuestions(JSON.parse(saved));
      } catch (e) {}
    }
  }, [quizId]);

  // Save flagged questions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`quiz-flagged-${quizId}`, JSON.stringify(flaggedQuestions));
  }, [flaggedQuestions, quizId]);

  const toggleFlag = (question) => {
    setFlaggedQuestions(prev => {
      const exists = prev.find(q => q.index === question.index);
      if (exists) {
        return prev.filter(q => q.index !== question.index);
      } else {
        return [...prev, {
          index: question.index,
          questionText: question.questionText,
          questionType: question.questionType,
          level: question.level
        }];
      }
    });
  };

  const isQuestionFlagged = (questionIndex) => {
    return flaggedQuestions.some(q => q.index === questionIndex);
  };

  useEffect(() => {
    if (!quiz || feedback) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [quiz, feedback]);

  useEffect(() => { loadQuiz(); }, [quizId]);

  const loadQuiz = async () => {
    try {
      const token = localStorage.getItem('newton-auth-token');
      if (!token) { router.push('/login'); return; }

      const response = await fetch(`/api/quiz/${quizId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setLoadError(errorData.error || `Failed to load quiz`);
        return;
      }

      const data = await response.json();
      setQuiz(data.quiz);
      setQuestions(data.questions || []);
      setProgress(data.progress);
      setScores({
        easy: data.quiz?.easyScore || 0,
        medium: data.quiz?.mediumScore || 0,
        hard: data.quiz?.hardScore || 0
      });

      if (data.quiz.status === 'pending') {
        await fetch(`/api/quiz/${quizId}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' })
        });
      }
    } catch (err) {
      setLoadError(err.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async () => {
    const token = localStorage.getItem('newton-auth-token');
    const question = questions[currentQuestionIdx];
    const answer = (question.questionType === 'multiple_choice' || question.questionType === 'true_false')
      ? selectedAnswer : textAnswer;

    if (!answer || answer.trim() === '') return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/quiz/${quizId}/answer`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIndex: question.index, answer, timeTaken: timer, confidenceRating: confidence })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to submit answer');
        setSubmitting(false);
        return;
      }

      const data = await response.json();

      if (data.result.isCorrect) setStreak(s => s + 1);
      else setStreak(0);

      setFeedback({
        isCorrect: data.result.isCorrect,
        feedback: data.result.feedback,
        correctAnswer: data.result.correctAnswer,
        marksAwarded: data.result.marksAwarded,
        marksAvailable: data.result.marksAvailable,
      });

      setScores(data.scores);
      if (data.levelUnlockMessage) setLevelUnlockMessage(data.levelUnlockMessage);
      setAnsweredInLevel(prev => new Set([...prev, question.index]));
      setProgress(data.progress);

      if (data.isComplete) setTimeout(() => router.push(`/quiz/${quizId}/results`), 2000);
      if (data.newLevel) setQuiz(prev => ({ ...prev, currentLevel: data.newLevel }));
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    setLevelUnlockMessage(null);
    setError(null);
    setSelectedAnswer(null);
    setTextAnswer('');
    setTimer(0);
    setConfidence(3);
    setQuestionStartTime(Date.now());
    loadQuiz();
    setCurrentQuestionIdx(0);
    setAnsweredInLevel(new Set());
  };

  const handleChangeLevel = async (level) => {
    const token = localStorage.getItem('newton-auth-token');
    try {
      await fetch(`/api/quiz/${quizId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_level', level })
      });
      setFeedback(null);
      setCurrentQuestionIdx(0);
      setAnsweredInLevel(new Set());
      setTimer(0);
      await loadQuiz();
    } catch (error) {}
  };

  const handleRetryLevel = async () => {
    const token = localStorage.getItem('newton-auth-token');
    try {
      await fetch(`/api/quiz/${quizId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry_level' })
      });
      setFeedback(null);
      setCurrentQuestionIdx(0);
      setAnsweredInLevel(new Set());
      setTimer(0);
      setStreak(0);
      await loadQuiz();
    } catch (error) {}
  };

  const handleSkip = async (question) => {
    const token = localStorage.getItem('newton-auth-token');
    setSubmitting(true);
    try {
      const response = await fetch(`/api/quiz/${quizId}/answer`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIndex: question.index, answer: '[SKIPPED]', timeTaken: timer, skipped: true })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to skip question');
        setSubmitting(false);
        return;
      }

      const data = await response.json();
      setStreak(0);
      setFeedback({
        isCorrect: false,
        feedback: `Skipped. The correct answer was: ${data.result.correctAnswer}\n\n${data.result.feedback}`,
        correctAnswer: data.result.correctAnswer,
        skipped: true
      });
      setScores(data.scores);
      if (data.levelUnlockMessage) setLevelUnlockMessage(data.levelUnlockMessage);
      setAnsweredInLevel(prev => new Set([...prev, question.index]));
      setProgress(data.progress);

      if (data.isComplete) setTimeout(() => router.push(`/quiz/${quizId}/results`), 2000);
      if (data.newLevel) setQuiz(prev => ({ ...prev, currentLevel: data.newLevel }));
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-white/50 mb-4">{loadError || 'Quiz not found'}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setLoadError(null); setLoading(true); loadQuiz(); }} className="px-4 py-2 text-sm font-medium text-white/60 hover:bg-white/5 rounded-lg transition">
              Retry
            </button>
            <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-white/60 hover:bg-white/5 rounded-lg transition">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions?.[currentQuestionIdx];
  const progressPercent = progress
    ? (progress.marksEarned != null && progress.totalMarks
      ? (progress.marksEarned / progress.totalMarks) * 100
      : (progress.totalAnswered / progress.totalQuestions) * 100)
    : 0;
  const isMathSubject = ['mathematics', 'maths', 'math', 'science', 'physics', 'chemistry'].some(s =>
    quiz.subject?.toLowerCase().includes(s)
  );

  return (
    <div className="min-h-screen bg-[#0B0B0C]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-[#0B0B0C] border-b border-white/10">
        <div className="h-1 bg-white/5">
          <div className="h-full bg-[#0071e3] transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="max-w-3xl mx-auto px-6 h-12 flex items-center justify-between">
          <Link href="/dashboard" className="text-white/30 hover:text-white/60 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>

          <div className="text-center">
            <p className="text-sm font-medium text-white">{quiz.topicName}</p>
            <p className="text-xs text-white/40 font-mono">
              {progress?.marksEarned != null
                ? `${progress.marksEarned}/${progress.totalMarks} marks`
                : `${progress?.totalAnswered}/${progress?.totalQuestions} completed`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-white/30">{formatTime(timer)}</span>
            {isMathSubject && (
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${showCalculator ? 'bg-[#0071e3] text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="pt-20 pb-12 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Level tabs */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-white/5 rounded-lg p-1 border border-white/10">
              {['easy', 'medium', 'hard'].map((level) => {
                const isUnlocked = level === 'easy' || (level === 'medium' ? quiz.mediumUnlocked : quiz.hardUnlocked);
                const isActive = quiz.currentLevel === level;
                return (
                  <button
                    key={level}
                    onClick={() => isUnlocked && !isActive && handleChangeLevel(level)}
                    disabled={!isUnlocked}
                    className={`relative px-5 py-2 text-sm font-medium rounded-md transition-all ${
                      isActive
                        ? 'bg-[#242427] text-white border border-white/10'
                        : isUnlocked
                        ? 'text-white/50 hover:text-white/80'
                        : 'text-white/20 cursor-not-allowed'
                    }`}
                  >
                    <span className="capitalize">{level}</span>
                    <span className="ml-1.5 text-white/30">{scores[level]}</span>
                    {!isUnlocked && (
                      <svg className="w-3 h-3 absolute -top-1 -right-1 text-white/30" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Streak indicator */}
          {streak > 1 && !feedback && (
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 text-sm font-medium rounded-full border border-amber-500/20">
                {streak} correct in a row
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Content */}
          {feedback ? (
            <div className="space-y-6">
              <div className={`p-6 rounded-lg border ${
                feedback.isCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : feedback.skipped
                    ? 'bg-white/5 border-white/10'
                    : 'bg-red-500/10 border-red-500/20'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    feedback.isCorrect
                      ? 'bg-emerald-500/20'
                      : feedback.skipped
                        ? 'bg-white/10'
                        : 'bg-red-500/20'
                  }`}>
                    {feedback.isCorrect ? (
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : feedback.skipped ? (
                      <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${
                        feedback.isCorrect
                          ? 'text-emerald-400'
                          : feedback.skipped
                            ? 'text-white/60'
                            : 'text-red-400'
                      }`}>
                        {feedback.isCorrect ? 'Correct' : feedback.skipped ? 'Skipped' : 'Incorrect'}
                      </p>
                      {feedback.marksAvailable > 0 && (
                        <span className="text-xs font-mono text-white/30">
                          {feedback.marksAwarded}/{feedback.marksAvailable} marks
                        </span>
                      )}
                    </div>
                    <div className={`mt-2 text-sm leading-relaxed ${
                      feedback.isCorrect
                        ? 'text-emerald-300/80'
                        : feedback.skipped
                          ? 'text-white/50'
                          : 'text-red-300/80'
                    }`}>
                      <MathText>{feedback.feedback}</MathText>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flag for review button in feedback */}
              {currentQuestion && (
                <button
                  onClick={() => toggleFlag(currentQuestion)}
                  className={`w-full py-3 flex items-center justify-center gap-2 rounded-lg border transition ${
                    isQuestionFlagged(currentQuestion.index)
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                  }`}
                >
                  <svg className="w-4 h-4" fill={isQuestionFlagged(currentQuestion.index) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                  </svg>
                  {isQuestionFlagged(currentQuestion.index) ? 'Flagged for review' : 'Flag to review with Newton later'}
                </button>
              )}

              {levelUnlockMessage && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm font-medium text-amber-400">{levelUnlockMessage}</p>
                </div>
              )}

              <button
                onClick={handleNextQuestion}
                className="w-full py-3 bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium rounded-lg transition"
              >
                Continue
              </button>
            </div>
          ) : currentQuestion ? (
            <div className="space-y-8">
              <div>
                {/* Section header for past paper mode */}
                {currentQuestion.section && (
                  <div className="mb-4 pb-2 border-b border-white/10">
                    <p className="text-xs font-bold text-[#0071e3]/60 uppercase tracking-widest">Section {currentQuestion.section}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-white/30 uppercase tracking-wider font-mono">
                      {currentQuestion.questionType.replace('_', ' ')}
                    </p>
                    {currentQuestion.marks > 0 && (
                      <span className="text-xs text-white/20 font-mono">({currentQuestion.marks} {currentQuestion.marks === 1 ? 'mark' : 'marks'})</span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFlag(currentQuestion)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition ${
                      isQuestionFlagged(currentQuestion.index)
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                    }`}
                    title={isQuestionFlagged(currentQuestion.index) ? 'Remove flag' : 'Flag for review'}
                  >
                    <svg className="w-3.5 h-3.5" fill={isQuestionFlagged(currentQuestion.index) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                    </svg>
                    {isQuestionFlagged(currentQuestion.index) ? 'Flagged' : 'Flag'}
                  </button>
                </div>
                <h1 className="text-xl font-semibold text-white leading-relaxed">
                  <MathText>{currentQuestion.questionText}</MathText>
                </h1>
              </div>

              <div>
                {currentQuestion.questionType === 'multiple_choice' && (
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedAnswer(option)}
                        className={`w-full p-4 text-left rounded-lg border transition ${
                          selectedAnswer === option
                            ? 'border-[#0071e3] bg-[#242427] text-white'
                            : 'border-white/10 hover:border-white/20 bg-white/[0.03] text-white/80'
                        }`}
                      >
                        <MathText>{option}</MathText>
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.questionType === 'true_false' && (
                  <div className="grid grid-cols-2 gap-3">
                    {['True', 'False'].map((option) => (
                      <button
                        key={option}
                        onClick={() => setSelectedAnswer(option)}
                        className={`py-4 font-medium rounded-lg border transition ${
                          selectedAnswer === option
                            ? 'border-[#0071e3] bg-[#242427] text-white'
                            : 'border-white/10 hover:border-white/20 bg-white/[0.03] text-white/80'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.questionType === 'short_answer' && (
                  <input
                    type="text"
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="Type your answer..."
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#0071e3] focus:border-[#0071e3]"
                    onKeyDown={(e) => e.key === 'Enter' && handleAnswer()}
                  />
                )}

                {(currentQuestion.questionType === 'explain' || currentQuestion.questionType === 'structured') && (
                  <textarea
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder={currentQuestion.questionType === 'structured' ? "Write your answer here..." : "Explain your reasoning..."}
                    rows={currentQuestion.questionType === 'structured' ? 6 : 4}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#0071e3] focus:border-[#0071e3] resize-none"
                  />
                )}
              </div>

              {/* Confidence Slider */}
              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white/60">How confident are you?</span>
                  <span className="text-sm font-semibold text-[#0071e3] font-mono">{confidence}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={confidence}
                  onChange={(e) => setConfidence(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#0071e3]"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-white/30">Guessing</span>
                  <span className="text-xs text-white/30">Very sure</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAnswer}
                  disabled={submitting || (
                    (currentQuestion.questionType === 'multiple_choice' || currentQuestion.questionType === 'true_false')
                      ? !selectedAnswer
                      : !textAnswer.trim()
                  )}
                  className="flex-1 py-3 bg-[#0071e3] hover:bg-[#0077ED] disabled:bg-white/5 disabled:text-white/20 text-white font-medium rounded-lg transition disabled:cursor-not-allowed"
                >
                  {submitting ? 'Checking...' : 'Submit'}
                </button>
                <button
                  onClick={() => handleSkip(currentQuestion)}
                  disabled={submitting}
                  className="px-6 py-3 text-white/40 hover:text-white/70 hover:bg-white/5 font-medium rounded-lg transition disabled:opacity-50"
                >
                  Skip
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 bg-[#0071e3]/20">
                <svg className="w-8 h-8 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-2">
                Level complete
              </h2>

              <p className="text-4xl font-bold text-white font-mono mb-1">{scores[quiz.currentLevel]}</p>
              <p className="text-sm text-white/40 mb-8">correct in {quiz.currentLevel} level</p>

              <div className="space-y-3 max-w-xs mx-auto">
                {quiz.currentLevel !== 'hard' && (
                  <button
                    onClick={() => handleChangeLevel(quiz.currentLevel === 'easy' ? 'medium' : 'hard')}
                    className="w-full py-3 bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium rounded-lg transition"
                  >
                    Continue to {quiz.currentLevel === 'easy' ? 'medium' : 'hard'}
                  </button>
                )}

                {quiz.currentLevel === 'hard' && (
                  <Link href={`/quiz/${quizId}/results`} className="block w-full py-3 bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium rounded-lg transition text-center">
                    View results
                  </Link>
                )}

                <button onClick={handleRetryLevel} className="w-full py-3 text-white/50 hover:text-white hover:bg-white/5 font-medium rounded-lg transition">
                  Retry level
                </button>

                <Link href="/dashboard" className="block w-full py-3 text-white/30 hover:text-white/60 font-medium transition text-center">
                  Exit quiz
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Calculator */}
      {showCalculator && (
        <div className="fixed bottom-6 right-6 z-50">
          <Calculator onClose={() => setShowCalculator(false)} />
        </div>
      )}
    </div>
  );
}
