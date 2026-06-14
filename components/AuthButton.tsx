'use client';

import type { User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthButtonProps {
  user: User | null;
}

export default function AuthButton({ user }: AuthButtonProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 hidden sm:block">
          {user.user_metadata?.full_name?.split(' ')[0] ?? '익명'}
        </span>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <a
      href="/auth/login"
      className="text-sm font-medium bg-violet-600 text-white px-4 py-1.5 rounded-full hover:bg-violet-700 transition-colors"
    >
      로그인
    </a>
  );
}
