import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/** GET — Retrieve current RSVP integration settings */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const wedding = await prisma.wedding.findUnique({
    where: { id },
    select: {
      id: true,
      rsvpPlatformUrl: true,
      rsvpWeddingId: true,
      rsvpApiKey: true,
    },
  })

  if (!wedding) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    rsvpPlatformUrl: wedding.rsvpPlatformUrl,
    rsvpWeddingId: wedding.rsvpWeddingId,
    rsvpApiKey: wedding.rsvpApiKey
      ? '••••••••' + (wedding.rsvpApiKey.slice(-4) || '')
      : null,
    isConnected: !!(
      wedding.rsvpPlatformUrl &&
      wedding.rsvpWeddingId &&
      wedding.rsvpApiKey
    ),
  })
}

/** PUT — Update RSVP integration settings and register webhook */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  const updated = await prisma.wedding.update({
    where: { id },
    data: {
      rsvpPlatformUrl: body.rsvpPlatformUrl || null,
      rsvpWeddingId: body.rsvpWeddingId || null,
      rsvpApiKey: body.rsvpApiKey || null,
    },
  })

  // Auto-register webhook URL on the RSVP platform
  if (updated.rsvpPlatformUrl && updated.rsvpWeddingId && updated.rsvpApiKey) {
    try {
      const crmBaseUrl = process.env.CRM_BASE_URL || 'http://localhost:3001'
      const webhookUrl = `${crmBaseUrl}/api/webhooks/rsvp`

      await fetch(
        `${updated.rsvpPlatformUrl}/api/crm/weddings/${updated.rsvpWeddingId}/webhook`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${updated.rsvpApiKey}`,
          },
          body: JSON.stringify({ webhookUrl }),
        }
      )
    } catch (err) {
      console.error('[RSVP Settings] Failed to register webhook:', err)
    }
  }

  return NextResponse.json({ success: true })
}
