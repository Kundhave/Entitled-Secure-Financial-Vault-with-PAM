import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'ENTITLED - Secure Financial Vault',
  description: 'Privileged Access Management for Financial Data',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
