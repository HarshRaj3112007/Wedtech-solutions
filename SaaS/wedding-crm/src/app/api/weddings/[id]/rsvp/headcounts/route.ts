import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/weddings/:id/rsvp/headcounts
 * Proxies to RSVP platform's per-event headcount API.
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
    const rsvpResponse = await fetch(
      `${wedding.rsvpPlatformUrl}/api/crm/weddings/${wedding.rsvpWeddingId}/headcounts`,
      {
        headers: { Authorization: `Bearer ${wedding.rsvpApiKey}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!rsvpResponse.ok) {
      return NextResponse.json(
        { error: `RSVP platform returned ${rsvpResponse.status}` },
        { status: 502 }
      )
    }

    return NextResponse.json(await rsvpResponse.json())
  } catch (error) {
    console.error('[RSVP Proxy] Error fetching headcounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch headcounts' },
      { status: 502 }
    )
  }
}
