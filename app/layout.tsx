import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Root Online — A Game of Woodland Might and Right',
  description: 'Play Root online with your friends. Supports 2–4 players per room.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0f1a10] text-[#e8e0d0] antialiased">
        {children}
      </body>
    </html>
  )
}
