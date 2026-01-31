import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { AuthSessionProvider } from '@/components/providers/session-provider'
import { ToastProvider } from '@/components/ui/Toast'
import { CompareProvider } from '@/components/product/CompareContext'
import { CompareBar } from '@/components/product/CompareBar'
import Header from '@/components/layout/Header'

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
        <AuthSessionProvider>
          <AuthProvider>
            <ToastProvider>
              <CompareProvider>
                <Header />
                {children}
                <CompareBar />
              </CompareProvider>
            </ToastProvider>
          </AuthProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}