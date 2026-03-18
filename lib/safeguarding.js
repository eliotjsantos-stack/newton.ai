import { anthropic } from './anthropic';
import { supabaseAdmin } from './supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function formatMessages(messages) {
  return messages
    .slice(-10)
    .map(m => `[${m.role === 'user' ? 'Student' : 'Newton'}]: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
    .join('\n');
}

export async function runSafeguardingScan({
  messages,
  studentId,
  studentName,
  studentEmail,
  chatId,
  subject,
}) {
  if (process.env.SAFEGUARDING_ENABLED !== 'true') return;

  const formatted = formatMessages(messages);

  let scanResult = {
    concerning: false,
    severity: 'none',
    concern_level: 1,
    confidence: 0,
    categories: [],
    reasoning: '',
  };

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `You are a school safeguarding AI working inside an AI tutoring platform used by UK secondary school students aged 11-18.

Assess whether this conversation contains ANY sign of safeguarding concerns. Be highly sensitive to both direct and indirect language.

Assess for: suicidal thoughts or self harm, physical/emotional/sexual abuse, exploitation or grooming, eating disorders, drug or alcohol misuse, severe bullying or isolation, severe depression or hopelessness, domestic violence, county lines, any other serious welfare concern.

These are NOT concerning:
- 'I want to kill this homework'
- 'I'm dead tired'
- Frustration about exams or teachers
- Normal teenage stress

These ARE concerning even if said casually:
- 'I just don't see the point in anything anymore'
- 'Nobody would notice if I wasn't here'
- 'I haven't eaten properly in weeks'
- 'Things at home have been really bad lately'
- 'I've been hurting myself'
- 'Someone has been making me do things'

Concern level guide:
1 = Mild emotional distress, worth monitoring
2 = Moderate concern, repeated negative themes
3 = Clear welfare concern, needs attention soon
4 = Serious concern, needs attention today
5 = Immediate risk to life or safety

When in doubt assign a higher level.
A false positive is better than a missed child.

Return ONLY valid JSON, nothing else:
{
  "concerning": boolean,
  "severity": "none" | "low" | "medium" | "high",
  "concern_level": number 1-5,
  "categories": string[],
  "reasoning": string,
  "confidence": number between 0 and 1
}`,
      messages: [{ role: 'user', content: formatted }],
    });

    const text = response.content[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      scanResult = JSON.parse(jsonMatch[0]);
    }
  } catch {
    return scanResult;
  }

  // Log everything to Supabase
  try {
    await supabaseAdmin.from('safeguarding_flags').insert({
      student_id: studentId,
      student_name: studentName,
      student_email: studentEmail,
      chat_id: chatId,
      subject: subject,
      concern_level: scanResult.concern_level,
      severity: scanResult.severity,
      categories: scanResult.categories,
      reasoning: scanResult.reasoning,
      confidence: scanResult.confidence,
      conversation: messages,
      reviewed: false,
    });
  } catch {
    // Never break chat
  }

  const level = scanResult.concern_level;
  const shouldFlag =
    level >= 4 ||
    level === 3 ||
    (level === 2 && scanResult.confidence >= 0.8);

  if (shouldFlag) {
    flagConversation({
      studentId,
      studentName,
      studentEmail,
      chatId,
      subject,
      scanResult,
      messages,
    }).catch(() => {});
  }

  return scanResult;
}

export async function flagConversation({
  studentId,
  studentName,
  studentEmail,
  chatId,
  subject,
  scanResult,
  messages,
}) {
  try {
    // One email per chat session for level 3+
    const { data: existing } = await supabaseAdmin
      .from('safeguarding_flags')
      .select('id')
      .eq('chat_id', chatId)
      .eq('flagged', true)
      .limit(1)
      .single();

    if (existing) return { success: true };

    // Generate AI summary
    let summary = 'No summary available.';
    try {
      const summaryRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: `You are a safeguarding assistant. Write a brief professional summary for a school safeguarding officer. Include: what was detected, the context, the student's apparent emotional state, any patterns. Maximum 150 words. Be factual and professional.`,
        messages: [{ role: 'user', content: formatMessages(messages) }],
      });
      summary = summaryRes.content[0]?.text || summary;
    } catch {
      // Use default summary
    }

    // Update the existing row with the summary (inserted by runSafeguardingScan)
    await supabaseAdmin
      .from('safeguarding_flags')
      .update({ ai_summary: summary, flagged: true })
      .eq('chat_id', chatId)
      .gte('concern_level', scanResult.concern_level);

    // Send email
    const levelColors = {
      5: '#DC2626',
      4: '#EA580C',
      3: '#D97706',
      2: '#2563EB',
    };
    const headerColor = levelColors[scanResult.concern_level] || '#2563EB';

    const subjects = {
      5: `🚨 URGENT SAFEGUARDING — ${studentName} — ${subject}`,
      4: `🔴 HIGH PRIORITY — ${studentName} — ${subject}`,
      3: `⚠️ Safeguarding Alert — ${studentName} — ${subject}`,
      2: `📋 Low Level Concern — ${studentName} — ${subject}`,
    };
    const emailSubject = subjects[scanResult.concern_level] || subjects[2];

    const conversationHtml = messages
      .map(m => {
        const isUser = m.role === 'user';
        const bg = isUser ? '#f3f4f6' : '#eff6ff';
        const label = isUser ? `${studentName || 'Student'}:` : 'Newton:';
        const text = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        return `<div style="background:${bg};padding:12px;margin-bottom:8px;border-radius:8px;">
          <strong style="font-size:12px;color:#6b7280;">${label}</strong>
          <p style="margin:4px 0 0;font-size:14px;color:#111827;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>`;
      })
      .join('');

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;margin:0;padding:0;background:#f9fafb;">
  <div style="max-width:700px;margin:0 auto;background:#ffffff;">

    <div style="background:${headerColor};padding:20px;">
      <h1 style="color:#ffffff;font-weight:bold;margin:0;font-size:20px;">NEWTON AI SAFEGUARDING ALERT</h1>
    </div>

    <div style="padding:24px;">
      <h2 style="font-size:16px;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">Student Details</h2>
      <table style="width:100%;font-size:14px;color:#374151;">
        <tr><td style="padding:4px 0;font-weight:600;width:160px;">Name:</td><td>${studentName || 'Unknown'}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Email:</td><td>${studentEmail || 'Unknown'}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Subject:</td><td>${subject || 'General'}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Date/Time:</td><td>${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Concern Level:</td><td><strong style="color:${headerColor};">${scanResult.concern_level} / 5</strong></td></tr>
      </table>

      <h2 style="font-size:16px;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-top:24px;">AI Assessment</h2>
      <table style="width:100%;font-size:14px;color:#374151;">
        <tr><td style="padding:4px 0;font-weight:600;width:160px;">Severity:</td><td>${scanResult.severity}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Categories:</td><td>${(scanResult.categories || []).join(', ') || 'None specified'}</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;">Confidence:</td><td>${Math.round((scanResult.confidence || 0) * 100)}%</td></tr>
        <tr><td style="padding:4px 0;font-weight:600;vertical-align:top;">Reasoning:</td><td>${scanResult.reasoning || ''}</td></tr>
      </table>

      <h2 style="font-size:16px;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-top:24px;">Summary</h2>
      <p style="font-size:14px;color:#374151;line-height:1.6;">${summary}</p>

      <h2 style="font-size:16px;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-top:24px;">Full Conversation</h2>
      ${conversationHtml}
    </div>

    <div style="background:#111827;padding:20px;text-align:center;">
      <p style="color:#ffffff;font-size:12px;margin:0;">
        This alert was generated automatically by Newton AI.<br>
        Review at trynewtonai.com/admin/safeguarding<br>
        Newton AI Ltd · Company No. 17070215
      </p>
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({
      from: 'alerts@trynewtonai.com',
      to: process.env.SAFEGUARDING_EMAIL,
      subject: emailSubject,
      html,
    });

    return { success: true };
  } catch (err) {
    console.error('[Safeguarding] flagConversation error:', err);
    return { success: false };
  }
}
