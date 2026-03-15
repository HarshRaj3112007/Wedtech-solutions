'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, LayoutGrid, List, Phone, Mail, Calendar, ChevronRight, X, Upload } from 'lucide-react'
import Link from 'next/link'

const STATUSES = [
  { value: 'NEW', label: 'New', color: 'bg-blue-500', lightColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'CONTACTED', label: 'Contacted', color: 'bg-yellow-500', lightColor: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'QUALIFIED', label: 'Qualified', color: 'bg-purple-500', lightColor: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'bg-indigo-500', lightColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'NEGOTIATION', label: 'Negotiation', color: 'bg-orange-500', lightColor: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'WON', label: 'Won', color: 'bg-green-500', lightColor: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'LOST', label: 'Lost', color: 'bg-red-500', lightColor: 'bg-red-50 text-red-700 border-red-200' },
]

const SOURCES = ['Website', 'Instagram', 'Referral', 'Wedding Fair', 'Google', 'Facebook', 'Walk-in']

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchLeads = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    fetch(`/api/leads?${params}`).then(r => r.json()).then(d => { setLeads(d); setLoading(false) })
  }

  useEffect(() => { fetchLeads() }, [search])

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchLeads()
  }

  const convertToWedding = async (leadId: string) => {
    await fetch('/api/leads/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId }),
    })
    fetchLeads()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads & Pipeline</h1>
          <p className="text-gray-500 mt-1">Manage your wedding inquiries from first contact to signed contract</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/leads/import" className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2">
            <Upload className="w-4 h-4" /> Import
          </Link>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('kanban')} className={`p-2.5 rounded-lg ${view === 'kanban' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:bg-gray-100'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')} className={`p-2.5 rounded-lg ${view === 'list' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:bg-gray-100'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map(status => {
            const statusLeads = leads.filter(l => l.status === status.value)
            return (
              <div key={status.value} className="flex-shrink-0 w-72">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${status.color}`} />
                  <h3 className="text-sm font-semibold text-gray-700">{status.label}</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{statusLeads.length}</span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {statusLeads.map(lead => (
                    <div key={lead.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">{lead.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          lead.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                          lead.priority === 'URGENT' ? 'bg-red-200 text-red-800' :
                          lead.priority === 'LOW' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'
                        }`}>{lead.priority}</span>
                      </div>
                      {lead.budget && <p className="text-xs text-gray-500 mb-1">Budget: ₹{(lead.budget / 100000).toFixed(1)}L</p>}
                      {lead.source && <p className="text-xs text-gray-400 mb-2">via {lead.source}</p>}
                      <div className="flex items-center gap-2 mt-3">
                        {lead.phone && <a href={`tel:${lead.phone}`} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Phone className="w-3 h-3" /></a>}
                        {lead.email && <a href={`mailto:${lead.email}`} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Mail className="w-3 h-3" /></a>}
                        {status.value === 'NEGOTIATION' && (
                          <button onClick={() => convertToWedding(lead.id)} className="ml-auto text-xs text-green-600 font-medium hover:underline">Convert</button>
                        )}
                        {status.value !== 'WON' && status.value !== 'LOST' && (
                          <select
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                            defaultValue=""
                            className="ml-auto text-xs border border-gray-200 rounded-lg px-1 py-0.5"
                          >
                            <option value="" disabled>Move to...</option>
                            {STATUSES.filter(s => s.value !== status.value).map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Source</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Budget</th>
                  <th className="px-6 py-3">Priority</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map(lead => {
                  const statusObj = STATUSES.find(s => s.value === lead.status)
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                        <p className="text-xs text-gray-500">{lead.venue || 'No venue'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{lead.email || '-'}</p>
                        <p className="text-xs text-gray-400">{lead.phone || '-'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{lead.source || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusObj?.lightColor}`}>{statusObj?.label}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{lead.budget ? `₹${(lead.budget / 100000).toFixed(1)}L` : '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium ${
                          lead.priority === 'HIGH' ? 'text-red-600' : lead.priority === 'URGENT' ? 'text-red-700' :
                          lead.priority === 'LOW' ? 'text-gray-400' : 'text-yellow-600'
                        }`}>{lead.priority}</span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          defaultValue=""
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                        >
                          <option value="" disabled>Move to...</option>
                          {STATUSES.filter(s => s.value !== lead.status).map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && <AddLeadModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchLeads() }} />}
    </div>
  )
}

function AddLeadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', source: '', budget: '', weddingDate: '', venue: '', guestCount: '', requirements: '', priority: 'MEDIUM' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Add New Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Select source</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget (₹)</label>
              <input type="number" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wedding Date</label>
              <input type="date" value={form.weddingDate} onChange={e => setForm({...form, weddingDate: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
              <input type="number" value={form.guestCount} onChange={e => setForm({...form, guestCount: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
              <textarea value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
