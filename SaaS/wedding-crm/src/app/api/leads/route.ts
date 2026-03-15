import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const source = searchParams.get('source')

  const where: any = {}
  if (status) where.status = status
  if (source) where.source = source
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ]
  }

  const leads = await prisma.lead.findMany({
    where,
    include: { assignedTo: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(leads)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const lead = await prisma.lead.create({
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      source: body.source,
      status: body.status || 'NEW',
      budget: body.budget ? parseFloat(body.budget) : null,
      weddingDate: body.weddingDate ? new Date(body.weddingDate) : null,
      venue: body.venue,
      guestCount: body.guestCount ? parseInt(body.guestCount) : null,
      requirements: body.requirements,
      notes: body.notes,
      priority: body.priority || 'MEDIUM',
      assignedToId: body.assignedToId,
    },
  })
  return NextResponse.json(lead, { status: 201 })
}
