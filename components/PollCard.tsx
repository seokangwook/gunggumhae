import Link from 'next/link';
import { formatCount, timeAgo } from '@/lib/utils';

interface PollCardProps {
  poll: {
    id: string;
    title: string;
    options: { label: string }[];
    total_votes: number;
    status: string;
    created_at: string;
    closes_at?: string | null;
  };
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  open: { label: '진행중', cls: 'bg-green-100 text-green-700' },
  closed: { label: '종료', cls: 'bg-gray-100 text-gray-500' },
  scheduled: { label: '예약', cls: 'bg-blue-100 text-blue-600' },
  draft: { label: '초안', cls: 'bg-yellow-100 text-yellow-600' },
};

export default function PollCard({ poll }: PollCardProps) {
  const badge = STATUS_BADGE[poll.status] ?? STATUS_BADGE.open;
  const optionCount = Array.isArray(poll.options) ? poll.options.length : 0;

  return (
    <Link href={`/q/${poll.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-violet-200 hover:shadow-md transition-all duration-200 h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}
          >
            {badge.label}
          </span>
          <span className="text-xs text-gray-400">{timeAgo(poll.created_at)}</span>
        </div>
        <h3 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-violet-700 transition-colors flex-1 mb-3">
          {poll.title}
        </h3>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>선택지 {optionCount}개</span>
          <span className="font-medium text-violet-600">
            {formatCount(poll.total_votes)}표 참여
          </span>
        </div>
      </div>
    </Link>
  );
}
