import Link from 'next/link';
import AuthButton from './AuthButton';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User | null;
  isAllowlisted?: boolean;
}

export default function Header({ user, isAllowlisted }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-violet-700 tracking-tight">
          궁금해 🤔
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/history" className="hover:text-violet-600 transition-colors">
            전체 투표
          </Link>
          {user && (
            <Link href="/me" className="hover:text-violet-600 transition-colors">
              내 활동
            </Link>
          )}
          {isAllowlisted && (
            <Link
              href="/new"
              className="bg-violet-600 text-white px-4 py-1.5 rounded-full hover:bg-violet-700 transition-colors"
            >
              질문 만들기
            </Link>
          )}
        </nav>
        <AuthButton user={user} />
      </div>
    </header>
  );
}
