import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Params) {
  const { id: pollId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // 투표 상태 확인
  const { data: poll } = await supabase
    .from('gunggumhae_polls')
    .select('status, scheduled_at, options, collect_demographics')
    .eq('id', pollId)
    .single();

  if (!poll) {
    return NextResponse.json({ error: '투표를 찾을 수 없습니다.' }, { status: 404 });
  }

  const effectiveStatus =
    poll.status === 'scheduled' &&
    poll.scheduled_at &&
    new Date(poll.scheduled_at) <= new Date()
      ? 'open'
      : poll.status;

  if (effectiveStatus !== 'open') {
    return NextResponse.json({ error: '참여할 수 없는 투표입니다.' }, { status: 400 });
  }

  const body = await req.json();
  const { selectedOptionIndex, gender, ageBand } = body;

  const options = poll.options as { label: string }[];
  if (
    typeof selectedOptionIndex !== 'number' ||
    selectedOptionIndex < 0 ||
    selectedOptionIndex >= options.length
  ) {
    return NextResponse.json({ error: '잘못된 선택입니다.' }, { status: 400 });
  }

  // 중복 투표 체크 + 삽입 (unique 제약으로 처리)
  const { error: insertError } = await supabase.from('gunggumhae_votes').insert({
    poll_id: pollId,
    voter_user: user.id,
    selected_option_index: selectedOptionIndex,
    gender: poll.collect_demographics ? (gender ?? 'skip') : null,
    age_band: poll.collect_demographics ? (ageBand ?? 'skip') : null,
  });

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: '이미 투표하셨습니다.' }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // total_votes 증가
  await supabase.rpc('increment_poll_votes', { poll_id: pollId });

  return NextResponse.json({ ok: true });
}
