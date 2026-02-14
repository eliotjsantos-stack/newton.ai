import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a UK secondary school worksheet generator. Generate a revision worksheet for the topic "${topic}" in ${subject || 'the given subject'} at ${diffLabel} difficulty level. ${studentContext ? `Common student errors: ${studentContext}` : ''}

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
          },
          {
            role: 'user',
            content: `Generate the ${diffLabel} revision worksheet for "${topic}" now.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();

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
