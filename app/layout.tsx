import type { Metadata, Viewport } from 'next'
import { Press_Start_2P } from 'next/font/google'

import './globals.css'
import { RegisterSW } from '@/components/register-sw'

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
})

export const metadata: Metadata = {
  title: 'HERP-DEX',
  description: 'Retro 8-bit Pet Tracker - Gotta Track Em All!',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HERP-DEX',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-512x512.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f380f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${pressStart2P.variable} font-mono antialiased`}>
        <RegisterSW />
        {children}
      </body>
    </html>
  )
}
