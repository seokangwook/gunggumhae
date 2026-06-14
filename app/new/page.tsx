import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewPollClient from './NewPollClient';

export default async function NewPollPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: allowlist } = await supabase
    .from('gunggumhae_allowlist')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  if (!allowlist) {
    return (
      <>
        <Header user={user} isAllowlisted={false} />
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <p className="text-4xl mb-4">🔒</p>
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              Creator 승인이 필요해요
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              질문을 만들려면 운영자 승인이 필요합니다.
              <br />
              활발히 참여하거나 운영자에게 문의하세요.
            </p>
            <a
              href="mailto:topazparad@gmail.com"
              className="bg-violet-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-violet-700 transition-colors"
            >
              승인 문의하기
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header user={user} isAllowlisted />
      <main className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">새 질문 만들기 ✏️</h1>
          <NewPollClient userId={user.id} />
        </div>
      </main>
      <Footer />
    </>
  );
}
