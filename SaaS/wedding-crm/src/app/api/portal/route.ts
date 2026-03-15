import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const accesses = await prisma.clientPortalAccess.findMany({
    include: {
      wedding: { select: { id: true, clientName: true, weddingDate: true, venue: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(accesses)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // First check if user exists with CLIENT role; if not, create one
  let user = await prisma.user.findFirst({
    where: { email: body.clientEmail, role: 'CLIENT' },
  })

  if (!user) {
    const bcrypt = await import('bcryptjs')
    user = await prisma.user.create({
      data: {
        name: body.clientName || 'Client',
        email: body.clientEmail,
        password: await bcrypt.hash('client123', 10),
        role: 'CLIENT',
      },
    })
  }

  const access = await prisma.clientPortalAccess.create({
    data: {
      weddingId: body.weddingId,
      userId: user.id,
      accessToken: crypto.randomUUID(),
      permissions: body.permissions || 'VIEW_TIMELINE,VIEW_CHECKLIST',
    },
  })

  return NextResponse.json(access, { status: 201 })
}
