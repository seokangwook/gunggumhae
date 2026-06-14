import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VoteForm from '@/components/VoteForm';
import DemographicsChart from '@/components/DemographicsChart';
import AdSlot from '@/components/AdSlot';
import { timeAgo } from '@/lib/utils';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: poll } = await supabase
    .from('gunggumhae_polls')
    .select('title, description')
    .eq('id', id)
    .single();

  if (!poll) return { title: '궁금해' };

  return {
    title: `${poll.title} | 궁금해`,
    description: poll.description ?? `투표에 참여하세요 — ${poll.title}`,
    openGraph: {
      title: poll.title,
      description: poll.description ?? '익명 투표에 참여하세요',
    },
  };
}

export default async function PollPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: poll } = await supabase
    .from('gunggumhae_polls')
    .select('*')
    .eq('id', id)
    .single();

  if (!poll) notFound();

  // 예약 투표가 scheduled_at 이후면 open 취급
  const effectiveStatus =
    poll.status === 'scheduled' &&
    poll.scheduled_at &&
    new Date(poll.scheduled_at) <= new Date()
      ? 'open'
      : poll.status;

  if (effectiveStatus === 'draft') notFound();

  // 사용자 투표 여부
  let userVoteIndex: number | null = null;
  if (user) {
    const { data: myVote } = await supabase
      .from('gunggumhae_votes')
      .select('selected_option_index')
      .eq('poll_id', id)
      .eq('voter_user', user.id)
      .single();
    userVoteIndex = myVote?.selected_option_index ?? null;
  }

  // 결과 집계 (투표 후 or 종료)
  const showResults = userVoteIndex !== null || effectiveStatus === 'closed';

  const { data: results } = showResults
    ? await supabase
        .from('gunggumhae_votes')
        .select('selected_option_index')
        .eq('poll_id', id)
    : { data: [] };

  // 옵션별 집계
  const optionCounts =
    results?.reduce<Record<number, number>>((acc, v) => {
      acc[v.selected_option_index] = (acc[v.selected_option_index] ?? 0) + 1;
      return acc;
    }, {}) ?? {};

  const voteResults = (poll.options as { label: string }[]).map((_, idx) => ({
    option_index: idx,
    vote_count: optionCounts[idx] ?? 0,
  }));

  // 인구통계
  let demographics = null;
  if (showResults && poll.collect_demographics) {
    const { data: demoVotes } = await supabase
      .from('gunggumhae_votes')
      .select('gender, age_band')
      .eq('poll_id', id);

    if (demoVotes && demoVotes.length > 0) {
      const gender = { male: 0, female: 0, other: 0, skip: 0 };
      const age = { '10s': 0, '20s': 0, '30s': 0, '40s': 0, '50s': 0, '60s+': 0, skip: 0 };
      for (const v of demoVotes) {
        if (v.gender && v.gender in gender) {
          (gender as Record<string, number>)[v.gender]++;
        }
        if (v.age_band && v.age_band in age) {
          (age as Record<string, number>)[v.age_band]++;
        }
      }
      demographics = { gender, age, total: demoVotes.length };
    }
  }

  // allowlist 체크
  let isAllowlisted = false;
  if (user) {
    const { data } = await supabase
      .from('gunggumhae_allowlist')
      .select('user_id')
      .eq('user_id', user.id)
      .single();
    isAllowlisted = !!data;
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gunggumhae.revely.company';
  const shareUrl = `${siteUrl}/q/${id}`;

  return (
    <>
      <Header user={user} isAllowlisted={isAllowlisted} />
      <main className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* 상태 배지 + 시간 */}
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
            <span
              className={`px-2.5 py-0.5 rounded-full font-medium text-xs ${
                effectiveStatus === 'open'
                  ? 'bg-green-100 text-green-700'
                  : effectiveStatus === 'closed'
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              {effectiveStatus === 'open'
                ? '진행중'
                : effectiveStatus === 'closed'
                ? '종료'
                : '예약'}
            </span>
            <span>{timeAgo(poll.created_at)}</span>
            {poll.closes_at && (
              <span>
                · 마감{' '}
                {new Date(poll.closes_at).toLocaleDateString('ko-KR', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>

          {/* 제목 */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {poll.title}
          </h1>
          {poll.description && (
            <p className="text-gray-500 mb-6">{poll.description}</p>
          )}

          {/* 투표 폼 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <VoteForm
              pollId={id}
              options={poll.options as { label: string }[]}
              totalVotes={poll.total_votes}
              status={effectiveStatus}
              userVoteIndex={userVoteIndex}
              results={voteResults}
              collectDemographics={poll.collect_demographics}
              isLoggedIn={!!user}
            />
          </div>

          {/* 광고 (결과 직전 위치) */}
          <AdSlot slotId="9876543210" className="my-4" />

          {/* 인구통계 */}
          {showResults && demographics && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <h3 className="font-semibold text-gray-700 mb-4">인구통계 분석 📊</h3>
              <DemographicsChart data={demographics} />
            </div>
          )}

          {/* SNS 공유 */}
          <div className="bg-violet-50 rounded-2xl border border-violet-100 p-5">
            <p className="text-sm font-medium text-violet-700 mb-3">
              친구에게 공유하면 더 많은 표가 모여요! 🔗
            </p>
            <div className="flex gap-2 flex-wrap">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(poll.title)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                X (Twitter)
              </a>
              <a
                href={`https://www.threads.net/intent/post?text=${encodeURIComponent(`${poll.title}\n${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Threads
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="text-sm border border-violet-200 text-violet-700 px-4 py-2 rounded-lg hover:bg-violet-100 transition-colors"
              >
                링크 복사
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
