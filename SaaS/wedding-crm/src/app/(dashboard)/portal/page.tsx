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
          <h1 className="text-2xl font-bold text-gray-900">Client Portal</h1>
          <p className="text-gray-500 mt-1">Admin-controlled client-facing view with shareable links</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Access Link
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {accesses.map(access => (
            <div key={access.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{access.wedding?.clientName || 'Unknown'}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${access.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {access.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Client: {access.user?.name} ({access.user?.email})</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {access.permissions.split(',').map((p: string) => (
                      <span key={p} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Shield className="w-3 h-3" />{p.replace('VIEW_', '').replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                  {access.lastAccessed && (
                    <p className="text-xs text-gray-400 mt-2">Last accessed: {new Date(access.lastAccessed).toLocaleString('en-IN')}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyLink(access.accessToken)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1.5">
                    {copiedId === access.accessToken ? <><Check className="w-4 h-4 text-green-500" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Link</>}
                  </button>
                  <a href={`/client/${access.accessToken}`} target="_blank" className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4" /> Open
                  </a>
                </div>
              </div>
            </div>
          ))}
          {accesses.length === 0 && (
            <div className="text-center py-16">
              <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No client portal accesses created yet.</p>
              <p className="text-sm text-gray-400 mt-1">Create access links to share wedding progress with clients.</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Create Client Access</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wedding *</label>
            <select value={weddingId} onChange={e => setWeddingId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">Select wedding</option>
              {weddings.map((w: any) => <option key={w.id} value={w.id}>{w.clientName} - {new Date(w.weddingDate).toLocaleDateString('en-IN')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
            <input value={clientName} onChange={e => setClientName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Email *</label>
            <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div className="space-y-2">
              {PERMISSIONS.map(p => (
                <label key={p.value} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={permissions.includes(p.value)} onChange={() => togglePermission(p.value)} className="rounded text-purple-600" />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button onClick={() => weddingId && clientEmail && onCreate({ weddingId, clientName, clientEmail, permissions: permissions.join(',') })}
              disabled={!weddingId || !clientEmail}
              className="px-6 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50">Create Access</button>
          </div>
        </div>
      </div>
    </div>
  )
}
