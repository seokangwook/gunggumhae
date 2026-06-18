'use client';

export default function ShareButtons({
  title,
  shareUrl,
}: {
  title: string;
  shareUrl: string;
}) {
  return (
    <div className="bg-violet-50 rounded-2xl border border-violet-100 p-5">
      <p className="text-sm font-medium text-violet-700 mb-3">
        친구에게 공유하면 더 많은 표가 모여요! 🔗
      </p>
      <div className="flex gap-2 flex-wrap">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          X (Twitter)
        </a>
        <a
          href={`https://www.threads.net/intent/post?text=${encodeURIComponent(`${title}\n${shareUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Threads
        </a>
        <button
          onClick={() => navigator.clipboard.writeText(shareUrl)}
          className="text-sm border border-violet-200 text-violet-700 px-4 py-2 rounded-lg hover:bg-violet-100 transition-colors"
        >
          링크 복사
        </button>
      </div>
    </div>
  );
}
