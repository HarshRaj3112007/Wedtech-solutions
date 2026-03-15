import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  const where: any = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { clientName: { contains: search } },
      { venue: { contains: search } },
      { city: { contains: search } },
    ]
  }

  const weddings = await prisma.wedding.findMany({
    where,
    include: {
      assignedRM: { select: { id: true, name: true } },
      functions: true,
      _count: { select: { vendorAssignments: true, checklists: true } },
    },
    orderBy: { weddingDate: 'asc' },
  })
  return NextResponse.json(weddings)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const wedding = await prisma.wedding.create({
    data: {
      clientName: body.clientName,
      partnerName: body.partnerName,
      weddingDate: new Date(body.weddingDate),
      venue: body.venue,
      city: body.city,
      budget: body.budget ? parseFloat(body.budget) : null,
      guestCount: body.guestCount ? parseInt(body.guestCount) : null,
      status: body.status || 'PLANNING',
      theme: body.theme,
      description: body.description,
      assignedRMId: body.assignedRMId,
    },
  })
  return NextResponse.json(wedding, { status: 201 })
}
