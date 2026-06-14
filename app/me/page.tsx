import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PollCard from '@/components/PollCard';
import MeClient from './MeClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '내 활동 | 궁금해',
};

export default async function MePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: allowlistRow } = await supabase
    .from('gunggumhae_allowlist')
    .select('user_id, auto_approved')
    .eq('user_id', user.id)
    .single();
  const isAllowlisted = !!allowlistRow;

  // 내가 만든 질문
  const { data: myPolls } = await supabase
    .from('gunggumhae_polls')
    .select('id, title, options, total_votes, status, created_at, closes_at')
    .eq('creator_user', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  // 내가 참여한 투표 ID 목록
  const { data: myVotes } = await supabase
    .from('gunggumhae_votes')
    .select('poll_id, selected_option_index, voted_at')
    .eq('voter_user', user.id)
    .order('voted_at', { ascending: false })
    .limit(20);

  const votedPollIds = myVotes?.map((v) => v.poll_id) ?? [];

  let votedPolls: typeof myPolls = [];
  if (votedPollIds.length > 0) {
    const { data } = await supabase
      .from('gunggumhae_polls')
      .select('id, title, options, total_votes, status, created_at, closes_at')
      .in('id', votedPollIds);
    votedPolls = data ?? [];
  }

  // 응원 내역
  const { data: supportHistory } = await supabase
    .from('gunggumhae_supporters')
    .select('*')
    .eq('user_id', user.id)
    .order('paid_at', { ascending: false });

  const activeSupport = supportHistory?.find(
    (s) => s.expires_at && new Date(s.expires_at) > new Date()
  );

  const profile = user.user_metadata;

  return (
    <>
      <Header user={user} isAllowlisted={isAllowlisted} />
      <main className="min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* 프로필 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="프로필"
                  className="w-14 h-14 rounded-full"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center text-2xl">
                  👤
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900">
                  {profile?.full_name ?? user.email?.split('@')[0] ?? '사용자'}
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
                {isAllowlisted && (
                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                    Creator {allowlistRow.auto_approved ? '(자동승인)' : '(수동승인)'}
                  </span>
                )}
              </div>
            </div>

            {activeSupport && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-sm font-medium text-amber-700">
                  💛 응원 감사합니다! ({activeSupport.tier})
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  광고 제거 유효:{' '}
                  {new Date(activeSupport.ads_disabled_until).toLocaleDateString('ko-KR')}
                  까지
                </p>
              </div>
            )}
          </div>

          {/* 응원하기 버튼 */}
          <MeClient hasActiveSupport={!!activeSupport} />

          {/* 내가 만든 질문 */}
          {myPolls && myPolls.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                내가 만든 질문 ({myPolls.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myPolls.map((poll) => (
                  <PollCard key={poll.id} poll={poll} />
                ))}
              </div>
            </section>
          )}

          {/* 내가 참여한 투표 */}
          {votedPolls && votedPolls.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                내가 참여한 투표 ({votedPolls.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {votedPolls.map((poll) => (
                  <PollCard key={poll.id} poll={poll} />
                ))}
              </div>
            </section>
          )}

          {(!myPolls || myPolls.length === 0) && (!votedPolls || votedPolls.length === 0) && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-4">🗳️</p>
              <p className="text-lg font-medium">아직 활동이 없어요</p>
              <a
                href="/history"
                className="mt-4 inline-block text-violet-600 font-medium hover:underline"
              >
                투표 참여하러 가기 →
              </a>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
