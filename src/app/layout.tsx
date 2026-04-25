import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Smart Disaster Response MIS',
  description: 'Emergency Management Information System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <body style={{ backgroundColor: '#f3f4f6', color: '#111827', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
