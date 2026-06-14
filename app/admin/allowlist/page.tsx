import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AllowlistClient from './AllowlistClient';
import { isAdminEmail } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Creator Allowlist 관리 | 궁금해 Admin',
};

export default async function AllowlistPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    redirect('/');
  }

  const { data: allowlist } = await supabase
    .from('gunggumhae_allowlist')
    .select('user_id, added_at, auto_approved, notes')
    .order('added_at', { ascending: false });

  // 각 user_id에 대해 프로필+이메일 조회
  const userIds = allowlist?.map((r) => r.user_id) ?? [];
  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from('profiles')
        .select('user_id, nickname')
        .in('user_id', userIds)
    : { data: [] };

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.user_id, p.nickname])
  );

  const enriched =
    allowlist?.map((r) => ({
      ...r,
      nickname: profileMap[r.user_id] ?? '알 수 없음',
    })) ?? [];

  return (
    <>
      <Header user={user} isAllowlisted />
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Creator Allowlist 관리 🔑
            </h1>
            <span className="text-sm text-gray-500">{enriched.length}명</span>
          </div>
          <AllowlistClient initialList={enriched} />
        </div>
      </main>
      <Footer />
    </>
  );
}
