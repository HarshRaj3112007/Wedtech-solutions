import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const lead = await prisma.lead.findUnique({ where: { id: body.leadId } })
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const wedding = await prisma.wedding.create({
    data: {
      clientName: lead.name,
      weddingDate: lead.weddingDate || new Date(),
      venue: lead.venue,
      budget: lead.budget,
      guestCount: lead.guestCount,
      leadId: lead.id,
      assignedRMId: lead.assignedToId,
    },
  })

  await prisma.lead.update({ where: { id: lead.id }, data: { status: 'WON' } })
  return NextResponse.json(wedding, { status: 201 })
}
