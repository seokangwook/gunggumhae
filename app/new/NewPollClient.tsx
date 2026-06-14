'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NewPollClientProps {
  userId: string;
}

export default function NewPollClient({ userId: _userId }: NewPollClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [closesAt, setClosesAt] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [collectDemographics, setCollectDemographics] = useState(true);
  const [status, setStatus] = useState<'open' | 'scheduled' | 'draft'>('open');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addOption() {
    if (options.length < 10) setOptions([...options, '']);
  }

  function removeOption(idx: number) {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx));
  }

  function updateOption(idx: number, value: string) {
    const next = [...options];
    next[idx] = value;
    setOptions(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const filledOptions = options.filter((o) => o.trim());
    if (filledOptions.length < 2) {
      setError('선택지를 최소 2개 이상 입력해주세요.');
      return;
    }
    if (!title.trim()) {
      setError('질문 제목을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          options: filledOptions.map((label) => ({ label })),
          collect_demographics: collectDemographics,
          closes_at: closesAt || null,
          scheduled_at: scheduledAt || null,
          status: scheduledAt ? 'scheduled' : status,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? '오류가 발생했습니다.');
        return;
      }

      const { id } = await res.json();
      router.push(`/q/${id}`);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 제목 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          질문 제목 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="예: 이번 월드컵 우승국은?"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
          required
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/200</p>
      </div>

      {/* 설명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          부연 설명 (선택)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="추가 설명이 필요하면 적어주세요..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none"
        />
      </div>

      {/* 선택지 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          선택지 <span className="text-red-400">*</span> (최소 2개)
        </label>
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
                placeholder={`선택지 ${idx + 1}`}
                maxLength={100}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  className="text-gray-400 hover:text-red-500 px-2 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < 10 && (
          <button
            type="button"
            onClick={addOption}
            className="mt-2 text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            + 선택지 추가
          </button>
        )}
      </div>

      {/* 옵션 */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">인구통계 수집</p>
            <p className="text-xs text-gray-500">참여자 성별·나이대 분석</p>
          </div>
          <button
            type="button"
            onClick={() => setCollectDemographics(!collectDemographics)}
            className={`w-11 h-6 rounded-full transition-colors ${
              collectDemographics ? 'bg-violet-600' : 'bg-gray-300'
            } relative`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                collectDemographics ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            공개 시작 (예약, 선택)
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => {
              setScheduledAt(e.target.value);
              if (e.target.value) setStatus('scheduled');
            }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            마감 시간 (선택)
          </label>
          <input
            type="datetime-local"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
          />
        </div>

        {!scheduledAt && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              게시 상태
            </label>
            <div className="flex gap-2">
              {(['open', 'draft'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    status === s
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'border-gray-200 text-gray-600 hover:border-violet-300'
                  }`}
                >
                  {s === 'open' ? '바로 공개' : '임시저장'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-600 text-white font-semibold py-3.5 rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '생성 중...' : '질문 만들기 🚀'}
      </button>
    </form>
  );
}
