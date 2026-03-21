'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Heart, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2d0811] via-[#4a0e1c] to-[#1a0610] bg-mandala flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#d4a017] to-[#f5c518] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-gold-glow">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-display text-white">WedCRM</h1>
          <p className="text-[#d4a017]/60 mt-1">Wedding Planning Management System</p>
        </div>

        {/* Form */}
        <div className="glass-dark rounded-2xl p-8 shadow-wedding-lg">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#f5e6d0]/70 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-[#8b1a34]/30 rounded-xl text-white placeholder-[#d4a017]/30 focus:outline-none focus:ring-2 focus:ring-[#d4a017]/50 focus:border-transparent transition"
                placeholder="admin@wedcrm.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#f5e6d0]/70 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-[#8b1a34]/30 rounded-xl text-white placeholder-[#d4a017]/30 focus:outline-none focus:ring-2 focus:ring-[#d4a017]/50 focus:border-transparent transition"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d4a017]/40 hover:text-[#f5e6d0]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#8b1a34] to-[#d4a017] text-white font-semibold rounded-xl hover:from-[#6d1529] hover:to-[#b8860b] focus:outline-none focus:ring-2 focus:ring-[#d4a017] focus:ring-offset-2 focus:ring-offset-transparent transition shadow-lg shadow-[#8b1a34]/30 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-[#d4a017]/5 rounded-xl border border-[#d4a017]/10">
            <p className="text-xs text-[#d4a017]/60 font-medium mb-2">Demo Credentials:</p>
            <p className="text-xs text-[#f5e6d0]/70">Email: admin@wedcrm.com</p>
            <p className="text-xs text-[#f5e6d0]/70">Password: admin123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
