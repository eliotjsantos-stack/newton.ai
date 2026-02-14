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

    const { subject, topic } = await req.json();

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
            content: `Generate a single multiple-choice recall question for a UK secondary school student studying ${subject || 'general knowledge'}${topic ? `, specifically about "${topic}"` : ''}. The question must be answerable in under 15 seconds from memory — no calculations required. Return ONLY valid JSON with this exact structure: {"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctIndex": 0}. The correctIndex is 0-based. Make it factual recall, not opinion.`,
          },
          {
            role: 'user',
            content: 'Generate the quick-recall question now.',
          },
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();

    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // Fallback question if parsing fails
      parsed = {
        question: 'What is the capital of the United Kingdom?',
        options: ['A) Edinburgh', 'B) London', 'C) Cardiff', 'D) Belfast'],
        correctIndex: 1,
      };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Flash Fire error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
