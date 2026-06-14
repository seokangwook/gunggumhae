'use client';

import { useState } from 'react';
import SupportModal from '@/components/SupportModal';

export default function MeClient({ hasActiveSupport }: { hasActiveSupport: boolean }) {
  const [showSupport, setShowSupport] = useState(false);

  return (
    <>
      {!hasActiveSupport && (
        <button
          onClick={() => setShowSupport(true)}
          className="w-full bg-violet-50 border border-violet-200 text-violet-700 font-semibold py-3 rounded-xl hover:bg-violet-100 transition-colors mb-6"
        >
          커피 한 잔 응원하기 ☕
        </button>
      )}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
    </>
  );
}
