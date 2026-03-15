import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const access = await prisma.clientPortalAccess.findUnique({
    where: { accessToken: token },
    include: {
      wedding: {
        include: {
          functions: { include: { tasks: true } },
          checklists: { include: { items: true } },
          vendorAssignments: { include: { vendor: { select: { name: true, category: true, phone: true } } } },
          payments: true,
        },
      },
    },
  })

  if (!access || !access.isActive) {
    return NextResponse.json({ error: 'Invalid or expired access link' }, { status: 404 })
  }

  // Update last accessed
  await prisma.clientPortalAccess.update({
    where: { id: access.id },
    data: { lastAccessed: new Date() },
  })

  const permissions = access.permissions.split(',')

  // Filter data based on permissions
  const result: any = {
    wedding: {
      clientName: access.wedding.clientName,
      weddingDate: access.wedding.weddingDate,
      venue: access.wedding.venue,
      status: access.wedding.status,
    },
    permissions,
  }

  if (permissions.includes('VIEW_TIMELINE')) {
    result.functions = access.wedding.functions
  }
  if (permissions.includes('VIEW_CHECKLIST')) {
    result.checklists = access.wedding.checklists
  }
  if (permissions.includes('VIEW_VENDORS')) {
    result.vendors = access.wedding.vendorAssignments
  }
  if (permissions.includes('VIEW_PAYMENTS')) {
    result.payments = access.wedding.payments
  }

  return NextResponse.json(result)
}
