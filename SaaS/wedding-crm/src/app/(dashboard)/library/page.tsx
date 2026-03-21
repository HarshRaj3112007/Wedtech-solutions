'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, BookOpen, FileText, Tag, Eye, EyeOff, X, Trash2, Edit3 } from 'lucide-react'

const CATEGORIES = ['VENUE_INFO', 'PRICING_GUIDE', 'CHECKLIST_TEMPLATE', 'VENDOR_GUIDE', 'TREND', 'FAQ', 'INSPIRATION', 'CONTRACT_TEMPLATE', 'POLICY']

export default function LibraryPage() {
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchItems = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterCategory) params.set('category', filterCategory)
    fetch(`/api/library?${params}`).then(r => r.json()).then(d => { setItems(d); setLoading(false) })
  }

  useEffect(() => { fetchItems() }, [search, filterCategory])

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return
    await fetch(`/api/library/${id}`, { method: 'DELETE' })
    fetchItems()
    setSelectedItem(null)
  }

  const categoryColors: Record<string, string> = {
    VENUE_INFO: 'bg-[#d4a017]/10 text-[#b8860b]', PRICING_GUIDE: 'bg-green-50 text-green-600',
    CHECKLIST_TEMPLATE: 'bg-[#8b1a34]/10 text-[#8b1a34]', VENDOR_GUIDE: 'bg-amber-50 text-amber-600',
    TREND: 'bg-[#d43d5e]/10 text-[#d43d5e]', FAQ: 'bg-indigo-50 text-indigo-600',
    INSPIRATION: 'bg-rose-50 text-rose-600', CONTRACT_TEMPLATE: 'bg-[#f5e6d0]/30 text-[#8b6969]', POLICY: 'bg-red-50 text-red-600',
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#5c1a2a]">Data Library</h1>
          <p className="text-[#8b6969] mt-1">Centralised knowledge base for your wedding planning firm</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2.5 bg-[#8b1a34] text-white rounded-xl text-sm font-medium hover:bg-[#6d1529] flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b6969]/60" />
          <input type="text" placeholder="Search library..." value={search} onChange={e => setSearch(e.target.value)} className="input-neu w-full pl-10 pr-4 py-2.5 border border-[#f0e4d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a017]" />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-4 py-2.5 border border-[#f0e4d8] rounded-xl text-sm">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#8b1a34]/20 border-t-[#8b1a34] rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="card-3d" onClick={() => setSelectedItem(item)}>
              <div className="card-3d-inner glass-card rounded-xl p-5 border border-[#f0e4d8] shadow-wedding hover:shadow-lg transition cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[item.category] || 'bg-[#f5e6d0]/30 text-[#8b6969]'}`}>{item.category.replace(/_/g, ' ')}</span>
                  {item.isPublic ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-[#8b6969]/60" />}
                </div>
                <h3 className="font-semibold text-[#5c1a2a] mt-2">{item.title}</h3>
                {item.content && <p className="text-sm text-[#8b6969] mt-1 line-clamp-2">{item.content}</p>}
                {item.tags && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {item.tags.split(',').map((tag: string) => (
                      <span key={tag} className="text-xs bg-[#f5e6d0]/30 text-[#8b6969] px-2 py-0.5 rounded-full">{tag.trim()}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-[#8b6969]/60 mt-3">{new Date(item.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full text-center py-16">
              <BookOpen className="w-12 h-12 text-[#8b6969]/60 mx-auto mb-3" />
              <p className="text-[#8b6969]">No items in the library yet.</p>
            </div>
          )}
        </div>
      )}

      {showAddModal && <AddLibraryModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchItems() }} />}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d0811]/60 backdrop-blur-sm p-4">
          <div className="glass-card rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#f0e4d8]">
              <h2 className="text-lg font-semibold text-[#5c1a2a]">{selectedItem.title}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => deleteItem(selectedItem.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => setSelectedItem(null)}><X className="w-5 h-5 text-[#8b6969]/60" /></button>
              </div>
            </div>
            <div className="p-6">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[selectedItem.category] || 'bg-[#f5e6d0]/30'}`}>{selectedItem.category.replace(/_/g, ' ')}</span>
              {selectedItem.content && <p className="text-sm text-[#5c1a2a]/90 mt-4 whitespace-pre-wrap">{selectedItem.content}</p>}
              {selectedItem.tags && (
                <div className="flex flex-wrap gap-1 mt-4">{selectedItem.tags.split(',').map((tag: string) => <span key={tag} className="text-xs bg-[#f5e6d0]/30 text-[#8b6969] px-2 py-0.5 rounded-full">{tag.trim()}</span>)}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AddLibraryModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ title: '', content: '', category: '', tags: '', isPublic: false })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/library', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d0811]/60 backdrop-blur-sm p-4">
      <div className="glass-card rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-[#f0e4d8]">
          <h2 className="text-lg font-semibold text-[#5c1a2a]">Add Library Entry</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-[#8b6969]/60" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-[#5c1a2a]/90 mb-1">Title *</label><input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 border border-[#f0e4d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a017]" /></div>
          <div><label className="block text-sm font-medium text-[#5c1a2a]/90 mb-1">Category *</label><select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border border-[#f0e4d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a017]"><option value="">Select</option>{CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-[#5c1a2a]/90 mb-1">Content</label><textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={5} className="w-full px-3 py-2 border border-[#f0e4d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a017]" /></div>
          <div><label className="block text-sm font-medium text-[#5c1a2a]/90 mb-1">Tags (comma separated)</label><input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="w-full px-3 py-2 border border-[#f0e4d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a017]" placeholder="venue, delhi, premium" /></div>
          <label className="flex items-center gap-2 text-sm text-[#5c1a2a]/90"><input type="checkbox" checked={form.isPublic} onChange={e => setForm({...form, isPublic: e.target.checked})} className="rounded" /> Make visible in Client Portal</label>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#8b6969]">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#8b1a34] text-white text-sm font-medium rounded-xl hover:bg-[#6d1529] disabled:opacity-50">{saving ? 'Saving...' : 'Add Entry'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
