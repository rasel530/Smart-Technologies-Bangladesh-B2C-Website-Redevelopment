import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { AuthSessionProvider } from '@/components/providers/session-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Smart Technologies Bangladesh - B2C E-Commerce',
  description: 'Premier technology solutions and products for Bangladesh market',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AuthSessionProvider>
            {children}
          </AuthSessionProvider>
        </AuthProvider>
      </body>
    </html>
  )
}