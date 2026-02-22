import './globals.css'
import { Inter } from 'next/font/google'
import { LayoutContent } from './layout-content'
import { Toaster } from 'sonner'
import { getCategoryTreeServer } from '@/lib/api/server'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Smart Technologies Bangladesh - B2C E-Commerce',
  description: 'Premier technology solutions and products for Bangladesh market',
}

// Disable static generation to prevent build errors with useSession
export const dynamic = 'force-dynamic'

async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch category tree server-side for performance
  let categoryTree: any[] = []
  try {
    const categoryTreeResponse = await getCategoryTreeServer('active')
    categoryTree = categoryTreeResponse?.tree || []
  } catch (error) {
    console.error('[RootLayout] Error fetching category tree:', error)
    categoryTree = []
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <LayoutContent categoryTree={categoryTree}>{children}</LayoutContent>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}

export default RootLayout