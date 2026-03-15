import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const wedding = await prisma.wedding.findUnique({
    where: { id },
    include: {
      assignedRM: true,
      functions: { include: { tasks: true, vendorAssignments: { include: { vendor: true } } } },
      vendorAssignments: { include: { vendor: true, function: true } },
      checklists: { include: { items: true, template: true } },
      payments: { orderBy: { createdAt: 'desc' } },
      notes: { orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } },
      activities: { orderBy: { createdAt: 'desc' }, take: 20, include: { user: { select: { name: true } } } },
    },
  })
  if (!wedding) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(wedding)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const wedding = await prisma.wedding.update({
    where: { id },
    data: {
      clientName: body.clientName,
      partnerName: body.partnerName,
      weddingDate: body.weddingDate ? new Date(body.weddingDate) : undefined,
      venue: body.venue,
      city: body.city,
      budget: body.budget ? parseFloat(body.budget) : null,
      guestCount: body.guestCount ? parseInt(body.guestCount) : null,
      status: body.status,
      theme: body.theme,
      description: body.description,
    },
  })
  return NextResponse.json(wedding)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.wedding.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
