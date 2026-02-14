import { NextResponse } from 'next/server';
import { checkDecay } from '@/lib/masteryEngine';

/**
 * GET /api/cron/mastery-decay
 *
 * Daily cron job: checks for GREEN mastery topics that have decayed
 * (no activity for 21+ days) and downgrades them to AMBER with a refresher mission.
 *
 * Vercel Cron config: "0 6 * * *" (daily at 6am UTC)
 */
export async function GET(req) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await checkDecay();
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Mastery decay cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
