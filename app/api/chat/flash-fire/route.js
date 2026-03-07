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

    const { subject, topic } = await req.json();

    const response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 300,
      system: `Generate a single multiple-choice recall question for a UK secondary school student studying ${subject || 'general knowledge'}${topic ? `, specifically about "${topic}"` : ''}. The question must be answerable in under 15 seconds from memory — no calculations required. Return ONLY valid JSON with this exact structure: {"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctIndex": 0}. The correctIndex is 0-based. Make it factual recall, not opinion.`,
      messages: [{ role: 'user', content: 'Generate the quick-recall question now.' }],
    });

    const content = response.content[0].text.trim();

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
