import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

function getAdmin(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }

  let isAdmin = decoded.isAdmin || decoded.is_admin || false;

  if (!isAdmin && decoded.userId) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', decoded.userId)
      .single();
    isAdmin = user?.is_admin || false;
  }

  if (!isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter') || 'unreviewed';
  const minLevel = parseInt(searchParams.get('minLevel') || '1', 10);

  let query = supabaseAdmin
    .from('safeguarding_flags')
    .select('*')
    .gte('concern_level', minLevel)
    .order('concern_level', { ascending: false })
    .order('flagged_at', { ascending: false });

  if (filter === 'unreviewed') query = query.eq('reviewed', false);
  if (filter === 'flagged') query = query.eq('flagged', true);

  const { data } = await query;
  return Response.json({ flags: data || [] });
}

export async function PATCH(req) {
  if (!getAdmin(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, ...fields } = await req.json();
  await supabaseAdmin.from('safeguarding_flags').update(fields).eq('id', id);
  return Response.json({ success: true });
}
