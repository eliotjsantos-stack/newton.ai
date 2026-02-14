import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/teacher/student-summary
 *
 * Generates a brief AI summary of a student's performance on a topic.
 */
export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    try {
      jwt.verify(authHeader.substring(7), JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { studentName, topic, quizResults } = await req.json();

    if (!studentName || !topic || !Array.isArray(quizResults) || quizResults.length === 0) {
      return NextResponse.json({ error: 'studentName, topic, and quizResults are required' }, { status: 400 });
    }

    const quizSummary = quizResults.map(q =>
      `${q.date}: ${q.score}/${q.totalMarks} (${Math.round((q.score / q.totalMarks) * 100)}%) — ${q.mode || 'quiz'}`
    ).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a teacher assistant. Provide brief, actionable student performance summaries. Be specific and professional. Always respond in 2-3 sentences only.',
        },
        {
          role: 'user',
          content: `Summarize ${studentName}'s performance on "${topic}". Note trends, strengths, and weaknesses.\n\nQuiz results (newest first):\n${quizSummary}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 200,
    });

    const summary = completion.choices[0].message.content.trim();

    return NextResponse.json({ summary });
  } catch (err) {
    console.error('Student summary error:', err);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
