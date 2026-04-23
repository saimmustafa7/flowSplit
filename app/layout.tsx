import type { Metadata, Viewport } from "next"
import "./globals.css"
import '@fontsource/jetbrains-mono/500.css'

import { AuthProvider } from "@/context/AuthContext"
import { ToastProvider } from "@/context/ToastContext"
import { NotificationProvider } from "@/context/NotificationContext"

export const metadata: Metadata = {
  title: "FlowSplit",
  description: "Mobile-first expense tracker and debt ledger",
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <ToastProvider>
          <AuthProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthProvider>
        </ToastProvider>
      </body >
    </html>
  )
}
