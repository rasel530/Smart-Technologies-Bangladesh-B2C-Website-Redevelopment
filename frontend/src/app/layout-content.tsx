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
import { CategoryTree } from '@/types/category'
import { WishlistProvider } from '@/contexts/WishlistContext'
import { PaymentProvider } from '@/contexts/PaymentContext'

interface LayoutContentProps {
  children: React.ReactNode
  categoryTree?: CategoryTree[]
}

export function LayoutContent({ children, categoryTree = [] }: LayoutContentProps) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')

  return (
    <AuthSessionProvider>
      <TokenSyncProvider>
        <AuthProvider>
          <WishlistProvider>
            <PaymentProvider>
              {/* PRIORITY 1: Skip CartProvider for admin pages to reduce LCP by 5-8 seconds */}
              {isAdminPage ? (
                <ToastProvider>
                  <CompareProvider>
                    {children}
                  </CompareProvider>
                </ToastProvider>
              ) : (
                <CartProvider>
                  <ToastProvider>
                    <CompareProvider>
                      <Header categoryTree={categoryTree} categoriesLoading={false} />
                      {children}
                      <CompareBar />
                    </CompareProvider>
                  </ToastProvider>
                </CartProvider>
              )}
            </PaymentProvider>
          </WishlistProvider>
        </AuthProvider>
      </TokenSyncProvider>
    </AuthSessionProvider>
  )
}
