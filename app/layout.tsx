import type { Metadata } from 'next';
import './globals.css';
import { APP_VERSION } from '@/lib/version';

const SITE_URL = 'https://gunggumhae.revely.company';

export const metadata: Metadata = {
  title: '궁금해 — 익명 투표 & 리서치',
  description:
    '궁금한 걸 투표로 물어보세요. 익명으로 참여하고 성별·나이대별 결과를 바로 확인하세요. SNS에 공유하면 더 많은 표가 모입니다.',
  keywords: ['투표', '익명투표', '설문', '리서치', '궁금해', 'poll', 'vote'],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: '궁금해 — 익명 투표 & 리서치',
    description: '궁금한 걸 투표로 물어보세요. 익명 참여 + 인구통계 결과 공개.',
    url: SITE_URL,
    siteName: '궁금해',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '궁금해',
    description: '익명 투표 & 리서치 플랫폼',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true';
  const adsClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? 'ca-pub-4128588337803742';

  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {adsEnabled && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClient}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body>
        {children}
        <div
          style={{
            position: 'fixed',
            bottom: 8,
            right: 8,
            fontSize: 10,
            color: '#9ca3af',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          v{APP_VERSION}
        </div>
      </body>
    </html>
  );
}
