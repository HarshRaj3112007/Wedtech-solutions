import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const [totalLeads, activeWeddings, totalVendors, pendingTasks, recentLeads, upcomingWeddings, allLeads] = await Promise.all([
      prisma.lead.count(),
      prisma.wedding.count({ where: { status: { in: ['PLANNING', 'IN_PROGRESS'] } } }),
      prisma.vendor.count({ where: { isActive: true } }),
      prisma.checklistItem.count({ where: { isCompleted: false } }),
      prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.wedding.findMany({ where: { weddingDate: { gte: new Date() } }, orderBy: { weddingDate: 'asc' }, take: 5 }),
      prisma.lead.findMany({ select: { status: true } }),
    ])

    const leadsByStatus: Record<string, number> = {}
    allLeads.forEach(l => { leadsByStatus[l.status] = (leadsByStatus[l.status] || 0) + 1 })

    const payments = await prisma.payment.findMany({ where: { status: 'RECEIVED' } })
    const revenue = payments.reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({ totalLeads, activeWeddings, totalVendors, pendingTasks, recentLeads, upcomingWeddings, leadsByStatus, revenue })
  } catch (error) {
    return NextResponse.json({ totalLeads: 0, activeWeddings: 0, totalVendors: 0, pendingTasks: 0, recentLeads: [], upcomingWeddings: [], leadsByStatus: {}, revenue: 0 })
  }
}
