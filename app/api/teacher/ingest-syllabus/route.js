import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

function verifyTeacher(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * POST — Upload and parse a syllabus PDF.
 * Returns extracted JSON for preview.
 */
export async function POST(req) {
  try {
    const decoded = verifyTeacher(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse PDF text
    let pdfText;
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(buffer);
      pdfText = pdfData.text;
    } catch (err) {
      console.error('PDF parse error:', err);
      return NextResponse.json({ error: 'Failed to parse PDF. Ensure it is a valid PDF file.' }, { status: 400 });
    }

    if (!pdfText || pdfText.trim().length < 50) {
      return NextResponse.json({ error: 'PDF appears to be empty or image-based. Please upload a text-based syllabus PDF.' }, { status: 400 });
    }

    // Truncate to avoid token limits (first 8000 chars should cover most syllabi)
    const truncatedText = pdfText.substring(0, 8000);

    // Send to GPT for structured extraction
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
            content: `You are a UK exam syllabus parser. Extract structured syllabus data from the provided text. Return ONLY valid JSON with this structure:
{
  "examBoard": "AQA|OCR|Pearson|WJEC|Other",
  "qualification": "GCSE|A-Level|BTEC|etc",
  "topics": [
    {
      "code": "1.1",
      "title": "Topic title",
      "subtopics": ["Subtopic 1", "Subtopic 2"]
    }
  ]
}

Extract ALL topics and subtopics. Use the section numbering from the document. If exam board or qualification cannot be determined, use "Unknown".`,
          },
          {
            role: 'user',
            content: `Parse this syllabus text:\n\n${truncatedText}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 3000,
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
      return NextResponse.json({ error: 'Failed to extract structured data from syllabus' }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Ingest syllabus error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT — Confirm and save extracted syllabus to curriculum_objectives.
 */
export async function PUT(req) {
  try {
    const decoded = verifyTeacher(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { classId, topics } = body;

    if (!classId) {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 });
    }

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json({ error: 'No topics to save' }, { status: 400 });
    }

    // Verify the class exists and belongs to this teacher
    const { data: cls, error: clsError } = await supabaseAdmin
      .from('classes')
      .select('id, qan_code')
      .eq('id', classId)
      .eq('teacher_id', decoded.userId)
      .single();

    if (clsError || !cls) {
      return NextResponse.json({ error: 'Class not found or access denied' }, { status: 404 });
    }

    if (!cls.qan_code) {
      return NextResponse.json({ error: 'This class has no qualification (QAN code) assigned. Please set one first.' }, { status: 400 });
    }

    // Map topics to curriculum_objectives schema: qan_code, objective_text, topic_area
    const objectives = topics.flatMap(topic => {
      const rows = [{
        qan_code: cls.qan_code,
        objective_text: topic.title,
        topic_area: topic.title,
      }];

      if (topic.subtopics?.length > 0) {
        topic.subtopics.forEach(sub => {
          rows.push({
            qan_code: cls.qan_code,
            objective_text: sub,
            topic_area: topic.title,
          });
        });
      }

      return rows;
    });

    const { error: insertError } = await supabaseAdmin
      .from('curriculum_objectives')
      .insert(objectives);

    if (insertError) {
      console.error('Insert objectives error:', insertError);
      return NextResponse.json({ error: 'Failed to save objectives' }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: objectives.length });
  } catch (err) {
    console.error('Save syllabus error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
