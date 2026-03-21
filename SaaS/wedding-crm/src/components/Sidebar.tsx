'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Users, Heart, ClipboardCheck, Store,
  BookOpen, Globe, ChevronLeft, ChevronRight, LogOut, Menu, X,
  Settings, Bell
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads & Pipeline', href: '/leads', icon: Users },
  { name: 'Weddings', href: '/weddings', icon: Heart },
  { name: 'SOP & Checklists', href: '/checklists', icon: ClipboardCheck },
  { name: 'Vendors', href: '/vendors', icon: Store },
  { name: 'Data Library', href: '/library', icon: BookOpen },
  { name: 'Client Portal', href: '/portal', icon: Globe },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#5c1a2a]/30">
        <div className="w-9 h-9 bg-gradient-to-br from-[#d4a017] to-[#f5c518] rounded-lg flex items-center justify-center flex-shrink-0 shadow-gold-glow">
          <Heart className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight font-display">WedCRM</h1>
            <p className="text-xs text-[#d4a017]/70">Wedding Management</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#8b1a34] to-[#b42a4a] text-[#f5e6d0] shadow-lg shadow-[#8b1a34]/40'
                  : 'text-[#f5e6d0]/80 hover:bg-[#5c1a2a]/40 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#f5e6d0]' : 'text-[#d4a017]/70'}`} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-[#5c1a2a]/30">
        {!collapsed && session?.user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#d4a017] to-[#b8860b] rounded-full flex items-center justify-center text-white text-xs font-bold">
              {session.user.name?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
              <p className="text-xs text-[#d4a017]/70 truncate">{(session.user as any).role?.replace('_', ' ')}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#f5e6d0]/80 hover:bg-[#5c1a2a]/40 hover:text-white transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gradient-to-b from-[#2d0811] via-[#3d0f18] to-[#2d0811] text-white rounded-lg shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-gradient-to-b from-[#2d0811] via-[#3d0f18] to-[#2d0811]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-white">
              <X className="w-5 h-5" />
            </button>
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-gradient-to-b from-[#2d0811] via-[#3d0f18] to-[#2d0811] shadow-[4px_0_24px_-4px_rgba(45,8,17,0.3)] transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} min-h-screen relative`}>
        <NavContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-[#8b1a34] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#5c1a2a]/40 transition"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </>
  )
}
