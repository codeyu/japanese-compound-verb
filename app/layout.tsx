import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '日本語複合動詞',
  description: '日本語の複合動詞を検索するためのアプリケーション',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
    ],
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}

