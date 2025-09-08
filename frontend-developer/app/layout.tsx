import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProviderWrapper } from './auth/AuthProviderWrapper'
import { ErrorProvider } from './contexts/ErrorContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { ThemeProvider } from './contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Developer Dashboard',
  description: 'Developer Dashboard for managing agents, phone numbers, and configurations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (

    <html lang="en" className="dark">
      <body className={`${inter.className} dark:bg-gray-900 dark:text-white`}>

        <ThemeProvider>
          <AuthProviderWrapper>
            <ErrorProvider>
              <ProtectedRoute>
                {children}
              </ProtectedRoute>
            </ErrorProvider>
          </AuthProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
