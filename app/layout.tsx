import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'hare_table',
  description: '네이버 블로그 → 인스타그램 & 네이버 클립 자동 변환',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'hare_table',
    description: '네이버 블로그 → 인스타그램 & 네이버 클립 자동 변환',
    images: [{ url: '/favicon.png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          * { -webkit-tap-highlight-color: rgba(0,0,0,0.08); touch-action: manipulation; }
          button, a, [role="button"] { cursor: pointer; -webkit-appearance: none; }
        ` }} />
      </head>
      <body suppressHydrationWarning style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: 'linear-gradient(135deg, #f0f9ff 0%, #e2e8f0 40%, #cbd5e1 100%)', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
