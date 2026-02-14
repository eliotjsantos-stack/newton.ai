/**
 * Email templates for parental notifications.
 * All templates return { subject, html }.
 */

const HEADER = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
    <div style="background: #000000; padding: 24px 32px;">
      <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 600;">Newton AI</h1>
    </div>
    <div style="padding: 32px;">
`;

const FOOTER = `
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0 16px;" />
      <p style="color: #999; font-size: 12px; line-height: 1.5;">
        This email was sent by Newton AI on behalf of your child&rsquo;s school.
        If you believe you received this in error, please contact the school directly.
      </p>
    </div>
  </div>
`;

function statusBadge(status) {
  const colors = {
    red: { bg: '#FEE2E2', text: '#DC2626', label: 'Struggling' },
    amber: { bg: '#FEF3C7', text: '#D97706', label: 'Learning' },
    green: { bg: '#D1FAE5', text: '#059669', label: 'Mastered' },
  };
  const c = colors[status] || colors.amber;
  return `<span style="display: inline-block; padding: 2px 10px; border-radius: 12px; background: ${c.bg}; color: ${c.text}; font-size: 12px; font-weight: 600;">${c.label}</span>`;
}

/**
 * Weekly progress digest email.
 */
export function progressDigestTemplate({ studentName, parentName, subjects }) {
  const subjectRows = subjects.map(s => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333;">${s.name}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: center;">${statusBadge(s.status)}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: center; font-size: 14px; color: #666;">${s.topicsCompleted || 0}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: center; font-size: 14px; color: #666;">${s.quizzesTaken || 0}</td>
    </tr>
  `).join('');

  return {
    subject: `Newton AI — Weekly Progress Report for ${studentName}`,
    html: `
      ${HEADER}
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Dear ${parentName || 'Parent/Guardian'},
      </p>
      <p style="color: #555; font-size: 14px; line-height: 1.6;">
        Here is ${studentName}&rsquo;s weekly learning progress on Newton AI:
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 10px 16px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Subject</th>
            <th style="padding: 10px 16px; text-align: center; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Status</th>
            <th style="padding: 10px 16px; text-align: center; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Topics</th>
            <th style="padding: 10px 16px; text-align: center; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Quizzes</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRows}
        </tbody>
      </table>
      <p style="color: #555; font-size: 14px; line-height: 1.6;">
        Keep encouraging ${studentName} to stay consistent with their learning!
      </p>
      ${FOOTER}
    `,
  };
}

/**
 * Milestone certificate email — sent when a student achieves a learning milestone.
 */
export function milestoneCertificateTemplate({ studentName, parentName, milestone, subject, date }) {
  return {
    subject: `Newton AI — Certificate of Achievement for ${studentName}`,
    html: `
      ${HEADER}
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Dear ${parentName || 'Parent/Guardian'},
      </p>
      <p style="color: #555; font-size: 14px; line-height: 1.6;">
        We are delighted to inform you that ${studentName} has achieved a learning milestone on Newton AI!
      </p>
      <div style="border: 3px solid #D4AF37; border-radius: 16px; padding: 32px; margin: 24px 0; text-align: center; background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FFFBEB 100%);">
        <div style="font-size: 40px; margin-bottom: 8px;">🏆</div>
        <p style="color: #92400E; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">Certificate of Achievement</p>
        <p style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin: 0 0 8px;">${studentName}</p>
        <div style="width: 60px; height: 2px; background: #D4AF37; margin: 12px auto;"></div>
        <p style="color: #78350F; font-size: 15px; font-weight: 600; margin: 12px 0 4px;">${milestone}</p>
        <p style="color: #92400E; font-size: 13px; margin: 0;">${subject}</p>
        <p style="color: #A16207; font-size: 11px; margin: 16px 0 0;">${date}</p>
      </div>
      <p style="color: #555; font-size: 14px; line-height: 1.6;">
        This is a fantastic achievement and we encourage ${studentName} to keep up the excellent work!
      </p>
      ${FOOTER}
    `,
  };
}

/**
 * Low mastery alert — sent when a core subject drops below threshold.
 */
export function lowMasteryAlertTemplate({ studentName, parentName, subject, masteryPercent }) {
  return {
    subject: `Newton AI — ${studentName} needs support in ${subject}`,
    html: `
      ${HEADER}
      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Dear ${parentName || 'Parent/Guardian'},
      </p>
      <div style="background: #FEF3C7; border-left: 4px solid #D97706; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <p style="color: #92400E; font-size: 14px; margin: 0; font-weight: 600;">
          Attention needed
        </p>
        <p style="color: #92400E; font-size: 14px; margin: 8px 0 0;">
          ${studentName}&rsquo;s mastery in <strong>${subject}</strong> is currently at <strong>${masteryPercent}%</strong>, which is below the recommended threshold.
        </p>
      </div>
      <p style="color: #555; font-size: 14px; line-height: 1.6;">
        We recommend encouraging ${studentName} to:
      </p>
      <ul style="color: #555; font-size: 14px; line-height: 1.8; padding-left: 20px;">
        <li>Complete any pending refresher missions on Newton</li>
        <li>Spend 15&ndash;20 minutes reviewing the topic material</li>
        <li>Attempt the next quiz when they feel ready</li>
      </ul>
      <p style="color: #555; font-size: 14px; line-height: 1.6;">
        If you have concerns, please speak with ${studentName}&rsquo;s teacher.
      </p>
      ${FOOTER}
    `,
  };
}
