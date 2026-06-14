import { createSupabaseServerClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PollCard from '@/components/PollCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '전체 투표 | 궁금해',
  description: '궁금해의 모든 투표 목록. 지금 진행중인 투표와 지난 투표 결과를 확인하세요.',
};

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

export default async function HistoryPage({ searchParams }: PageProps) {
  const { q, status = 'all', page = '1' } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pageNum = Math.max(1, parseInt(page, 10));
  const PAGE_SIZE = 18;
  const offset = (pageNum - 1) * PAGE_SIZE;

  let query = supabase
    .from('gunggumhae_polls')
    .select('id, title, options, total_votes, status, created_at, closes_at', {
      count: 'exact',
    })
    .not('status', 'eq', 'draft')
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (status === 'open') query = query.eq('status', 'open');
  else if (status === 'closed') query = query.eq('status', 'closed');

  if (q) {
    query = query.ilike('title', `%${q}%`);
  }

  const { data: polls, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

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
      <main className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <h1 className="text-2xl font-bold text-gray-900">전체 투표 🗳️</h1>
            <form className="flex gap-2 w-full sm:w-auto">
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="투표 검색..."
                className="flex-1 sm:w-64 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
              />
              <button
                type="submit"
                className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
              >
                검색
              </button>
            </form>
          </div>

          {/* 필터 */}
          <div className="flex gap-2 mb-6">
            {[
              { value: 'all', label: '전체' },
              { value: 'open', label: '진행중' },
              { value: 'closed', label: '종료' },
            ].map((f) => (
              <a
                key={f.value}
                href={`/history?status=${f.value}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  status === f.value
                    ? 'bg-violet-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300'
                }`}
              >
                {f.label}
              </a>
            ))}
          </div>

          {/* 결과 */}
          {polls && polls.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {polls.map((poll) => (
                  <PollCard key={poll.id} poll={poll} />
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <a
                      key={p}
                      href={`/history?page=${p}${status !== 'all' ? `&status=${status}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                      className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                        p === pageNum
                          ? 'bg-violet-600 text-white'
                          : 'border border-gray-200 text-gray-600 hover:border-violet-300'
                      }`}
                    >
                      {p}
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-medium">
                {q ? `"${q}" 검색 결과가 없어요` : '투표가 없어요'}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
