import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const city = searchParams.get('city')

  const where: any = { isActive: true }
  if (category) where.category = category
  if (city) where.city = { contains: city }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { city: { contains: search } },
    ]
  }

  const vendors = await prisma.vendor.findMany({
    where,
    include: { _count: { select: { assignments: true } }, followUps: { where: { isCompleted: false }, orderBy: { followUpDate: 'asc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(vendors)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const vendor = await prisma.vendor.create({
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
  return NextResponse.json(vendor, { status: 201 })
}
