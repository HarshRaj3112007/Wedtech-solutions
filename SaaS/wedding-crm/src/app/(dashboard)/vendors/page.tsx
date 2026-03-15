'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Star, Phone, Mail, MapPin, Globe, Instagram, X, Calendar } from 'lucide-react'

const CATEGORIES = [
  'PHOTOGRAPHER', 'VIDEOGRAPHER', 'CATERER', 'DECORATOR', 'DJ', 'MAKEUP_ARTIST',
  'MEHENDI_ARTIST', 'VENUE', 'FLORIST', 'INVITATION', 'TRANSPORT', 'LIGHTING',
  'ENTERTAINMENT', 'PANDIT', 'CHOREOGRAPHER', 'OTHER'
]

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchVendors = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterCategory) params.set('category', filterCategory)
    fetch(`/api/vendors?${params}`).then(r => r.json()).then(d => { setVendors(d); setLoading(false) })
  }

  useEffect(() => { fetchVendors() }, [search, filterCategory])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-500 mt-1">Vendor registry, ratings, and follow-up tracking</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map(vendor => (
            <div key={vendor.id} onClick={() => setSelectedVendor(vendor)} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
                  <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{vendor.category.replace(/_/g, ' ')}</span>
                </div>
                {vendor.rating && (
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-medium text-amber-700">{vendor.rating}</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5 text-sm text-gray-500">
                {vendor.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{vendor.phone}</div>}
                {vendor.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{vendor.email}</div>}
                {vendor.city && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{vendor.city}</div>}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>{vendor._count?.assignments || 0} assignments</span>
                {vendor.priceRange && <span className={`px-2 py-0.5 rounded-full ${vendor.priceRange === 'LUXURY' ? 'bg-amber-50 text-amber-600' : vendor.priceRange === 'PREMIUM' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>{vendor.priceRange}</span>}
                {vendor.followUps?.[0] && (
                  <span className="flex items-center gap-1 text-orange-500"><Calendar className="w-3 h-3" />Follow-up</span>
                )}
              </div>
            </div>
          ))}
          {vendors.length === 0 && <div className="col-span-full text-center py-16"><p className="text-gray-500">No vendors found</p></div>}
        </div>
      )}

      {showAddModal && <AddVendorModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchVendors() }} />}
      {selectedVendor && <VendorDetailModal vendor={selectedVendor} onClose={() => setSelectedVendor(null)} onUpdate={fetchVendors} />}
    </div>
  )
}

function AddVendorModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', category: '', email: '', phone: '', city: '', address: '', priceRange: '', rating: '', website: '', instagram: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Add Vendor</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"><option value="">Select</option>{CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label><select value={form.priceRange} onChange={e => setForm({...form, priceRange: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"><option value="">Select</option><option value="BUDGET">Budget</option><option value="MODERATE">Moderate</option><option value="PREMIUM">Premium</option><option value="LUXURY">Luxury</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label><input type="number" min="1" max="5" step="0.1" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Website</label><input value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label><input value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50">{saving ? 'Saving...' : 'Add Vendor'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function VendorDetailModal({ vendor, onClose, onUpdate }: { vendor: any; onClose: () => void; onUpdate: () => void }) {
  const [detail, setDetail] = useState<any>(null)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [fuForm, setFuForm] = useState({ type: 'CALL', notes: '', followUpDate: '' })

  useEffect(() => {
    fetch(`/api/vendors/${vendor.id}`).then(r => r.json()).then(setDetail)
  }, [vendor.id])

  const addFollowUp = async () => {
    await fetch(`/api/vendors/${vendor.id}/followups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fuForm),
    })
    setShowFollowUp(false)
    fetch(`/api/vendors/${vendor.id}`).then(r => r.json()).then(setDetail)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">{vendor.name}</h2>
            <span className="text-sm text-purple-600">{vendor.category?.replace(/_/g, ' ')}</span>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {vendor.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{vendor.phone}</div>}
            {vendor.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" />{vendor.email}</div>}
            {vendor.city && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{vendor.city}</div>}
            {vendor.website && <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-gray-400" />{vendor.website}</div>}
            {vendor.instagram && <div className="flex items-center gap-2"><Instagram className="w-4 h-4 text-gray-400" />{vendor.instagram}</div>}
            {vendor.rating && <div className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-500 fill-amber-500" />{vendor.rating}/5</div>}
          </div>

          {/* Follow-ups */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Follow-ups</h3>
              <button onClick={() => setShowFollowUp(true)} className="text-xs text-purple-600 hover:text-purple-700 font-medium">+ Add</button>
            </div>
            {showFollowUp && (
              <div className="bg-gray-50 p-3 rounded-xl mb-3 space-y-2">
                <select value={fuForm.type} onChange={e => setFuForm({...fuForm, type: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"><option value="CALL">Call</option><option value="EMAIL">Email</option><option value="MEETING">Meeting</option><option value="WHATSAPP">WhatsApp</option></select>
                <input type="date" value={fuForm.followUpDate} onChange={e => setFuForm({...fuForm, followUpDate: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                <textarea placeholder="Notes" value={fuForm.notes} onChange={e => setFuForm({...fuForm, notes: e.target.value})} rows={2} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowFollowUp(false)} className="px-3 py-1 text-xs text-gray-500">Cancel</button>
                  <button onClick={addFollowUp} className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg">Save</button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {(detail?.followUps || []).map((fu: any) => (
                <div key={fu.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${fu.isCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{fu.type}</span>
                  <div className="flex-1">
                    {fu.notes && <p className="text-sm text-gray-600">{fu.notes}</p>}
                    <p className="text-xs text-gray-400">{new Date(fu.followUpDate).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ))}
              {(!detail?.followUps || detail.followUps.length === 0) && <p className="text-xs text-gray-400 text-center py-2">No follow-ups</p>}
            </div>
          </div>

          {/* Assignments */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Wedding Assignments</h3>
            <div className="space-y-2">
              {(detail?.assignments || []).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                  <span className="text-gray-700">{a.wedding?.clientName}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${a.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{a.status}</span>
                </div>
              ))}
              {(!detail?.assignments || detail.assignments.length === 0) && <p className="text-xs text-gray-400 text-center py-2">No assignments</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
