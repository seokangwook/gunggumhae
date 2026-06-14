import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <p>
          <span className="font-medium text-gray-700">궁금해</span>
          {' · '}
          <a
            href="https://revely.company"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-violet-600"
          >
            Revely · revely.company
          </a>
        </p>
        <nav className="flex gap-4">
          <Link href="/history" className="hover:text-violet-600">
            투표 목록
          </Link>
          <a
            href="mailto:topazparad@gmail.com"
            className="hover:text-violet-600"
          >
            문의
          </a>
        </nav>
      </div>
    </footer>
  );
}
