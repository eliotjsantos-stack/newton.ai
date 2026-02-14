import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { randomizeQuizNumbers } from '@/lib/quizRandomizer';
import { getQuizGrounding, buildQuizPrompt } from '@/lib/quizGrounding';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
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

    const { topicId, topicName, subject, classId, chatContext, totalMarks, mode } = await req.json();

    if (!topicName || !subject) {
      return NextResponse.json({ error: 'Topic name and subject are required' }, { status: 400 });
    }

    // Validate mode and totalMarks
    const validModes = ['mini_quiz', 'full_test', 'topic_focus', 'past_paper'];
    const effectiveMode = validModes.includes(mode) ? mode : 'mini_quiz';
    const effectiveTotalMarks = totalMarks && totalMarks >= 5 && totalMarks <= 100
      ? Math.round(totalMarks / 5) * 5
      : null; // let buildQuizPrompt use mode default

    console.log('Generating quiz for topic:', topicName, 'subject:', subject, 'mode:', effectiveMode);

    // Get user info for year group
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('year_group')
      .eq('id', decoded.userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    // Get grounding data if class is provided
    const grounding = await getQuizGrounding(classId);

    // Build prompt using shared helper
    const { prompt, effectiveMarks } = buildQuizPrompt({
      topicName,
      grounding: grounding || (userData?.year_group ? { yearGroup: userData.year_group } : null),
      totalMarks: effectiveTotalMarks,
      mode: effectiveMode,
      chatContext,
    });

    // Dynamic max_tokens based on total marks
    const maxTokens = Math.min(16000, Math.max(4000, effectiveMarks * 120));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an educational quiz generator for UK secondary school exams. Generate age-appropriate, curriculum-aligned questions. Always return valid JSON arrays only.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    console.log('OpenAI response received, parsing questions...');

    let questions;
    try {
      const responseText = completion.choices[0].message.content.trim();
      // Remove any markdown code blocks if present
      const cleanedResponse = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      questions = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse quiz questions:', parseError);
      console.error('Raw response:', completion.choices[0].message.content);
      return NextResponse.json({ error: 'Failed to generate valid quiz questions' }, { status: 500 });
    }

    // Validate questions structure
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Invalid quiz format - no questions generated' }, { status: 500 });
    }

    // Ensure every question has a marks field (default to 1 if missing)
    questions = questions.map(q => ({
      ...q,
      marks: q.marks || 1,
    }));

    // Validate total marks (with ±3 tolerance)
    const actualTotal = questions.reduce((s, q) => s + q.marks, 0);
    if (Math.abs(actualTotal - effectiveMarks) > 3) {
      console.warn(`Mark total mismatch: got ${actualTotal}, expected ${effectiveMarks}. Continuing anyway.`);
    }

    // Organize questions by level for backward compat
    const easyQuestions = questions.filter(q => q.level === 'easy');
    const mediumQuestions = questions.filter(q => q.level === 'medium');
    const hardQuestions = questions.filter(q => q.level === 'hard');

    // Randomize numeric values in STEM questions to prevent answer-sharing
    questions = await randomizeQuizNumbers(questions, subject);

    // Create quiz record in database
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: decoded.userId,
        topic_id: topicId || null,
        class_id: classId || null,
        subject: subject,
        topic_name: topicName,
        status: 'pending',
        current_level: 'easy',
        easy_score: 0,
        medium_score: 0,
        hard_score: 0,
        easy_unlocked: true,
        medium_unlocked: false,
        hard_unlocked: false,
        questions: questions,
        answers: [],
        total_marks: effectiveMarks,
        mode: effectiveMode,
        chat_context: chatContext ? { summary: chatContext.substring(0, 1000) } : null,
      })
      .select()
      .single();

    if (quizError) {
      console.error('Error creating quiz:', quizError);
      return NextResponse.json({ error: 'Failed to save quiz' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        topicName: quiz.topic_name,
        subject: quiz.subject,
        status: quiz.status,
        currentLevel: quiz.current_level,
        easyUnlocked: quiz.easy_unlocked,
        mediumUnlocked: quiz.medium_unlocked,
        hardUnlocked: quiz.hard_unlocked,
        questionCount: questions.length,
        totalMarks: effectiveMarks,
        mode: effectiveMode,
      }
    });

  } catch (error) {
    console.error('Quiz generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
