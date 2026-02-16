'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { AuthSessionProvider } from '@/components/providers/session-provider'
import { ToastProvider } from '@/components/ui/Toast'
import { CompareProvider } from '@/components/product/CompareContext'
import { CartProvider } from '@/contexts/CartContext'
import { CompareBar } from '@/components/product/CompareBar'
import Header from '@/components/layout/Header'
import { usePathname } from 'next/navigation'
import { TokenSyncProvider } from '@/contexts/TokenSyncContext'

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')

  return (
    <AuthSessionProvider>
      <TokenSyncProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <CompareProvider>
                {!isAdminPage && <Header />}
                {children}
                {!isAdminPage && <CompareBar />}
              </CompareProvider>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </TokenSyncProvider>
    </AuthSessionProvider>
  )
}
