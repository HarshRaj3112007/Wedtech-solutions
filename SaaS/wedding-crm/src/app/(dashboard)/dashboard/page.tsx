'use client'

import { useState, useEffect } from 'react'
import { Users, Heart, Store, ClipboardCheck, TrendingUp, Calendar, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalLeads: number
  activeWeddings: number
  totalVendors: number
  pendingTasks: number
  recentLeads: any[]
  upcomingWeddings: any[]
  leadsByStatus: Record<string, number>
  revenue: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    )
  }

  const statCards = [
    { title: 'Total Leads', value: stats?.totalLeads || 0, icon: Users, color: 'bg-blue-500', lightColor: 'bg-blue-50', change: '+12%', up: true },
    { title: 'Active Weddings', value: stats?.activeWeddings || 0, icon: Heart, color: 'bg-pink-500', lightColor: 'bg-pink-50', change: '+5%', up: true },
    { title: 'Vendors', value: stats?.totalVendors || 0, icon: Store, color: 'bg-amber-500', lightColor: 'bg-amber-50', change: '+8%', up: true },
    { title: 'Pending Tasks', value: stats?.pendingTasks || 0, icon: ClipboardCheck, color: 'bg-purple-500', lightColor: 'bg-purple-50', change: '-3%', up: false },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here&apos;s your wedding business overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.lightColor} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
              </div>
              <span className={`flex items-center text-xs font-medium ${card.up ? 'text-green-600' : 'text-red-500'}`}>
                {card.change}
                {card.up ? <ArrowUpRight className="w-3 h-3 ml-1" /> : <ArrowDownRight className="w-3 h-3 ml-1" />}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
            <p className="text-sm text-gray-500 mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Pipeline */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Lead Pipeline</h2>
            <Link href="/leads" className="text-sm text-purple-600 hover:text-purple-700 font-medium">View All</Link>
          </div>
          <div className="space-y-3">
            {Object.entries(stats?.leadsByStatus || {}).map(([status, count]) => {
              const colors: Record<string, string> = {
                NEW: 'bg-blue-500', CONTACTED: 'bg-yellow-500', QUALIFIED: 'bg-purple-500',
                PROPOSAL_SENT: 'bg-indigo-500', NEGOTIATION: 'bg-orange-500', WON: 'bg-green-500', LOST: 'bg-red-500'
              }
              const total = Object.values(stats?.leadsByStatus || {}).reduce((a, b) => a + b, 0) || 1
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 w-28">{status.replace('_', ' ')}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${colors[status] || 'bg-gray-400'}`} style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Weddings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Weddings</h2>
            <Link href="/weddings" className="text-sm text-purple-600 hover:text-purple-700 font-medium">View All</Link>
          </div>
          <div className="space-y-4">
            {(stats?.upcomingWeddings || []).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No upcoming weddings</p>
            )}
            {(stats?.upcomingWeddings || []).slice(0, 5).map((wedding: any) => (
              <Link key={wedding.id} href={`/weddings/${wedding.id}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                  {wedding.clientName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{wedding.clientName}</p>
                  <p className="text-xs text-gray-500">{wedding.venue || 'Venue TBD'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-900">{new Date(wedding.weddingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  <p className="text-xs text-gray-400">{wedding.status}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Leads</h2>
            <Link href="/leads" className="text-sm text-purple-600 hover:text-purple-700 font-medium">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Source</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Budget</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(stats?.recentLeads || []).slice(0, 5).map((lead: any) => {
                  const statusColors: Record<string, string> = {
                    NEW: 'bg-blue-100 text-blue-800', CONTACTED: 'bg-yellow-100 text-yellow-800',
                    QUALIFIED: 'bg-purple-100 text-purple-800', PROPOSAL_SENT: 'bg-indigo-100 text-indigo-800',
                    NEGOTIATION: 'bg-orange-100 text-orange-800', WON: 'bg-green-100 text-green-800', LOST: 'bg-red-100 text-red-800'
                  }
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                        <p className="text-xs text-gray-500">{lead.email}</p>
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-600">{lead.source || '-'}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[lead.status] || 'bg-gray-100 text-gray-800'}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-600">
                        {lead.budget ? `₹${(lead.budget / 100000).toFixed(1)}L` : '-'}
                      </td>
                      <td className="py-3 text-sm text-gray-500">{new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
