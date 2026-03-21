'use client'

import { useState, useEffect, use } from 'react'
import { Calendar, MapPin, Users, DollarSign, Plus, ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, ArrowLeft, X, Settings2, Download, Link2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import RSVPSettings from '@/components/RSVPSettings'

export default function WeddingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [wedding, setWedding] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('functions')
  const [showAddFunction, setShowAddFunction] = useState(false)

  // RSVP integration state
  const [headcounts, setHeadcounts] = useState<any[]>([])
  const [rsvpGuests, setRsvpGuests] = useState<any[]>([])
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [rsvpSettings, setRsvpSettings] = useState<any>(null)
  const [showRsvpSettings, setShowRsvpSettings] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const fetchWedding = () => {
    fetch(`/api/weddings/${id}`).then(r => r.json()).then(d => { setWedding(d); setLoading(false) })
  }

  useEffect(() => { fetchWedding() }, [id])

  const fetchRSVPData = async () => {
    setRsvpLoading(true)
    try {
      const [hRes, gRes, sRes] = await Promise.all([
        fetch(`/api/weddings/${id}/rsvp/headcounts`),
        fetch(`/api/weddings/${id}/rsvp/guests`),
        fetch(`/api/weddings/${id}/rsvp/settings`),
      ])
      if (hRes.ok) {
        const hData = await hRes.json()
        setHeadcounts(hData.data || [])
      }
      if (gRes.ok) {
        const gData = await gRes.json()
        setRsvpGuests(gData.data || [])
      }
      if (sRes.ok) {
        setRsvpSettings(await sRes.json())
      }
    } catch (err) {
      console.error('Failed to fetch RSVP data:', err)
    }
    setRsvpLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'rsvp') fetchRSVPData()
  }, [activeTab])

  const handleFullSync = async () => {
    setSyncing(true)
    try {
      await fetch(`/api/weddings/${id}/rsvp/full-sync`, { method: 'POST' })
      await fetchRSVPData()
    } catch (err) {
      console.error('Sync failed:', err)
    }
    setSyncing(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#f0e4d8] border-t-[#8b1a34] rounded-full animate-spin" /></div>
  if (!wedding) return <div className="text-center py-16"><p className="text-[#8b6969]">Wedding not found</p></div>

  const tabs = [
    { id: 'functions', label: 'Functions' },
    { id: 'vendors', label: 'Vendors' },
    { id: 'checklists', label: 'Checklists' },
    { id: 'payments', label: 'Payments' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'rsvp', label: 'RSVP & Guests' },
  ]

  const daysUntil = Math.ceil((new Date(wedding.weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  const addFunction = async (data: any) => {
    await fetch(`/api/weddings/${id}/functions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    setShowAddFunction(false)
    fetchWedding()
  }

  const rsvpTotals = headcounts.reduce(
    (acc: any, h: any) => ({
      confirmed: acc.confirmed + (h.confirmed || 0),
      totalPax: acc.totalPax + (h.totalPax || 0),
      pending: acc.pending + (h.pending || 0),
      declined: acc.declined + (h.declined || 0),
    }),
    { confirmed: 0, totalPax: 0, pending: 0, declined: 0 }
  )

  return (
    <div>
      <Link href="/weddings" className="inline-flex items-center gap-2 text-sm text-[#8b6969] hover:text-[#5c1a2a]/90 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Weddings
      </Link>

      {/* Header Card */}
      <div className="bg-gradient-to-r from-[#8b1a34] to-[#d43d5e] rounded-2xl p-6 text-white mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">{wedding.clientName}{wedding.partnerName ? ` & ${wedding.partnerName}` : ''}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-[#f5e6d0]/80">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(wedding.weddingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {wedding.venue && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{wedding.venue}</span>}
              {wedding.guestCount && <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{wedding.guestCount} guests</span>}
              {wedding.budget && <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" />₹{(wedding.budget / 100000).toFixed(1)}L</span>}
            </div>
          </div>
          <div className="text-right">
            {daysUntil > 0 ? (
              <div><span className="text-4xl font-bold">{daysUntil}</span><p className="text-sm text-[#f5e6d0]/60">days to go</p></div>
            ) : (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">Completed</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card rounded-xl p-4 border border-[#f0e4d8]">
          <p className="text-2xl font-bold text-[#5c1a2a]">{wedding.functions?.length || 0}</p>
          <p className="text-sm text-[#8b6969]">Functions</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-[#f0e4d8]">
          <p className="text-2xl font-bold text-[#5c1a2a]">{wedding.vendorAssignments?.length || 0}</p>
          <p className="text-sm text-[#8b6969]">Vendors</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-[#f0e4d8]">
          <p className="text-2xl font-bold text-[#5c1a2a]">{wedding.checklists?.reduce((sum: number, c: any) => sum + c.items?.length, 0) || 0}</p>
          <p className="text-sm text-[#8b6969]">Tasks</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-[#f0e4d8]">
          <p className="text-2xl font-bold text-[#5c1a2a]">{wedding.payments?.length || 0}</p>
          <p className="text-sm text-[#8b6969]">Payments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#f0e4d8] mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap rounded-t-lg transition ${
                activeTab === tab.id ? 'bg-[#8b1a34] text-[#f5e6d0] shadow-wedding' : 'text-[#5c1a2a] hover:bg-[#f5e6d0]/50'
              }`}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* Functions Tab */}
      {activeTab === 'functions' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#5c1a2a]">Wedding Functions</h2>
            <button onClick={() => setShowAddFunction(true)} className="px-3 py-2 bg-[#8b1a34] text-white text-sm rounded-xl hover:bg-[#6d1529] flex items-center gap-1"><Plus className="w-4 h-4" /> Add Function</button>
          </div>
          <div className="grid gap-4">
            {(wedding.functions || []).map((fn: any) => (
              <div key={fn.id} className="glass-card rounded-xl p-5 border border-[#f0e4d8]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-[#5c1a2a]">{fn.name}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    fn.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    fn.status === 'CONFIRMED' ? 'bg-[#d4a017]/10 text-[#b8860b]' :
                    fn.status === 'IN_PROGRESS' ? 'bg-[#f5c518]/10 text-[#b8860b]' : 'bg-[#f5e6d0]/30 text-[#8b6969]'
                  }`}>{fn.status}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-[#8b6969]">
                  {fn.date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(fn.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                  {fn.venue && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{fn.venue}</span>}
                  {fn.budget && <span>₹{(fn.budget / 100000).toFixed(1)}L</span>}
                  <span>{fn.tasks?.length || 0} tasks</span>
                  <span>{fn.vendorAssignments?.length || 0} vendors</span>
                </div>
              </div>
            ))}
            {(wedding.functions || []).length === 0 && <p className="text-center text-[#8b6969]/60 py-8">No functions added yet</p>}
          </div>
          {showAddFunction && <AddFunctionModal onClose={() => setShowAddFunction(false)} onSubmit={addFunction} />}
        </div>
      )}

      {/* Vendors Tab */}
      {activeTab === 'vendors' && (
        <div className="glass-card rounded-xl border border-[#f0e4d8] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#faf8f5]"><tr className="text-left text-xs font-medium text-[#8b6969] uppercase">
              <th className="px-6 py-3">Vendor</th><th className="px-6 py-3">Category</th><th className="px-6 py-3">Function</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Price</th>
            </tr></thead>
            <tbody className="divide-y divide-[#f0e4d8]">
              {(wedding.vendorAssignments || []).map((va: any) => (
                <tr key={va.id}><td className="px-6 py-3 text-sm font-medium text-[#5c1a2a]">{va.vendor?.name}</td><td className="px-6 py-3 text-sm text-[#8b6969]">{va.vendor?.category}</td><td className="px-6 py-3 text-sm text-[#8b6969]">{va.function?.name || '-'}</td><td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${va.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-[#f5c518]/10 text-[#b8860b]'}`}>{va.status}</span></td><td className="px-6 py-3 text-sm">{va.agreedPrice ? `₹${(va.agreedPrice / 1000).toFixed(0)}K` : '-'}</td></tr>
              ))}
            </tbody>
          </table>
          {(wedding.vendorAssignments || []).length === 0 && <p className="text-center text-[#8b6969]/60 py-8">No vendors assigned</p>}
        </div>
      )}

      {/* Checklists Tab */}
      {activeTab === 'checklists' && (
        <div className="space-y-4">
          {(wedding.checklists || []).map((cl: any) => (
            <div key={cl.id} className="glass-card rounded-xl p-5 border border-[#f0e4d8]">
              <h3 className="font-semibold text-[#5c1a2a] mb-3">{cl.name}</h3>
              <div className="space-y-2">
                {(cl.items || []).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-[#8b6969]/40" />}
                    <span className={`text-sm ${item.isCompleted ? 'text-[#8b6969]/60 line-through' : 'text-[#5c1a2a]/90'}`}>{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(wedding.checklists || []).length === 0 && <p className="text-center text-[#8b6969]/60 py-8">No checklists yet. Apply an SOP template from the Checklists module.</p>}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="glass-card rounded-xl border border-[#f0e4d8] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#faf8f5]"><tr className="text-left text-xs font-medium text-[#8b6969] uppercase">
              <th className="px-6 py-3">Amount</th><th className="px-6 py-3">Type</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Due Date</th>
            </tr></thead>
            <tbody className="divide-y divide-[#f0e4d8]">
              {(wedding.payments || []).map((p: any) => (
                <tr key={p.id}><td className="px-6 py-3 text-sm font-medium text-[#5c1a2a]">₹{p.amount.toLocaleString('en-IN')}</td><td className="px-6 py-3 text-sm text-[#8b6969]">{p.type}</td><td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : p.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-[#f5c518]/10 text-[#b8860b]'}`}>{p.status}</span></td><td className="px-6 py-3 text-sm text-[#8b6969]">{p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-IN') : '-'}</td></tr>
              ))}
            </tbody>
          </table>
          {(wedding.payments || []).length === 0 && <p className="text-center text-[#8b6969]/60 py-8">No payments recorded</p>}
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          {(wedding.activities || []).map((a: any) => (
            <div key={a.id} className="flex gap-4">
              <div className="w-10 h-10 bg-[#8b1a34]/10 rounded-xl flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5 text-[#8b1a34]" /></div>
              <div>
                <p className="text-sm font-medium text-[#5c1a2a]">{a.title}</p>
                {a.description && <p className="text-sm text-[#8b6969]">{a.description}</p>}
                <p className="text-xs text-[#8b6969]/60 mt-1">{new Date(a.createdAt).toLocaleString('en-IN')} by {a.user?.name}</p>
              </div>
            </div>
          ))}
          {(wedding.activities || []).length === 0 && <p className="text-center text-[#8b6969]/60 py-8">No activity recorded</p>}
        </div>
      )}

      {/* RSVP & Guests Tab */}
      {activeTab === 'rsvp' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#5c1a2a]">RSVP & Guest Tracking</h2>
            <div className="flex gap-2">
              {rsvpSettings?.isConnected && (
                <button
                  onClick={handleFullSync}
                  disabled={syncing}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {syncing ? 'Syncing...' : 'Sync from RSVP'}
                </button>
              )}
              <button
                onClick={() => setShowRsvpSettings(true)}
                className="px-3 py-2 bg-[#f5e6d0]/30 text-[#5c1a2a]/90 text-sm rounded-xl hover:bg-[#f5e6d0]/50 flex items-center gap-1.5"
              >
                <Settings2 className="w-4 h-4" /> Settings
              </button>
            </div>
          </div>

          {!rsvpSettings?.isConnected ? (
            <div className="text-center py-16 glass-card rounded-xl border border-[#f0e4d8]">
              <Link2 className="w-12 h-12 text-[#8b6969]/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#5c1a2a]/90 mb-2">RSVP Platform Not Connected</h3>
              <p className="text-[#8b6969]/60 mb-6 text-sm max-w-md mx-auto">
                Connect this wedding to the RSVP platform to view live guest RSVPs, headcounts, and dietary preferences.
              </p>
              <button
                onClick={() => setShowRsvpSettings(true)}
                className="px-5 py-2.5 bg-[#8b1a34] text-white text-sm font-medium rounded-xl hover:bg-[#6d1529]"
              >
                Connect RSVP Platform
              </button>
            </div>
          ) : rsvpLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-[#f0e4d8] border-t-[#8b1a34] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* RSVP Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="glass-card rounded-xl p-4 border border-[#f0e4d8]">
                  <p className="text-2xl font-bold text-green-600">{rsvpTotals.confirmed}</p>
                  <p className="text-sm text-[#8b6969]">Confirmed</p>
                </div>
                <div className="glass-card rounded-xl p-4 border border-[#f0e4d8]">
                  <p className="text-2xl font-bold text-[#5c1a2a]">{rsvpTotals.totalPax}</p>
                  <p className="text-sm text-[#8b6969]">Total PAX</p>
                </div>
                <div className="glass-card rounded-xl p-4 border border-[#f0e4d8]">
                  <p className="text-2xl font-bold text-yellow-600">{rsvpTotals.pending}</p>
                  <p className="text-sm text-[#8b6969]">Pending</p>
                </div>
                <div className="glass-card rounded-xl p-4 border border-[#f0e4d8]">
                  <p className="text-2xl font-bold text-red-500">{rsvpTotals.declined}</p>
                  <p className="text-sm text-[#8b6969]">Declined</p>
                </div>
              </div>

              {/* Per-Event Headcount Table */}
              {headcounts.length > 0 && (
                <div className="glass-card rounded-xl border border-[#f0e4d8] overflow-hidden mb-6">
                  <div className="px-6 py-4 border-b border-[#f0e4d8]">
                    <h3 className="font-semibold text-[#5c1a2a]">Per-Event Headcounts</h3>
                  </div>
                  <table className="w-full">
                    <thead className="bg-[#faf8f5]">
                      <tr className="text-left text-xs font-medium text-[#8b6969] uppercase">
                        <th className="px-6 py-3">Event</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Confirmed</th>
                        <th className="px-6 py-3">Plus Ones</th>
                        <th className="px-6 py-3">Children</th>
                        <th className="px-6 py-3">Total PAX</th>
                        <th className="px-6 py-3">Pending</th>
                        <th className="px-6 py-3">Declined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0e4d8]">
                      {headcounts.map((h: any) => (
                        <tr key={h.eventId}>
                          <td className="px-6 py-3 text-sm font-medium text-[#5c1a2a]">{h.eventName}</td>
                          <td className="px-6 py-3 text-sm text-[#8b6969]">
                            {h.eventDate ? new Date(h.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}
                          </td>
                          <td className="px-6 py-3 text-sm text-green-600 font-medium">{h.confirmed}</td>
                          <td className="px-6 py-3 text-sm text-[#8b6969]">{h.plusOnes}</td>
                          <td className="px-6 py-3 text-sm text-[#8b6969]">{h.children}</td>
                          <td className="px-6 py-3 text-sm font-bold text-[#5c1a2a]">{h.totalPax}</td>
                          <td className="px-6 py-3 text-sm text-yellow-600">{h.pending}</td>
                          <td className="px-6 py-3 text-sm text-red-500">{h.declined}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Guest List */}
              <div className="glass-card rounded-xl border border-[#f0e4d8] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#f0e4d8] flex items-center justify-between">
                  <h3 className="font-semibold text-[#5c1a2a]">Guest List</h3>
                  <span className="text-sm text-[#8b6969]/60">{rsvpGuests.length} guests</span>
                </div>
                {rsvpGuests.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-[#faf8f5]">
                      <tr className="text-left text-xs font-medium text-[#8b6969] uppercase">
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Phone</th>
                        <th className="px-6 py-3">Side</th>
                        <th className="px-6 py-3">Group</th>
                        <th className="px-6 py-3">Dietary</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0e4d8]">
                      {rsvpGuests.map((g: any) => {
                        const invites = g.eventInvites || []
                        const hasAttending = invites.some((i: any) => i.rsvpStatus === 'ATTENDING')
                        const allDeclined = invites.length > 0 && invites.every((i: any) => i.rsvpStatus === 'DECLINED')
                        const status = g.overallStatus || (hasAttending ? 'ATTENDING' : allDeclined ? 'DECLINED' : 'PENDING')

                        return (
                          <tr key={g.id || g.rsvpGuestId}>
                            <td className="px-6 py-3 text-sm font-medium text-[#5c1a2a]">
                              {g.name}
                              {g.isVip && <span className="ml-1.5 px-1.5 py-0.5 bg-[#f5c518]/10 text-[#b8860b] text-xs rounded-full font-medium">VIP</span>}
                            </td>
                            <td className="px-6 py-3 text-sm text-[#8b6969]">{g.phone}</td>
                            <td className="px-6 py-3 text-sm text-[#8b6969]">{g.relationshipSide || g.side || '-'}</td>
                            <td className="px-6 py-3 text-sm text-[#8b6969]">{g.groupTag || '-'}</td>
                            <td className="px-6 py-3 text-sm text-[#8b6969]">{g.dietaryPref || '-'}</td>
                            <td className="px-6 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                status === 'ATTENDING' ? 'bg-green-100 text-green-700' :
                                status === 'DECLINED' ? 'bg-red-100 text-red-700' :
                                'bg-[#f5c518]/10 text-[#b8860b]'
                              }`}>{status}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center text-[#8b6969]/60 py-8">No guests synced yet. Click &quot;Sync from RSVP&quot; to pull the guest list.</p>
                )}
              </div>
            </>
          )}

          {showRsvpSettings && (
            <RSVPSettings
              weddingId={id}
              onClose={() => setShowRsvpSettings(false)}
              onSaved={fetchRSVPData}
            />
          )}
        </div>
      )}
    </div>
  )
}

function AddFunctionModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({ name: '', date: '', venue: '', budget: '', guestCount: '', notes: '' })
  const weddingFunctions = ['Mehendi', 'Sangeet', 'Haldi', 'Wedding Ceremony', 'Reception', 'Cocktail Party', 'Engagement', 'Ring Ceremony', 'Welcome Dinner']
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d0811]/60 backdrop-blur-sm p-4">
      <div className="glass-card rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[#f0e4d8]">
          <h2 className="text-lg font-semibold text-[#5c1a2a]">Add Function</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-[#8b6969]/60" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#5c1a2a]/90 mb-1">Function Name *</label>
            <select value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-[#f0e4d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a017]">
              <option value="">Select or type</option>
              {weddingFunctions.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-[#5c1a2a]/90 mb-1">Date</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2 border border-[#f0e4d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a017]" /></div>
            <div><label className="block text-sm font-medium text-[#5c1a2a]/90 mb-1">Venue</label><input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} className="w-full px-3 py-2 border border-[#f0e4d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a017]" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-[#8b6969] hover:text-[#5c1a2a]">Cancel</button>
            <button onClick={() => onSubmit(form)} className="px-6 py-2.5 bg-[#8b1a34] text-white text-sm font-medium rounded-xl hover:bg-[#6d1529]">Add</button>
          </div>
        </div>
      </div>
    </div>
  )
}
