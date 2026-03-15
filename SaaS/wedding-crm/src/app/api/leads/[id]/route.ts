import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { assignedTo: true, activities: { orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } }, wedding: true },
  })
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(lead)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const lead = await prisma.lead.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      source: body.source,
      status: body.status,
      budget: body.budget ? parseFloat(body.budget) : null,
      weddingDate: body.weddingDate ? new Date(body.weddingDate) : null,
      venue: body.venue,
      guestCount: body.guestCount ? parseInt(body.guestCount) : null,
      requirements: body.requirements,
      notes: body.notes,
      priority: body.priority,
      lostReason: body.lostReason,
      nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : null,
      assignedToId: body.assignedToId,
    },
  })
  return NextResponse.json(lead)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.lead.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
