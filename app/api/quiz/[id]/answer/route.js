import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { evaluateQuizCompletion } from '@/lib/masteryEngine';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req, { params }) {
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
    const { questionIndex, answer, timeTaken, skipped, confidenceRating } = await req.json();

    if (questionIndex === undefined || answer === undefined) {
      return NextResponse.json({ error: 'Question index and answer are required' }, { status: 400 });
    }

    // Fetch quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .eq('user_id', decoded.userId)
      .single();

    if (quizError || !quiz) {
      console.error('Quiz fetch error:', quizError);
      return NextResponse.json({ error: 'Quiz not found', details: quizError?.message }, { status: 404 });
    }

    const questions = quiz.questions || [];
    const question = questions[questionIndex];

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check if already answered
    const existingAnswers = quiz.answers || [];
    if (existingAnswers.some(a => a.questionIndex === questionIndex)) {
      return NextResponse.json({ error: 'Question already answered' }, { status: 400 });
    }

    const questionMarks = question.marks || 1;

    // Evaluate answer
    let isCorrect = false;
    let feedback = '';
    let marksAwarded = 0;

    // Handle skipped questions
    if (skipped) {
      isCorrect = false;
      marksAwarded = 0;
      feedback = question.explanation || 'This question was skipped.';
    } else if (question.question_type === 'multiple_choice') {
      // Extract letter from answer (A, B, C, or D)
      const answerLetter = answer.trim().toUpperCase().charAt(0);
      const correctLetter = question.correct_answer.trim().toUpperCase().charAt(0);
      isCorrect = answerLetter === correctLetter;
      marksAwarded = isCorrect ? questionMarks : 0;
      feedback = isCorrect
        ? 'Correct! ' + question.explanation
        : `Incorrect. The correct answer was ${question.correct_answer}. ${question.explanation}`;
    } else if (question.question_type === 'true_false') {
      const answerBool = answer.toLowerCase().includes('true');
      const correctBool = question.correct_answer.toLowerCase().includes('true');
      isCorrect = answerBool === correctBool;
      marksAwarded = isCorrect ? questionMarks : 0;
      feedback = isCorrect
        ? 'Correct! ' + question.explanation
        : `Incorrect. The answer is ${question.correct_answer}. ${question.explanation}`;
    } else if (question.question_type === 'short_answer') {
      // Use AI to evaluate
      try {
        const evalPrompt = `Evaluate this student answer for the following question.

Question: ${question.question_text}
Expected answer/key points: ${question.correct_answer}
Student's answer: ${answer}

Evaluate if the student's answer demonstrates understanding of the key concepts. Be encouraging but accurate.

Return JSON only:
{
  "isCorrect": true/false (true if answer shows good understanding, false if major concepts are missing or wrong),
  "feedback": "Brief encouraging feedback explaining what was good or what was missing"
}`;

        const evalCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful teacher evaluating student answers. Return only valid JSON.' },
            { role: 'user', content: evalPrompt }
          ],
          temperature: 0.3,
          max_tokens: 300,
        });

        const evalResponse = evalCompletion.choices[0].message.content.trim();
        const cleanedEval = evalResponse
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();
        const evaluation = JSON.parse(cleanedEval);
        isCorrect = evaluation.isCorrect;
        marksAwarded = isCorrect ? questionMarks : 0;
        feedback = evaluation.feedback + '\n\n' + question.explanation;
      } catch (evalError) {
        console.error('Error evaluating answer:', evalError);
        isCorrect = answer.trim().length > 20;
        marksAwarded = isCorrect ? questionMarks : 0;
        feedback = question.explanation;
      }
    } else if (question.question_type === 'explain' || question.question_type === 'structured') {
      // For explain/structured: use GPT to award partial marks
      try {
        const evalPrompt = `Evaluate this student answer for the following question.

Question: ${question.question_text}
Expected answer/key points: ${question.correct_answer}
Student's answer: ${answer}
Maximum marks: ${questionMarks}

Award marks from 0 to ${questionMarks} based on how well the student demonstrates understanding.
- Full marks: comprehensive answer covering all key points
- Partial marks: some key points covered
- 0 marks: completely wrong or irrelevant

Return JSON only:
{
  "marksAwarded": <number 0 to ${questionMarks}>,
  "isCorrect": true/false (true if at least half marks earned),
  "feedback": "Brief encouraging feedback explaining marks awarded"
}`;

        const evalCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful teacher evaluating student answers. Return only valid JSON.' },
            { role: 'user', content: evalPrompt }
          ],
          temperature: 0.3,
          max_tokens: 400,
        });

        const evalResponse = evalCompletion.choices[0].message.content.trim();
        const cleanedEval = evalResponse
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();
        const evaluation = JSON.parse(cleanedEval);
        marksAwarded = Math.min(questionMarks, Math.max(0, evaluation.marksAwarded || 0));
        isCorrect = evaluation.isCorrect || marksAwarded >= questionMarks / 2;
        feedback = evaluation.feedback + '\n\n' + question.explanation;
      } catch (evalError) {
        console.error('Error evaluating answer:', evalError);
        isCorrect = answer.trim().length > 30;
        marksAwarded = isCorrect ? Math.ceil(questionMarks / 2) : 0;
        feedback = question.explanation;
      }
    }

    // Record the answer
    const newAnswer = {
      questionIndex,
      level: question.level,
      questionType: question.question_type,
      studentAnswer: answer,
      isCorrect,
      marksAwarded,
      marksAvailable: questionMarks,
      skipped: skipped || false,
      timeTaken: timeTaken || 0,
      answeredAt: new Date().toISOString()
    };

    const updatedAnswers = [...existingAnswers, newAnswer];

    // Calculate scores by level
    const levelScores = {
      easy: updatedAnswers.filter(a => a.level === 'easy' && a.isCorrect).length,
      medium: updatedAnswers.filter(a => a.level === 'medium' && a.isCorrect).length,
      hard: updatedAnswers.filter(a => a.level === 'hard' && a.isCorrect).length
    };

    // Count answers per level (dynamically — not hardcoded to 5)
    const easyTotal = questions.filter(q => q.level === 'easy').length;
    const mediumTotal = questions.filter(q => q.level === 'medium').length;
    const easyAnswered = updatedAnswers.filter(a => a.level === 'easy').length;
    const mediumAnswered = updatedAnswers.filter(a => a.level === 'medium').length;

    // Unlock levels after completing the previous level
    const mediumUnlocked = quiz.medium_unlocked || easyAnswered >= easyTotal;
    const hardUnlocked = quiz.hard_unlocked || mediumAnswered >= mediumTotal;

    // Auto-advance level when current level is complete
    let newLevel = quiz.current_level;
    if (quiz.current_level === 'easy' && easyAnswered >= easyTotal && mediumUnlocked) {
      newLevel = 'medium';
    } else if (quiz.current_level === 'medium' && mediumAnswered >= mediumTotal && hardUnlocked) {
      newLevel = 'hard';
    }

    // Update quiz record
    const { error: updateError } = await supabase
      .from('quizzes')
      .update({
        answers: updatedAnswers,
        easy_score: levelScores.easy,
        medium_score: levelScores.medium,
        hard_score: levelScores.hard,
        medium_unlocked: mediumUnlocked,
        hard_unlocked: hardUnlocked,
        current_level: newLevel
      })
      .eq('id', quizId);

    if (updateError) {
      console.error('Error updating quiz:', updateError);
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
    }

    // Record attempt in quiz_attempts table (non-blocking)
    supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        question_index: questionIndex,
        level: question.level,
        question_type: question.question_type,
        student_answer: answer,
        is_correct: isCorrect,
        time_taken_seconds: timeTaken || 0,
        confidence_rating: confidenceRating || null,
      })
      .then(({ error }) => {
        if (error) console.error('Error recording quiz attempt:', error);
      });

    // Check if quiz is complete (all questions answered)
    const isComplete = updatedAnswers.length === questions.length;
    if (isComplete) {
      await supabase
        .from('quizzes')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', quizId);

      // Evaluate mastery (non-blocking)
      evaluateQuizCompletion(decoded.userId, quizId).catch(err =>
        console.error('Mastery evaluation error:', err)
      );
    }

    // Determine if a new level was just unlocked
    let levelUnlockMessage = null;
    if (mediumUnlocked && !quiz.medium_unlocked) {
      levelUnlockMessage = 'Medium level unlocked!';
    } else if (hardUnlocked && !quiz.hard_unlocked) {
      levelUnlockMessage = 'Hard level unlocked!';
    }

    // Calculate marks-based progress
    const totalMarksEarned = updatedAnswers.reduce((s, a) => s + (a.marksAwarded || (a.isCorrect ? (a.marksAvailable || 1) : 0)), 0);
    const quizTotalMarks = quiz.total_marks || questions.reduce((s, q) => s + (q.marks || 1), 0);

    return NextResponse.json({
      success: true,
      result: {
        isCorrect,
        feedback,
        correctAnswer: question.correct_answer,
        marksAwarded,
        marksAvailable: questionMarks,
      },
      scores: levelScores,
      levelUnlockMessage,
      mediumUnlocked,
      hardUnlocked,
      isComplete,
      progress: {
        totalAnswered: updatedAnswers.length,
        totalQuestions: questions.length,
        marksEarned: totalMarksEarned,
        totalMarks: quizTotalMarks,
      },
      newLevel: newLevel !== quiz.current_level ? newLevel : null
    });

  } catch (error) {
    console.error('Quiz answer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
