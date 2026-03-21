'use client'

import { useState, useEffect, use } from 'react'
import { Heart, Calendar, MapPin, CheckCircle2, Circle, Clock, Users, Store, DollarSign } from 'lucide-react'

export default function ClientPortalView({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/portal/${token}`)
      .then(r => { if (!r.ok) throw new Error('Invalid link'); return r.json() })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f5e6d0] bg-mandala flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#8b1a34]/20 border-t-[#8b1a34] rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f5e6d0] bg-mandala flex items-center justify-center">
      <div className="text-center">
        <Heart className="w-16 h-16 text-[#8b6969]/60 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-[#5c1a2a]/90">Link Expired or Invalid</h1>
        <p className="text-[#8b6969] mt-2">Please contact your wedding planner for a new link.</p>
      </div>
    </div>
  )

  const wedding = data?.wedding
  const daysUntil = wedding ? Math.ceil((new Date(wedding.weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f5e6d0] bg-mandala">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8b1a34] to-[#4a0e1c] bg-paisley-corner text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-[#f5e6d0]/70">WedCRM Client Portal</span>
          </div>
          <h1 className="text-3xl font-bold font-display">{wedding?.clientName}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-[#f5e6d0]/80">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(wedding?.weddingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            {wedding?.venue && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{wedding.venue}</span>}
          </div>
          {daysUntil > 0 && (
            <div className="mt-4 inline-flex items-center bg-white/20 rounded-xl px-4 py-2">
              <span className="text-2xl font-bold mr-2 text-[#d4a017]">{daysUntil}</span>
              <span className="text-sm">days to go!</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Functions / Timeline */}
        {data?.functions && (
          <div className="glass-card rounded-2xl p-6 shadow-wedding">
            <h2 className="text-lg font-semibold text-[#5c1a2a] mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-[#d4a017]" /> Wedding Timeline</h2>
            <div className="space-y-4">
              {data.functions.map((fn: any) => (
                <div key={fn.id} className="flex gap-4 items-start">
                  <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${fn.status === 'COMPLETED' ? 'bg-[#d4a017]' : fn.status === 'CONFIRMED' ? 'bg-[#8b1a34]' : 'bg-[#8b6969]/40'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-[#5c1a2a]">{fn.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${fn.status === 'COMPLETED' ? 'bg-[#d4a017]/10 text-[#b8860b]' : fn.status === 'CONFIRMED' ? 'bg-[#8b1a34]/10 text-[#8b1a34]' : 'bg-[#f5e6d0]/30 text-[#8b6969]'}`}>{fn.status}</span>
                    </div>
                    <div className="flex gap-3 text-sm text-[#8b6969] mt-1">
                      {fn.date && <span>{new Date(fn.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      {fn.venue && <span>{fn.venue}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklists */}
        {data?.checklists && (
          <div className="glass-card rounded-2xl p-6 shadow-wedding">
            <h2 className="text-lg font-semibold text-[#5c1a2a] mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#d4a017]" /> Checklists</h2>
            {data.checklists.map((cl: any) => {
              const done = cl.items?.filter((i: any) => i.isCompleted).length || 0
              const total = cl.items?.length || 0
              return (
                <div key={cl.id} className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-[#5c1a2a]/90">{cl.name}</h3>
                    <span className="text-sm text-[#8b1a34] font-medium">{total > 0 ? Math.round((done / total) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-[#f5e6d0] rounded-full h-2 mb-3">
                    <div className="bg-[#8b1a34] h-2 rounded-full" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
                  </div>
                  <div className="space-y-1.5">
                    {(cl.items || []).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        {item.isCompleted ? <CheckCircle2 className="w-4 h-4 text-[#d4a017]" /> : <Circle className="w-4 h-4 text-[#8b6969]/60" />}
                        <span className={item.isCompleted ? 'text-[#8b6969]/60 line-through' : 'text-[#5c1a2a]/90'}>{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Vendors */}
        {data?.vendors && (
          <div className="glass-card rounded-2xl p-6 shadow-wedding">
            <h2 className="text-lg font-semibold text-[#5c1a2a] mb-4 flex items-center gap-2"><Store className="w-5 h-5 text-[#d4a017]" /> Your Vendors</h2>
            <div className="grid gap-3">
              {data.vendors.map((va: any) => (
                <div key={va.id} className="flex items-center justify-between p-3 bg-[#faf8f5] rounded-xl">
                  <div>
                    <p className="font-medium text-[#5c1a2a] text-sm">{va.vendor?.name}</p>
                    <p className="text-xs text-[#8b6969]">{va.vendor?.category?.replace(/_/g, ' ')}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${va.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{va.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-[#8b6969]/60">Powered by WedCRM</p>
        </div>
      </div>
    </div>
  )
}
