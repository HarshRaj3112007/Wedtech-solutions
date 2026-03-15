import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, data } = body // type: 'leads' | 'vendors' | 'weddings'

  if (!data || !Array.isArray(data) || data.length === 0) {
    return NextResponse.json({ error: 'No data provided' }, { status: 400 })
  }

  let imported = 0

  try {
    if (type === 'leads') {
      for (const row of data) {
        await prisma.lead.create({
          data: {
            name: row.name || row.Name || '',
            email: row.email || row.Email || null,
            phone: row.phone || row.Phone || null,
            source: row.source || row.Source || null,
            status: row.status || row.Status || 'NEW',
            budget: row.budget || row.Budget ? parseFloat(row.budget || row.Budget) : null,
            venue: row.venue || row.Venue || null,
            priority: row.priority || row.Priority || 'MEDIUM',
          },
        })
        imported++
      }
    } else if (type === 'vendors') {
      for (const row of data) {
        await prisma.vendor.create({
          data: {
            name: row.name || row.Name || '',
            category: (row.category || row.Category || 'OTHER').toUpperCase().replace(/\s/g, '_'),
            email: row.email || row.Email || null,
            phone: row.phone || row.Phone || null,
            city: row.city || row.City || null,
            priceRange: row.priceRange || row['Price Range'] || null,
            rating: row.rating || row.Rating ? parseFloat(row.rating || row.Rating) : null,
          },
        })
        imported++
      }
    } else if (type === 'weddings') {
      for (const row of data) {
        await prisma.wedding.create({
          data: {
            clientName: row.clientName || row['Client Name'] || row.name || row.Name || '',
            partnerName: row.partnerName || row['Partner Name'] || null,
            weddingDate: new Date(row.weddingDate || row['Wedding Date'] || row.date || row.Date || new Date()),
            venue: row.venue || row.Venue || null,
            city: row.city || row.City || null,
            budget: row.budget || row.Budget ? parseFloat(row.budget || row.Budget) : null,
            guestCount: row.guestCount || row['Guest Count'] ? parseInt(row.guestCount || row['Guest Count']) : null,
          },
        })
        imported++
      }
    }

    return NextResponse.json({ success: true, imported })
  } catch (error: any) {
    return NextResponse.json({ error: error.message, imported }, { status: 500 })
  }
}
