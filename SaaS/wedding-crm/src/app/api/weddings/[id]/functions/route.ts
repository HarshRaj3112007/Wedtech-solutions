import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const fn = await prisma.weddingFunction.create({
    data: {
      weddingId: id,
      name: body.name,
      date: body.date ? new Date(body.date) : null,
      venue: body.venue,
      budget: body.budget ? parseFloat(body.budget) : null,
      guestCount: body.guestCount ? parseInt(body.guestCount) : null,
      notes: body.notes,
    },
  })
  return NextResponse.json(fn, { status: 201 })
}
