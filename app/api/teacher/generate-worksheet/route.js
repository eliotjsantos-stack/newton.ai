import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { anthropic, CHAT_MODEL } from '@/lib/anthropic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    try {
      jwt.verify(authHeader.substring(7), JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { topic, subject, difficulty, studentContext } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    const diffLabel = difficulty === 'easy' ? 'foundation' : difficulty === 'hard' ? 'higher' : 'intermediate';

    const response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 2000,
      system: `You are a UK secondary school worksheet generator. Generate a revision worksheet for the topic "${topic}" in ${subject || 'the given subject'} at ${diffLabel} difficulty level. ${studentContext ? `Common student errors: ${studentContext}` : ''}

Return ONLY valid JSON with this structure:
{
  "title": "Worksheet title",
  "questions": [
    {
      "number": 1,
      "question": "Full question text",
      "marks": 2,
      "hint": "A helpful hint",
      "answerKey": "The expected answer"
    }
  ]
}

Generate exactly 10 questions. Include a mix of recall, application, and analysis questions. Mark allocations should total approximately 30-40 marks. Use UK curriculum terminology and standards.`,
      messages: [{ role: 'user', content: `Generate the ${diffLabel} revision worksheet for "${topic}" now.` }],
    });

    const content = response.content[0].text.trim();

    let parsed;
    try {
      const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ error: 'Failed to parse worksheet' }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Generate worksheet error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
