import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, subjects, chatsBySubject, currentSubject, currentChatId, preserveChats } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Get existing data if we're preserving chats
    let existingData = null;
    if (preserveChats) {
      const { data } = await supabase
        .from('user_chats')
        .select('*')
        .eq('user_email', email)
        .single();
      
      existingData = data;
    }

    const dataToSave = {
      user_email: email,
      subjects: subjects,
      chats_by_subject: preserveChats && existingData ? existingData.chats_by_subject : (chatsBySubject || {}),
      current_subject: preserveChats && existingData ? existingData.current_subject : currentSubject,
      current_chat_id: preserveChats && existingData ? existingData.current_chat_id : currentChatId,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_chats')
      .upsert(dataToSave, { onConflict: 'user_email' });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save chat error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
