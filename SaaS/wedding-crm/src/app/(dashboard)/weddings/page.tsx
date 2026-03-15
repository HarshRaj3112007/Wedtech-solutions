'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Calendar, MapPin, Users, Heart, X } from 'lucide-react'
import Link from 'next/link'

export default function WeddingsPage() {
  const [weddings, setWeddings] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchWeddings = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    fetch(`/api/weddings?${params}`).then(r => r.json()).then(d => { setWeddings(d); setLoading(false) })
  }

  useEffect(() => { fetchWeddings() }, [search])

  const statusColors: Record<string, string> = {
    PLANNING: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weddings</h1>
          <p className="text-gray-500 mt-1">Per-wedding command center with function-wise status tracking</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> New Wedding
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search weddings..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {weddings.map(wedding => {
            const daysUntil = Math.ceil((new Date(wedding.weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            return (
              <Link key={wedding.id} href={`/weddings/${wedding.id}`} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {wedding.clientName[0]}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[wedding.status] || 'bg-gray-100'}`}>{wedding.status.replace('_', ' ')}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition">{wedding.clientName}{wedding.partnerName ? ` & ${wedding.partnerName}` : ''}</h3>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(wedding.weddingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    {daysUntil > 0 && <span className="text-xs text-purple-600 font-medium ml-auto">{daysUntil}d away</span>}
                  </div>
                  {wedding.venue && <div className="flex items-center gap-2 text-sm text-gray-500"><MapPin className="w-4 h-4" /><span>{wedding.venue}</span></div>}
                  {wedding.guestCount && <div className="flex items-center gap-2 text-sm text-gray-500"><Users className="w-4 h-4" /><span>{wedding.guestCount} guests</span></div>}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
                  <span>{wedding.functions?.length || 0} functions</span>
                  <span>{wedding._count?.vendorAssignments || 0} vendors</span>
                  {wedding.budget && <span className="ml-auto font-medium text-gray-600">₹{(wedding.budget / 100000).toFixed(1)}L</span>}
                </div>
              </Link>
            )
          })}
          {weddings.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No weddings found. Create your first wedding!</p>
            </div>
          )}
        </div>
      )}

      {showAddModal && <AddWeddingModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchWeddings() }} />}
    </div>
  )
}

function AddWeddingModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ clientName: '', partnerName: '', weddingDate: '', venue: '', city: '', budget: '', guestCount: '', theme: '', description: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/weddings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">New Wedding</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
              <input required value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partner Name</label>
              <input value={form.partnerName} onChange={e => setForm({...form, partnerName: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wedding Date *</label>
              <input required type="date" value={form.weddingDate} onChange={e => setForm({...form, weddingDate: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget (₹)</label>
              <input type="number" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
              <input type="number" value={form.guestCount} onChange={e => setForm({...form, guestCount: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <input value={form.theme} onChange={e => setForm({...form, theme: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Wedding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
