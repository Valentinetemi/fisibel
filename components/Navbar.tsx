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
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/45 shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset] backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-3.5 sm:px-8">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              Fisibel
            </h1>
            <span className="hidden font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400 sm:inline">
              Health data
            </span>
            <motion.div
              className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.45)]"
              animate={{ scale: [1, 1.15, 1], opacity: [1, 0.85, 1] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            />
          </div>
          <nav className="flex flex-wrap justify-end gap-1 sm:gap-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 whitespace-nowrap rounded-lg border px-3 text-xs font-medium transition-colors sm:text-[13px] ${
                      isActive
                        ? 'border-emerald-400/35 bg-emerald-500/10 text-emerald-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]'
                        : 'border-transparent text-slate-600 hover:border-white/50 hover:bg-white/40'
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
