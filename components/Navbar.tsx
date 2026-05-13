'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { href: '/generate', label: 'Generate' },
    { href: '/catalog', label: 'Catalog' },
    { href: '/data-quality', label: 'Data Quality' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border backdrop-blur-sm bg-background/80">
      <div className="mx-auto w-full px-3 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold truncate">AfriGen</h1>
            <motion.div
              className="h-2 w-2 flex-shrink-0 rounded-full bg-green-500"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <nav className="flex gap-1 sm:gap-2 flex-wrap justify-end">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={`text-xs sm:text-sm whitespace-nowrap ${
                      isActive ? 'border-l-4 border-l-green-500' : ''
                    }`}
                  >
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
