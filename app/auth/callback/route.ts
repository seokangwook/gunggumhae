import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // 프로필 없으면 생성 (revely 통합 닉네임)
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', data.user.id)
        .single();

      if (!profile) {
        const baseNick =
          data.user.user_metadata?.full_name?.replace(/\s+/g, '') ??
          data.user.email?.split('@')[0] ??
          '익명';
        const nickname = `${baseNick}${Math.floor(Math.random() * 1000)}`;
        await supabase.from('profiles').insert({
          user_id: data.user.id,
          nickname,
          is_premium: false,
        });
      }
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
