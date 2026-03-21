'use client'

import { useState, useEffect } from 'react'
import { Plus, Globe, Copy, ExternalLink, X, Check, Trash2, Shield } from 'lucide-react'

const PERMISSIONS = [
  { value: 'VIEW_TIMELINE', label: 'View Timeline & Functions' },
  { value: 'VIEW_CHECKLIST', label: 'View Checklists' },
  { value: 'VIEW_VENDORS', label: 'View Vendors' },
  { value: 'VIEW_PAYMENTS', label: 'View Payments' },
]

export default function PortalPage() {
  const [accesses, setAccesses] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [weddings, setWeddings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchData = () => {
    setLoading(true)
    fetch('/api/portal').then(r => r.json()).then(d => { setAccesses(d); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => {
    fetch('/api/weddings').then(r => r.json()).then(setWeddings)
    setShowCreate(true)
  }

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/client/${token}`)
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const createAccess = async (data: any) => {
    await fetch('/api/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setShowCreate(false)
    fetchData()
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#5c1a2a]">Client Portal</h1>
          <p className="text-[#8b6969] mt-1">Admin-controlled client-facing view with shareable links</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2.5 bg-[#8b1a34] text-white rounded-xl text-sm font-medium hover:bg-[#6d1529] flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Access Link
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#8b1a34]/20 border-t-[#8b1a34] rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {accesses.map(access => (
            <div key={access.id} className="glass-card rounded-xl p-5 border border-[#f0e4d8] shadow-wedding">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#5c1a2a]">{access.wedding?.clientName || 'Unknown'}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${access.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {access.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-[#8b6969] mt-1">Client: {access.user?.name} ({access.user?.email})</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {access.permissions.split(',').map((p: string) => (
                      <span key={p} className="text-xs bg-[#8b1a34]/10 text-[#8b1a34] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Shield className="w-3 h-3" />{p.replace('VIEW_', '').replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                  {access.lastAccessed && (
                    <p className="text-xs text-[#8b6969]/60 mt-2">Last accessed: {new Date(access.lastAccessed).toLocaleString('en-IN')}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyLink(access.accessToken)} className="px-3 py-2 border border-[#f0e4d8] rounded-lg text-sm hover:bg-[#f5e6d0]/30 flex items-center gap-1.5">
                    {copiedId === access.accessToken ? <><Check className="w-4 h-4 text-[#d4a017]" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Link</>}
                  </button>
                  <a href={`/client/${access.accessToken}`} target="_blank" className="px-3 py-2 border border-[#f0e4d8] rounded-lg text-sm hover:bg-[#f5e6d0]/30 flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4" /> Open
                  </a>
                </div>
              </div>
            </div>
          ))}
          {accesses.length === 0 && (
            <div className="text-center py-16">
              <Globe className="w-12 h-12 text-[#8b6969]/60 mx-auto mb-3" />
              <p className="text-[#8b6969]">No client portal accesses created yet.</p>
              <p className="text-sm text-[#8b6969]/60 mt-1">Create access links to share wedding progress with clients.</p>
            </div>
          )}
        </div>
      )}

      {showCreate && <CreateAccessModal weddings={weddings} onClose={() => setShowCreate(false)} onCreate={createAccess} />}
    </div>
  )
}

function CreateAccessModal({ weddings, onClose, onCreate }: { weddings: any[]; onClose: () => void; onCreate: (data: any) => void }) {
  const [weddingId, setWeddingId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [permissions, setPermissions] = useState(['VIEW_TIMELINE', 'VIEW_CHECKLIST'])

  const togglePermission = (perm: string) => {
    setPermissions(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d0811]/60 backdrop-blur-sm p-4">
      <div className="glass-card rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[#f0e4d8]">
          <h2 className="text-lg font-semibold text-[#5c1a2a]">Create Client Access</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-[#8b6969]/60" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#5c1a2a]/90 mb-1">Wedding *</label>
            <select value={weddingId} onChange={e => setWeddingId(e.target.value)} className="w-full px-3 py-2 border border-[#f0e4d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a017]">
              <option value="">Select wedding</option>
              {weddings.map((w: any) => <option key={w.id} value={w.id}>{w.clientName} - {new Date(w.weddingDate).toLocaleDateString('en-IN')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5c1a2a]/90 mb-1">Client Name *</label>
            <input value={clientName} onChange={e => setClientName(e.target.value)} className="w-full px-3 py-2 border border-[#f0e4d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a017]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5c1a2a]/90 mb-1">Client Email *</label>
            <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="w-full px-3 py-2 border border-[#f0e4d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a017]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5c1a2a]/90 mb-2">Permissions</label>
            <div className="space-y-2">
              {PERMISSIONS.map(p => (
                <label key={p.value} className="flex items-center gap-2 text-sm text-[#5c1a2a]/90">
                  <input type="checkbox" checked={permissions.includes(p.value)} onChange={() => togglePermission(p.value)} className="rounded text-[#8b1a34]" />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-[#8b6969]">Cancel</button>
            <button onClick={() => weddingId && clientEmail && onCreate({ weddingId, clientName, clientEmail, permissions: permissions.join(',') })}
              disabled={!weddingId || !clientEmail}
              className="px-6 py-2.5 bg-[#8b1a34] text-white text-sm font-medium rounded-xl hover:bg-[#6d1529] disabled:opacity-50">Create Access</button>
          </div>
        </div>
      </div>
    </div>
  )
}
