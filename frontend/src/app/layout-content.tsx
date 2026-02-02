'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { AuthSessionProvider } from '@/components/providers/session-provider'
import { ToastProvider } from '@/components/ui/Toast'
import { CompareProvider } from '@/components/product/CompareContext'
import { CompareBar } from '@/components/product/CompareBar'
import Header from '@/components/layout/Header'
import { usePathname } from 'next/navigation'

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')

  return (
    <AuthSessionProvider>
      <AuthProvider>
        <ToastProvider>
          <CompareProvider>
            {!isAdminPage && <Header />}
            {children}
            {!isAdminPage && <CompareBar />}
          </CompareProvider>
        </ToastProvider>
      </AuthProvider>
    </AuthSessionProvider>
  )
}
