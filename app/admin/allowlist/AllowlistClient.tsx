'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AllowlistEntry {
  user_id: string;
  added_at: string;
  auto_approved: boolean;
  notes: string | null;
  nickname: string;
}

export default function AllowlistClient({
  initialList,
}: {
  initialList: AllowlistEntry[];
}) {
  const [list, setList] = useState(initialList);
  const [newUserId, setNewUserId] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newUserId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/allowlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: newUserId.trim(), notes: newNotes.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? '오류가 발생했습니다.');
        return;
      }
      setNewUserId('');
      setNewNotes('');
      router.refresh();
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm('이 사용자를 allowlist에서 제거하시겠습니까?')) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/allowlist?user_id=${userId}`, { method: 'DELETE' });
      setList((l) => l.filter((e) => e.user_id !== userId));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 추가 폼 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">새 Creator 추가</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <input
            type="text"
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            placeholder="User UUID (Supabase auth.users.id)"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
          />
          <input
            type="text"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="메모 (선택)"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            추가
          </button>
        </form>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 font-medium">
              <th className="px-4 py-3">닉네임</th>
              <th className="px-4 py-3 hidden sm:table-cell">User ID</th>
              <th className="px-4 py-3">승인방식</th>
              <th className="px-4 py-3 hidden sm:table-cell">메모</th>
              <th className="px-4 py-3">추가일</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.map((entry) => (
              <tr key={entry.user_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">
                  {entry.nickname}
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden sm:table-cell">
                  {entry.user_id.substring(0, 8)}...
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      entry.auto_approved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {entry.auto_approved ? '자동' : '수동'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                  {entry.notes ?? '-'}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(entry.added_at).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleRemove(entry.user_id)}
                    disabled={loading}
                    className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
                  >
                    제거
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  Allowlist가 비어 있습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
