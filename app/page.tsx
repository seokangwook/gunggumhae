import { createSupabaseServerClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PollCard from '@/components/PollCard';
import Link from 'next/link';

export const revalidate = 60;

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: polls } = await supabase
    .from('gunggumhae_polls')
    .select('id, title, options, total_votes, status, created_at, closes_at')
    .eq('status', 'open')
    .order('total_votes', { ascending: false })
    .limit(12);

  let isAllowlisted = false;
  if (user) {
    const { data } = await supabase
      .from('gunggumhae_allowlist')
      .select('user_id')
      .eq('user_id', user.id)
      .single();
    isAllowlisted = !!data;
  }

  return (
    <>
      <Header user={user} isAllowlisted={isAllowlisted} />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl font-bold mb-4">궁금해? 🤔</h1>
            <p className="text-xl text-violet-100 mb-8 leading-relaxed">
              궁금한 걸 투표로 물어보세요.
              <br />
              익명으로 참여하고, 인구통계까지 한눈에.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {isAllowlisted ? (
                <Link
                  href="/new"
                  className="bg-white text-violet-700 font-semibold px-8 py-3 rounded-full hover:bg-violet-50 transition-colors shadow-lg"
                >
                  질문 만들기 ✏️
                </Link>
              ) : null}
              <Link
                href="/history"
                className="border-2 border-white/70 text-white font-semibold px-8 py-3 rounded-full hover:bg-white/10 transition-colors"
              >
                모든 투표 보기
              </Link>
            </div>
          </div>
        </section>

        {/* 통계 배너 */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center gap-8 text-sm text-gray-500">
            <span>✅ 익명 참여</span>
            <span>📊 인구통계 공개</span>
            <span>🔗 SNS 공유</span>
          </div>
        </section>

        {/* 인기 투표 */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">인기 투표 🔥</h2>
            <Link href="/history" className="text-violet-600 hover:text-violet-700 font-medium text-sm">
              전체 보기 →
            </Link>
          </div>

          {polls && polls.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {polls.map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🗳️</p>
              <p className="text-lg font-medium">아직 투표가 없어요</p>
              <p className="text-sm mt-1">첫 번째 질문을 만들어보세요!</p>
            </div>
          )}
        </section>

        {/* CTA 배너 */}
        {!user && (
          <section className="bg-violet-50 border-y border-violet-100 py-12 px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-xl font-bold text-violet-800 mb-2">
                참여하면 인구통계 결과를 볼 수 있어요 📊
              </h3>
              <p className="text-violet-600 text-sm mb-6">
                로그인 후 투표에 참여하면 성별·나이대별 분석 결과를 확인할 수 있습니다.
              </p>
              <Link
                href="/auth/login"
                className="bg-violet-600 text-white font-semibold px-8 py-3 rounded-full hover:bg-violet-700 transition-colors"
              >
                Google로 시작하기
              </Link>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
