'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface RSVPSettingsProps {
  weddingId: string
  onClose: () => void
  onSaved: () => void
}

export default function RSVPSettings({ weddingId, onClose, onSaved }: RSVPSettingsProps) {
  const [form, setForm] = useState({
    rsvpPlatformUrl: 'http://localhost:3000',
    rsvpWeddingId: '',
    rsvpApiKey: '',
  })
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/weddings/${weddingId}/rsvp/settings`)
      .then(r => r.json())
      .then(data => {
        if (data.rsvpPlatformUrl) setForm(f => ({ ...f, rsvpPlatformUrl: data.rsvpPlatformUrl }))
        if (data.rsvpWeddingId) setForm(f => ({ ...f, rsvpWeddingId: data.rsvpWeddingId }))
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [weddingId])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/weddings/${weddingId}/rsvp/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      onSaved()
      onClose()
    } catch {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    setTestStatus('testing')
    try {
      // Save first so the proxy can use the credentials
      await fetch(`/api/weddings/${weddingId}/rsvp/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      // Then test via the CRM proxy
      const res = await fetch(`/api/weddings/${weddingId}/rsvp/headcounts`)
      setTestStatus(res.ok ? 'success' : 'error')
    } catch {
      setTestStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">RSVP Platform Settings</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Connect this wedding to the RSVP platform to sync guest lists and track RSVPs in real-time.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RSVP Platform URL *</label>
            <input
              value={form.rsvpPlatformUrl}
              onChange={e => setForm({ ...form, rsvpPlatformUrl: e.target.value })}
              placeholder="http://localhost:3000"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RSVP Wedding ID *</label>
            <input
              value={form.rsvpWeddingId}
              onChange={e => setForm({ ...form, rsvpWeddingId: e.target.value })}
              placeholder="cxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-400 mt-1">The wedding ID from the RSVP platform database</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key (Bearer Token) *</label>
            <input
              type="password"
              value={form.rsvpApiKey}
              onChange={e => setForm({ ...form, rsvpApiKey: e.target.value })}
              placeholder="Enter the planner's API key"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-400 mt-1">Found in the RSVP platform planner settings</p>
          </div>

          {/* Test Connection Status */}
          {testStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl text-sm">
              <CheckCircle2 className="w-4 h-4" /> Connection successful
            </div>
          )}
          {testStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4" /> Connection failed. Check your settings.
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={testConnection}
              disabled={testStatus === 'testing' || !form.rsvpPlatformUrl || !form.rsvpWeddingId || !form.rsvpApiKey}
              className="px-4 py-2 text-sm text-purple-600 border border-purple-200 rounded-xl hover:bg-purple-50 disabled:opacity-50 flex items-center gap-1.5"
            >
              {testStatus === 'testing' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Test Connection
            </button>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.rsvpPlatformUrl || !form.rsvpWeddingId || !form.rsvpApiKey}
                className="px-6 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save & Connect'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
