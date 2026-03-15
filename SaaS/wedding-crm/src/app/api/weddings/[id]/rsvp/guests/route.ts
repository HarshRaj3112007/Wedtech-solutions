import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/weddings/:id/rsvp/guests
 * Proxies to RSVP platform's guest list API. Falls back to local cache on failure.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const wedding = await prisma.wedding.findUnique({
    where: { id },
    select: {
      rsvpPlatformUrl: true,
      rsvpWeddingId: true,
      rsvpApiKey: true,
    },
  })

  if (
    !wedding?.rsvpPlatformUrl ||
    !wedding?.rsvpWeddingId ||
    !wedding?.rsvpApiKey
  ) {
    return NextResponse.json(
      { error: 'RSVP integration not configured' },
      { status: 400 }
    )
  }

  try {
    const page = req.nextUrl.searchParams.get('page') || '1'
    const rsvpResponse = await fetch(
      `${wedding.rsvpPlatformUrl}/api/crm/weddings/${wedding.rsvpWeddingId}/guests?page=${page}&pageSize=100`,
      {
        headers: { Authorization: `Bearer ${wedding.rsvpApiKey}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!rsvpResponse.ok) {
      throw new Error(`RSVP platform returned ${rsvpResponse.status}`)
    }

    return NextResponse.json(await rsvpResponse.json())
  } catch (error) {
    console.error('[RSVP Proxy] Error fetching guests:', error)

    // Fall back to cached data
    const cached = await prisma.rSVPGuest.findMany({
      where: { weddingId: id },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: cached,
      meta: { source: 'cache', warning: 'Live fetch failed, showing cached data' },
    })
  }
}
