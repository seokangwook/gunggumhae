'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const TIERS = [
  {
    id: 'bronze',
    label: '커피 한 잔 ☕',
    amount: 3000,
    desc: '감사합니다! 개발에 힘이 됩니다.',
    perks: [],
  },
  {
    id: 'silver',
    label: '냥사료 한 끼 🐱',
    amount: 5000,
    desc: '3개월 광고 없이 + 질문 예약 +5개',
    perks: ['3개월 광고 제거', '질문 예약 슬롯 +5'],
  },
  {
    id: 'gold',
    label: '츄르 세트 🌟',
    amount: 10000,
    desc: '1년 광고 없이 + allowlist 자동 등록 + 결과 PDF',
    perks: ['1년 광고 제거', 'Creator 자동 등록', '결과 PDF 다운로드'],
  },
] as const;

interface SupportModalProps {
  onClose: () => void;
}

export default function SupportModal({ onClose }: SupportModalProps) {
  const [selected, setSelected] = useState<'bronze' | 'silver' | 'gold'>('silver');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSupport() {
    setLoading(true);
    setError('');
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const tier = TIERS.find((t) => t.id === selected)!;
      const res = await fetch('/api/support/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: selected, amount: tier.amount }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError('결제 준비 중입니다. 잠시 후 다시 시도해주세요.');
      }
    } catch {
      setError('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">응원하기 💜</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>
        <p className="text-sm text-gray-500">개발자에게 커피 한 잔 보내주세요.</p>
        <div className="space-y-2">
          {TIERS.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelected(tier.id)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                selected === tier.id
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-gray-100 hover:border-violet-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{tier.label}</span>
                <span className="text-violet-700 font-bold text-sm">
                  ₩{tier.amount.toLocaleString()}
                </span>
              </div>
              {tier.perks.length > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">{tier.perks.join(' · ')}</p>
              )}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          onClick={handleSupport}
          disabled={loading}
          className="w-full bg-violet-600 text-white font-semibold py-3 rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '처리 중...' : '응원하기'}
        </button>
      </div>
    </div>
  );
}
