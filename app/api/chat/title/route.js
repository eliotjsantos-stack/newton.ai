import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { userMessage, assistantMessage } = await req.json();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `Based on this conversation, generate a short 3-5 word title that captures the main topic. Only respond with the title, nothing else.

User: ${userMessage}
Assistant: ${assistantMessage.substring(0, 200)}...`
      }]
    });

    const title = completion.choices[0].message.content.trim();
    
    return NextResponse.json({ title });

  } catch (error) {
    console.error('Title generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    );
  }
}