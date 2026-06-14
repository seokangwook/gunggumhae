import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const TIER_AMOUNTS: Record<string, number> = {
  bronze: 3000,
  silver: 5000,
  gold: 10000,
};

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await req.json();
  const { tier } = body;

  if (!tier || !(tier in TIER_AMOUNTS)) {
    return NextResponse.json({ error: '잘못된 티어입니다.' }, { status: 400 });
  }

  const tossClientKey = process.env.TOSS_CLIENT_KEY;
  const tossSecretKey = process.env.TOSS_SECRET_KEY;

  // Toss Payments 미설정 시 안내
  if (!tossClientKey || !tossSecretKey) {
    return NextResponse.json(
      { error: 'Toss Payments 설정 준비 중입니다. 잠시 후 다시 시도해주세요.' },
      { status: 503 }
    );
  }

  const amount = TIER_AMOUNTS[tier];
  const orderId = `gunggumhae-${user.id.substring(0, 8)}-${Date.now()}`;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gunggumhae.revely.company';

  // Toss Payments 결제 요청
  const tossRes = await fetch('https://api.tosspayments.com/v1/payments', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${tossSecretKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: '카드',
      amount,
      orderId,
      orderName: `궁금해 응원 (${tier})`,
      successUrl: `${siteUrl}/api/support/success?tier=${tier}&orderId=${orderId}`,
      failUrl: `${siteUrl}/me?payment=failed`,
      customerEmail: user.email,
    }),
  });

  if (!tossRes.ok) {
    return NextResponse.json({ error: '결제 초기화 실패' }, { status: 500 });
  }

  const tossData = await tossRes.json();
  return NextResponse.json({ checkoutUrl: tossData.checkout?.url ?? null });
}
