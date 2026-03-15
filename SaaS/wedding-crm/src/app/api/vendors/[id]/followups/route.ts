import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const followUp = await prisma.vendorFollowUp.create({
    data: {
      vendorId: id,
      type: body.type,
      notes: body.notes,
      followUpDate: new Date(body.followUpDate),
    },
  })
  return NextResponse.json(followUp, { status: 201 })
}
