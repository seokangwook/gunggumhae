'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { pct } from '@/lib/utils';

interface Option {
  label: string;
}

interface VoteResult {
  option_index: number;
  vote_count: number;
}

interface VoteFormProps {
  pollId: string;
  options: Option[];
  totalVotes: number;
  status: string;
  userVoteIndex: number | null;
  results: VoteResult[];
  collectDemographics: boolean;
  isLoggedIn: boolean;
}

const GENDER_OPTIONS = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
  { value: 'other', label: '기타' },
  { value: 'skip', label: '응답 안 함' },
];

const AGE_OPTIONS = [
  { value: '10s', label: '10대' },
  { value: '20s', label: '20대' },
  { value: '30s', label: '30대' },
  { value: '40s', label: '40대' },
  { value: '50s', label: '50대' },
  { value: '60s+', label: '60대 이상' },
  { value: 'skip', label: '응답 안 함' },
];

export default function VoteForm({
  pollId,
  options,
  totalVotes,
  status,
  userVoteIndex,
  results,
  collectDemographics,
  isLoggedIn,
}: VoteFormProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [gender, setGender] = useState('skip');
  const [ageBand, setAgeBand] = useState('skip');
  const [showDemographics, setShowDemographics] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const hasVoted = userVoteIndex !== null;
  const isClosed = status === 'closed';
  const showResults = hasVoted || isClosed;

  function getVoteCount(index: number) {
    return results.find((r) => r.option_index === index)?.vote_count ?? 0;
  }

  async function handleVote() {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }
    if (selected === null) {
      setError('선택지를 골라주세요.');
      return;
    }
    if (collectDemographics && !showDemographics) {
      setShowDemographics(true);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedOptionIndex: selected,
          gender,
          ageBand,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? '투표 중 오류가 발생했습니다.');
        return;
      }
      router.refresh();
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {options.map((opt, idx) => {
        const count = getVoteCount(idx);
        const p = pct(count, totalVotes);
        const isUserChoice = userVoteIndex === idx;

        return (
          <div key={idx} className="relative">
            {showResults ? (
              <div
                className={`relative overflow-hidden rounded-xl border-2 p-4 transition-all ${
                  isUserChoice
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div
                  className="absolute inset-0 bg-violet-100 opacity-40 rounded-xl origin-left transition-all duration-700"
                  style={{ transform: `scaleX(${p / 100})` }}
                />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isUserChoice && (
                      <span className="text-violet-600 font-bold">✓</span>
                    )}
                    <span className="font-medium text-gray-800">{opt.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-violet-700">{p}%</span>
                    <span className="text-xs text-gray-400 ml-1">({count}표)</span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSelected(idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selected === idx
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-gray-100 bg-white hover:border-violet-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selected === idx
                        ? 'border-violet-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {selected === idx && (
                      <span className="w-2.5 h-2.5 rounded-full bg-violet-500 block" />
                    )}
                  </span>
                  <span className="font-medium text-gray-800">{opt.label}</span>
                </div>
              </button>
            )}
          </div>
        );
      })}

      {showResults && (
        <p className="text-center text-sm text-gray-500 pt-1">
          총 {totalVotes.toLocaleString()}명 참여
        </p>
      )}

      {/* 인구통계 수집 */}
      {!showResults && showDemographics && collectDemographics && (
        <div className="bg-violet-50 rounded-xl p-4 space-y-4 border border-violet-100">
          <p className="text-sm font-medium text-violet-700">
            선택사항 — 더 풍부한 리서치를 위해 알려주세요 🙏
          </p>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">성별</p>
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGender(g.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    gender === g.value
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'border-gray-200 text-gray-600 hover:border-violet-300'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">나이대</p>
            <div className="flex flex-wrap gap-2">
              {AGE_OPTIONS.map((a) => (
                <button
                  key={a.value}
                  onClick={() => setAgeBand(a.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    ageBand === a.value
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'border-gray-200 text-gray-600 hover:border-violet-300'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!showResults && !isClosed && (
        <div className="space-y-2 pt-1">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!isLoggedIn ? (
            <a
              href="/auth/login"
              className="block w-full text-center bg-violet-600 text-white font-semibold py-3 rounded-xl hover:bg-violet-700 transition-colors"
            >
              로그인하고 투표하기
            </a>
          ) : (
            <button
              onClick={handleVote}
              disabled={loading}
              className="w-full bg-violet-600 text-white font-semibold py-3 rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {loading
                ? '투표 중...'
                : showDemographics
                ? '최종 제출'
                : collectDemographics && selected !== null
                ? '다음 (인구통계 선택)'
                : '투표하기'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
