import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * Background worker API endpoint
 *
 * Analyzes a completed chat session to extract:
 * 1. Main curriculum topic (e.g., 'A-Level Pure Math: Integration')
 * 2. Specific 'Blind Spots' (e.g., 'Student understands the formula but forgets the +C')
 * 3. A 1-10 confidence score
 *
 * Stores results in the student_mastery table.
 */

const ANALYSIS_PROMPT = `You are an expert educational analyst. Analyze this tutoring conversation between a student and Newton (an AI tutor).

Your task is to extract:

1. **Main Curriculum Topic**: Identify the primary topic being discussed. Use the format:
   "[Level]: [Subject Area]: [Specific Topic]"
   Examples:
   - "GCSE Maths: Algebra: Solving Linear Equations"
   - "A-Level Pure Math: Calculus: Integration by Parts"
   - "Year 9 Science: Physics: Forces and Motion"
   - "A-Level Chemistry: Organic: Nucleophilic Substitution"

2. **Blind Spots**: Identify 1-5 specific gaps in the student's understanding. Be precise and actionable.
   Examples:
   - "Confuses the order of operations when brackets are nested"
   - "Understands the integration formula but consistently forgets to add +C"
   - "Can identify the quadratic formula but struggles with negative discriminants"
   - "Knows Newton's laws but cannot apply them to multi-body problems"

3. **Confidence Score (1-10)**: How confident are you in this analysis?
   - 1-3: Very few messages, unclear topic, hard to assess
   - 4-6: Some evidence but conversation was brief or unfocused
   - 7-8: Clear topic with evident learning patterns
   - 9-10: Extended conversation with clear demonstration of understanding/gaps

4. **Mastery Level (1-5)**: Student's apparent mastery of the topic:
   - 1: No understanding - doesn't grasp basic concepts
   - 2: Emerging - recognizes concepts but can't apply them
   - 3: Developing - can apply with significant guidance
   - 4: Proficient - can apply with minimal help
   - 5: Mastery - teaches back concepts correctly

5. **Recommended Focus Areas**: 1-3 specific things the student should practice next.

Respond ONLY with valid JSON in this exact format:
{
  "curriculum_topic": "string",
  "subject": "string (Maths, Physics, Chemistry, Biology, English, History, etc.)",
  "level": "string (Year 7-9, GCSE, A-Level, etc.)",
  "specific_topic": "string",
  "blind_spots": ["string", "string"],
  "confidence_score": number,
  "mastery_level": number,
  "recommended_focus": ["string", "string"],
  "summary": "One sentence summary of the student's current understanding"
}`;

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

    const { messages, chatId, subject, classId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length < 3) {
      return NextResponse.json({
        error: 'Insufficient conversation data',
        message: 'Need at least 3 messages to analyze'
      }, { status: 400 });
    }

    // Filter to only user and assistant messages
    const conversationMessages = messages.filter(
      m => m.role === 'user' || m.role === 'assistant'
    );

    // Format conversation for analysis
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
    } catch (parseError) {
      console.error('Failed to parse analysis response:', parseError);
      return NextResponse.json({
        error: 'Failed to parse analysis',
        raw: response.choices[0].message.content
      }, { status: 500 });
    }

    // Store in student_mastery table
    const { data: masteryRecord, error: insertError } = await supabase
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
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store mastery record:', insertError);
      // Don't fail the request, just log the error
      return NextResponse.json({
        success: true,
        analysis,
        stored: false,
        error: insertError.message
      });
    }

    // Also update/create topic_discussed if the topic was identified
    if (analysis.specific_topic) {
      const { data: existingTopic } = await supabase
        .from('topics_discussed')
        .select('id, message_count')
        .eq('user_id', decoded.userId)
        .eq('subject', analysis.subject || subject || 'General')
        .eq('topic', analysis.specific_topic)
        .maybeSingle();

      if (existingTopic) {
        // Update existing topic
        await supabase
          .from('topics_discussed')
          .update({
            message_count: existingTopic.message_count + conversationMessages.length,
            last_discussed_at: new Date().toISOString()
          })
          .eq('id', existingTopic.id);
      } else {
        // Create new topic
        await supabase
          .from('topics_discussed')
          .insert({
            user_id: decoded.userId,
            class_id: classId || null,
            subject: analysis.subject || subject || 'General',
            topic: analysis.specific_topic,
            subtopic: null,
            message_count: conversationMessages.length,
            first_discussed_at: new Date().toISOString(),
            last_discussed_at: new Date().toISOString()
          });
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      masteryId: masteryRecord?.id,
      stored: true
    });

  } catch (error) {
    console.error('Chat analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve mastery data for a user
 */
export async function GET(req) {
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

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let query = supabase
      .from('student_mastery')
      .select('*')
      .eq('user_id', decoded.userId)
      .order('analyzed_at', { ascending: false })
      .limit(limit);

    if (subject) {
      query = query.eq('subject', subject);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching mastery data:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Aggregate blind spots across all sessions
    const allBlindSpots = {};
    data.forEach(record => {
      (record.blind_spots || []).forEach(spot => {
        if (!allBlindSpots[spot]) {
          allBlindSpots[spot] = { spot, count: 0, subjects: new Set() };
        }
        allBlindSpots[spot].count++;
        allBlindSpots[spot].subjects.add(record.subject);
      });
    });

    const topBlindSpots = Object.values(allBlindSpots)
      .map(s => ({ ...s, subjects: Array.from(s.subjects) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate average mastery by subject
    const subjectMastery = {};
    data.forEach(record => {
      if (!subjectMastery[record.subject]) {
        subjectMastery[record.subject] = { total: 0, count: 0 };
      }
      subjectMastery[record.subject].total += record.mastery_level || 3;
      subjectMastery[record.subject].count++;
    });

    const masteryBySubject = Object.entries(subjectMastery).map(([subject, stats]) => ({
      subject,
      averageMastery: (stats.total / stats.count).toFixed(1),
      sessionCount: stats.count
    }));

    return NextResponse.json({
      success: true,
      records: data,
      summary: {
        totalSessions: data.length,
        topBlindSpots,
        masteryBySubject
      }
    });

  } catch (error) {
    console.error('Mastery GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
