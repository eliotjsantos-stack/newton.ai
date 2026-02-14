import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * Beacon endpoint for chat analysis during page unload
 *
 * This endpoint handles navigator.sendBeacon() calls which can't set headers,
 * so the token is passed in the request body instead.
 */

const ANALYSIS_PROMPT = `You are an expert educational analyst. Analyze this tutoring conversation between a student and Newton (an AI tutor).

Your task is to extract:

1. **Main Curriculum Topic**: Identify the primary topic being discussed. Use the format:
   "[Level]: [Subject Area]: [Specific Topic]"
   Examples:
   - "GCSE Maths: Algebra: Solving Linear Equations"
   - "A-Level Pure Math: Calculus: Integration by Parts"

2. **Blind Spots**: Identify 1-5 specific gaps in the student's understanding.

3. **Confidence Score (1-10)**: How confident are you in this analysis?

4. **Mastery Level (1-5)**: Student's apparent mastery of the topic.

5. **Recommended Focus Areas**: 1-3 specific things the student should practice next.

Respond ONLY with valid JSON in this exact format:
{
  "curriculum_topic": "string",
  "subject": "string",
  "level": "string",
  "specific_topic": "string",
  "blind_spots": ["string"],
  "confidence_score": number,
  "mastery_level": number,
  "recommended_focus": ["string"],
  "summary": "One sentence summary"
}`;

export async function POST(req) {
  try {
    const body = await req.json();
    const { messages, chatId, subject, classId, token } = body;

    // Verify token from body (beacon can't set headers)
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!messages || !Array.isArray(messages) || messages.length < 4) {
      return NextResponse.json({ error: 'Insufficient data' }, { status: 400 });
    }

    // Filter and format conversation
    const conversationMessages = messages.filter(
      m => m.role === 'user' || m.role === 'assistant'
    );

    const conversationText = conversationMessages
      .map(m => `${m.role === 'user' ? 'STUDENT' : 'NEWTON'}: ${m.content}`)
      .join('\n\n');

    // Call GPT-4o-mini for efficient analysis
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ANALYSIS_PROMPT },
        { role: 'user', content: `Analyze this conversation:\n\n${conversationText}` }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    let analysis;
    try {
      analysis = JSON.parse(response.choices[0].message.content);
    } catch {
      return NextResponse.json({ error: 'Parse error' }, { status: 500 });
    }

    // Store in student_mastery table
    await supabase
      .from('student_mastery')
      .insert({
        user_id: decoded.userId,
        chat_id: chatId || null,
        class_id: classId || null,
        subject: analysis.subject || subject || 'General',
        level: analysis.level || null,
        curriculum_topic: analysis.curriculum_topic,
        specific_topic: analysis.specific_topic || null,
        blind_spots: analysis.blind_spots || [],
        confidence_score: analysis.confidence_score || 5,
        mastery_level: analysis.mastery_level || 3,
        recommended_focus: analysis.recommended_focus || [],
        summary: analysis.summary || null,
        message_count: conversationMessages.length,
        analyzed_at: new Date().toISOString()
      });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Beacon analysis error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
