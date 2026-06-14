import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const supabase = await createSupabaseServerClient();

  const status = searchParams.get('status') ?? 'open';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);

  let query = supabase
    .from('gunggumhae_polls')
    .select('id, title, options, total_votes, status, created_at, closes_at')
    .order('total_votes', { ascending: false })
    .limit(limit);

  if (status !== 'all') {
    query = query.eq('status', status);
  } else {
    query = query.not('status', 'eq', 'draft');
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ polls: data });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // allowlist 체크
  const { data: allowlist } = await supabase
    .from('gunggumhae_allowlist')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  if (!allowlist) {
    return NextResponse.json({ error: 'Creator 승인이 필요합니다.' }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, options, collect_demographics, closes_at, scheduled_at, status } = body;

  if (!title || !options || options.length < 2) {
    return NextResponse.json({ error: '필수 항목이 부족합니다.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('gunggumhae_polls')
    .insert({
      creator_user: user.id,
      title,
      description: description ?? null,
      options,
      collect_demographics: collect_demographics ?? true,
      closes_at: closes_at ?? null,
      scheduled_at: scheduled_at ?? null,
      status: status ?? 'open',
      total_votes: 0,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id }, { status: 201 });
}
