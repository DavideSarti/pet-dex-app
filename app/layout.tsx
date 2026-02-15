import type { Metadata, Viewport } from 'next'
import { Press_Start_2P } from 'next/font/google'

import './globals.css'

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
})

export const metadata: Metadata = {
  title: 'GECKO-DEX',
  description: 'Retro 8-bit Leopard Gecko Tracker - Gotta Track Em All!',
}

export const viewport: Viewport = {
  themeColor: '#0f380f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${pressStart2P.variable} font-mono antialiased`}>
        {children}
      </body>
    </html>
  )
}
