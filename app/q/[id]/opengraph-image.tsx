import { ImageResponse } from 'next/og';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const alt = '궁금해 투표';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: poll } = await supabase
      .from('gunggumhae_polls')
      .select('title, total_votes, options, status')
      .eq('id', params.id)
      .single();

    const title = poll?.title ?? '궁금해?';
    const votes = poll?.total_votes ?? 0;
    const optionCount = Array.isArray(poll?.options) ? poll!.options.length : 0;

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              fontSize: '28px',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            🤔 궁금해
          </div>
          <div
            style={{
              fontSize: title.length > 40 ? '42px' : '52px',
              fontWeight: 700,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.3,
              marginBottom: '32px',
              maxWidth: '900px',
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: 'flex',
              gap: '24px',
              fontSize: '24px',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <span>선택지 {optionCount}개</span>
            <span>·</span>
            <span>{votes.toLocaleString()}명 참여</span>
          </div>
        </div>
      ),
      { ...size }
    );
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '60px',
            fontWeight: 700,
            color: 'white',
            fontFamily: 'sans-serif',
          }}
        >
          🤔 궁금해
        </div>
      ),
      { ...size }
    );
  }
}
