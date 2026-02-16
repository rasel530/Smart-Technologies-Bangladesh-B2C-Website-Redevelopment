import './globals.css'
import { Inter } from 'next/font/google'
import { LayoutContent } from './layout-content'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Smart Technologies Bangladesh - B2C E-Commerce',
  description: 'Premier technology solutions and products for Bangladesh market',
}

// Disable static generation to prevent build errors with useSession
export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LayoutContent>{children}</LayoutContent>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}