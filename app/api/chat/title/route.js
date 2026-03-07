import { anthropic, CHAT_MODEL } from '@/lib/anthropic';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { userMessage, assistantMessage } = await req.json();

    const response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `Based on this conversation, generate a short 3-5 word title that captures the main topic. Only respond with the title, nothing else.

User: ${userMessage}
Assistant: ${assistantMessage.substring(0, 200)}...`
      }]
    });

    const title = response.content[0].text.trim();

    return NextResponse.json({ title });

  } catch (error) {
    console.error('Title generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    );
  }
}
