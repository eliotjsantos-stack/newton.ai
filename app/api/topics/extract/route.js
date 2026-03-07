import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { anthropic, CHAT_MODEL } from '@/lib/anthropic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

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

    const { messages, subject } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Take the last 10 messages for context (or all if fewer)
    const recentMessages = messages.slice(-10);
    const conversationText = recentMessages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 200,
      system: `You are a topic extraction assistant for an educational platform.
Analyze the conversation and extract the main educational topic being discussed.

Return a JSON object with:
- topic: The main topic (e.g., "Quadratic Equations", "Photosynthesis", "World War 2")
- subtopic: A more specific subtopic if applicable (e.g., "Factoring", "Light Reactions", "D-Day")
- confidence: A number from 0 to 1 indicating how confident you are
- subject_detected: The academic subject (e.g., "Maths", "Biology", "History")

Rules:
- Keep topic names concise but descriptive (2-5 words)
- Use proper capitalization
- If the conversation is general chat or unclear, return topic as "General Discussion"
- Focus on the educational concept, not the specific homework problem

Respond ONLY with valid JSON, no other text.`,
      messages: [{
        role: 'user',
        content: `Subject context: ${subject || 'General'}\n\nConversation:\n${conversationText}`
      }],
    });

    const responseText = response.content[0].text.trim();

    let extractedData;
    try {
      extractedData = JSON.parse(responseText);
    } catch {
      extractedData = {
        topic: 'General Discussion',
        subtopic: null,
        confidence: 0.5,
        subject_detected: subject || 'General'
      };
    }

    return NextResponse.json({
      success: true,
      topic: extractedData.topic || 'General Discussion',
      subtopic: extractedData.subtopic || null,
      confidence: extractedData.confidence || 0.5,
      subject_detected: extractedData.subject_detected || subject || 'General',
      userId: decoded.userId
    });

  } catch (error) {
    console.error('Topic extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract topic' },
      { status: 500 }
    );
  }
}
