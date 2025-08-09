import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Your Family Tree',
  description: 'Upload your GEDCOM to explore your family tree',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link href="/">
                  <h1 className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors">
                    Your Family Tree
                  </h1>
                </Link>
                <nav className="flex space-x-6">
                  <Link 
                    href="/"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    All People
                  </Link>
                  <Link 
                    href="/tree"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Family Tree
                  </Link>
                  <Link 
                    href="/map"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Family Map
                  </Link>
                  <Link 
                    href="/stats"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Statistics
                  </Link>
                  <Link 
                    href="/settings"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Settings
                  </Link>
                </nav>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Your Family Tree
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
} 