import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LC Stats — LeetCode Profile Analyzer',
  description: 'Compare and analyze LeetCode profiles side by side',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
