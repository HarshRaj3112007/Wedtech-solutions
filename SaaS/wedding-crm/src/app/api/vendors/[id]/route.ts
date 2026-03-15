import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: { assignments: { include: { wedding: { select: { clientName: true, weddingDate: true } }, function: { select: { name: true } } } }, followUps: { orderBy: { followUpDate: 'desc' } } },
  })
  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(vendor)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      name: body.name,
      category: body.category,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city,
      rating: body.rating ? parseFloat(body.rating) : null,
      priceRange: body.priceRange,
      notes: body.notes,
      website: body.website,
      instagram: body.instagram,
    },
  })
  return NextResponse.json(vendor)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.vendor.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}
