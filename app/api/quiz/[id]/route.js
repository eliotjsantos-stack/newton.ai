import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET(req, { params }) {
  try {
    // Verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: quizId } = await params;

    // Fetch quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .eq('user_id', decoded.userId)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Check if this is a review request (for results page)
    const url = new URL(req.url);
    const isReview = url.searchParams.get('review') === 'true';

    // Get questions for current level only (don't expose answers)
    const questions = quiz.questions || [];
    const answers = quiz.answers || [];
    const answeredIndices = answers.map(a => a.questionIndex);

    // If review mode, return all questions with answers for the results page
    if (isReview) {
      const reviewData = questions.map((q, idx) => {
        const answer = answers.find(a => a.questionIndex === idx);
        return {
          index: idx,
          questionText: q.question_text,
          questionType: q.question_type,
          level: q.level,
          marks: q.marks || 1,
          section: q.section || null,
          options: q.options,
          correctAnswer: q.correct_answer,
          explanation: q.explanation,
          studentAnswer: answer?.studentAnswer || null,
          isCorrect: answer?.isCorrect || false,
          marksAwarded: answer?.marksAwarded ?? (answer?.isCorrect ? (q.marks || 1) : 0),
          skipped: answer?.skipped || false,
          answered: !!answer
        };
      });

      const totalMarksEarned = answers.reduce((s, a) => s + (a.marksAwarded || (a.isCorrect ? (a.marksAvailable || 1) : 0)), 0);

      return NextResponse.json({
        success: true,
        quiz: {
          id: quiz.id,
          topicName: quiz.topic_name,
          subject: quiz.subject,
          status: quiz.status,
          currentLevel: quiz.current_level,
          easyScore: quiz.easy_score,
          mediumScore: quiz.medium_score,
          hardScore: quiz.hard_score,
          totalMarks: quiz.total_marks || 15,
          mode: quiz.mode || 'mini_quiz',
          marksEarned: totalMarksEarned,
          startedAt: quiz.started_at,
          completedAt: quiz.completed_at
        },
        reviewData
      });
    }

    console.log('Quiz fetch debug:', {
      quizId,
      currentLevel: quiz.current_level,
      totalQuestions: questions.length,
      answeredCount: answers.length,
      answeredIndices
    });

    // Only return unanswered questions for the current level
    const currentLevelQuestions = questions
      .filter(q => q.level === quiz.current_level)
      .filter((q) => !answeredIndices.includes(questions.indexOf(q)))
      .map((q) => ({
        index: questions.indexOf(q),
        questionText: q.question_text,
        questionType: q.question_type,
        level: q.level,
        marks: q.marks || 1,
        section: q.section || null,
        options: q.options
      }));

    console.log('Returning questions:', currentLevelQuestions.length);

    // Calculate progress
    const allCurrentLevelQuestions = questions.filter(q => q.level === quiz.current_level);
    const currentLevelAnswered = allCurrentLevelQuestions.length - currentLevelQuestions.length;

    const totalMarksEarned = answers.reduce((s, a) => s + (a.marksAwarded || (a.isCorrect ? (a.marksAvailable || 1) : 0)), 0);

    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        topicName: quiz.topic_name,
        subject: quiz.subject,
        status: quiz.status,
        currentLevel: quiz.current_level,
        easyScore: quiz.easy_score,
        mediumScore: quiz.medium_score,
        hardScore: quiz.hard_score,
        easyUnlocked: quiz.easy_unlocked,
        mediumUnlocked: quiz.medium_unlocked,
        hardUnlocked: quiz.hard_unlocked,
        totalMarks: quiz.total_marks || 15,
        mode: quiz.mode || 'mini_quiz',
        marksEarned: totalMarksEarned,
        startedAt: quiz.started_at,
        completedAt: quiz.completed_at
      },
      questions: currentLevelQuestions,
      progress: {
        currentLevelAnswered,
        currentLevelTotal: allCurrentLevelQuestions.length,
        totalAnswered: answers.length,
        totalQuestions: questions.length,
        marksEarned: totalMarksEarned,
        totalMarks: quiz.total_marks || questions.reduce((s, q) => s + (q.marks || 1), 0),
      }
    });

  } catch (error) {
    console.error('Quiz fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Start or resume quiz
export async function PATCH(req, { params }) {
  try {
    // Verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: quizId } = await params;
    const { action, level } = await req.json();

    // Fetch quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .eq('user_id', decoded.userId)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    if (action === 'start') {
      // Start the quiz
      const { error: updateError } = await supabase
        .from('quizzes')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', quizId);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to start quiz' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Quiz started' });
    }

    if (action === 'change_level') {
      // Check if level is unlocked
      const levelUnlocked = {
        easy: quiz.easy_unlocked,
        medium: quiz.medium_unlocked,
        hard: quiz.hard_unlocked
      };

      if (!levelUnlocked[level]) {
        return NextResponse.json({ error: 'Level not unlocked' }, { status: 403 });
      }

      const { error: updateError } = await supabase
        .from('quizzes')
        .update({ current_level: level })
        .eq('id', quizId);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to change level' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `Changed to ${level} level` });
    }

    if (action === 'restart') {
      // Reset quiz to initial state
      const { error: updateError } = await supabase
        .from('quizzes')
        .update({
          status: 'pending',
          current_level: 'easy',
          easy_score: 0,
          medium_score: 0,
          hard_score: 0,
          easy_unlocked: true,
          medium_unlocked: false,
          hard_unlocked: false,
          answers: [],
          started_at: null,
          completed_at: null
        })
        .eq('id', quizId);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to restart quiz' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Quiz restarted' });
    }

    if (action === 'retry_level') {
      // Reset only the current level's answers
      const currentLevel = quiz.current_level;
      const questions = quiz.questions || [];
      const answers = quiz.answers || [];

      // Get indices of questions in current level
      const currentLevelIndices = questions
        .map((q, idx) => q.level === currentLevel ? idx : -1)
        .filter(idx => idx !== -1);

      // Remove answers for current level questions
      const filteredAnswers = answers.filter(a => !currentLevelIndices.includes(a.questionIndex));

      // Reset the score for current level
      const scoreUpdate = {};
      scoreUpdate[`${currentLevel}_score`] = 0;

      const { error: updateError } = await supabase
        .from('quizzes')
        .update({
          answers: filteredAnswers,
          ...scoreUpdate
        })
        .eq('id', quizId);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to retry level' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `${currentLevel} level reset` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Quiz update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete quiz
export async function DELETE(req, { params }) {
  try {
    // Verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: quizId } = await params;

    // Delete quiz (only if owned by user)
    const { error: deleteError } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId)
      .eq('user_id', decoded.userId);

    if (deleteError) {
      console.error('Quiz delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Quiz deleted' });

  } catch (error) {
    console.error('Quiz delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
