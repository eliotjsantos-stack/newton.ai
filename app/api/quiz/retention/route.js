import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * POST /api/quiz/retention
 *
 * Generates a shorter 5-question retention quiz for a specific mastery topic.
 * Used for spaced repetition checks (48h after achieving 100%).
 */
export async function POST(req) {
  try {
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

    const { masteryId } = await req.json();

    if (!masteryId) {
      return NextResponse.json({ error: 'masteryId is required' }, { status: 400 });
    }

    // Fetch mastery record
    const { data: mastery, error: masteryError } = await supabaseAdmin
      .from('student_mastery')
      .select('*')
      .eq('id', masteryId)
      .eq('user_id', decoded.userId)
      .single();

    if (masteryError || !mastery) {
      return NextResponse.json({ error: 'Mastery record not found' }, { status: 404 });
    }

    // Fetch user year group
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('year_group')
      .eq('id', decoded.userId)
      .single();

    const yearGroup = userData?.year_group || 'Year 10';

    // Generate 5 retention check questions
    const prompt = `Generate a retention check quiz about "${mastery.curriculum_topic}" for a ${yearGroup} student studying ${mastery.subject}.

Create exactly 5 questions that test whether the student still remembers key concepts.
Mix question types: 3 multiple_choice, 1 short_answer, 1 true_false.

Focus on the most important concepts - this is a quick retention check, not a full quiz.

IMPORTANT - Math formatting:
- Use LaTeX notation with $ signs for ALL math: $x^2$, $\\frac{1}{2}$
- For inline math use single $: "Solve $x^2 + 5x + 6 = 0$"

For each question provide this exact JSON structure:
{
  "question_text": "The question",
  "question_type": "multiple_choice" | "true_false" | "short_answer",
  "level": "medium",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."] (only for multiple_choice),
  "correct_answer": "The correct answer",
  "explanation": "Brief explanation"
}

Return ONLY a valid JSON array of 5 question objects.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an educational quiz generator for retention checks. Return only valid JSON arrays.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    let questions;
    try {
      const responseText = completion.choices[0].message.content.trim();
      const cleaned = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      questions = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'Failed to generate retention quiz' }, { status: 500 });
    }

    // Create the retention quiz
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        user_id: decoded.userId,
        subject: mastery.subject,
        topic_name: `Retention: ${mastery.curriculum_topic}`,
        status: 'pending',
        current_level: 'medium',
        easy_score: 0,
        medium_score: 0,
        hard_score: 0,
        easy_unlocked: true,
        medium_unlocked: true,
        hard_unlocked: false,
        questions,
        answers: [],
      })
      .select()
      .single();

    if (quizError) {
      console.error('Error creating retention quiz:', quizError);
      return NextResponse.json({ error: 'Failed to save retention quiz' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        topicName: `Retention: ${mastery.curriculum_topic}`,
        subject: mastery.subject,
        questionCount: questions.length,
        masteryId: mastery.id,
      }
    });
  } catch (err) {
    console.error('Retention quiz error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
