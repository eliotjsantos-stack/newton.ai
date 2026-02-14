import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Verify admin
    const { data: requestingUser, error: userError } = await supabase
      .from('users')
      .select('is_admin, account_type')
      .eq('id', decoded.userId)
      .single();

    if (userError || (!requestingUser?.is_admin && requestingUser?.account_type !== 'teacher')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all users for analytics
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, year_group, chat_data, created_at, last_login, is_admin, account_type');

    if (usersError) {
      console.error('Failed to fetch users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalUsers = users.filter(u => !u.is_admin && u.account_type !== 'teacher').length;
    const totalAdmins = users.filter(u => u.is_admin).length;
    
    // Active users (logged in within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = users.filter(u => 
      !u.is_admin && u.account_type !== 'teacher' && u.last_login && new Date(u.last_login) > sevenDaysAgo
    ).length;

    // Calculate total chats and messages
    let totalChats = 0;
    let totalMessages = 0;
    const subjectUsage = {};
    const yearGroupDistribution = {};

    users.filter(u => !u.is_admin && u.account_type !== 'teacher').forEach(user => {
      if (user.chat_data?.chatsBySubject) {
        Object.entries(user.chat_data.chatsBySubject).forEach(([subject, chats]) => {
          totalChats += chats.length;
          subjectUsage[subject] = (subjectUsage[subject] || 0) + chats.length;
          
          chats.forEach(chat => {
            totalMessages += chat.messages?.length || 0;
          });
        });
      }

      if (user.year_group) {
        yearGroupDistribution[user.year_group] = (yearGroupDistribution[user.year_group] || 0) + 1;
      }
    });

    // Get reports count
    const { count: reportsCount } = await supabase
      .from('issue_reports')
      .select('*', { count: 'exact', head: true });

    // Calculate user growth (users created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = users.filter(u => 
      !u.is_admin && u.account_type !== 'teacher' && new Date(u.created_at) > thirtyDaysAgo
    ).length;

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        totalChats,
        totalMessages,
        totalReports: reportsCount || 0,
        totalAdmins,
        newUsersLast30Days: newUsers
      },
      subjectUsage,
      yearGroupDistribution,
      users: users.filter(u => !u.is_admin && u.account_type !== 'teacher').map(u => ({
        email: u.email,
        yearGroup: u.year_group,
        createdAt: u.created_at,
        lastLogin: u.last_login,
        chatCount: u.chat_data?.chatsBySubject 
          ? Object.values(u.chat_data.chatsBySubject).reduce((acc, chats) => acc + chats.length, 0)
          : 0
      }))
    });

  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}