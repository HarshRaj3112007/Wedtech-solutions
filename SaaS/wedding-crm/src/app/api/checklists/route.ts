import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const templates = await prisma.sOPTemplate.findMany({
    where: { isActive: true },
    include: { items: { orderBy: { orderIndex: 'asc' } }, _count: { select: { checklists: true } } },
    orderBy: { createdAt: 'desc' },
  })
  const checklists = await prisma.checklist.findMany({
    include: { items: true, wedding: { select: { id: true, clientName: true } }, template: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ templates, checklists })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.type === 'template') {
    const template = await prisma.sOPTemplate.create({
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        items: {
          create: (body.items || []).map((item: any, i: number) => ({
            title: item.title,
            description: item.description,
            orderIndex: i,
            daysOffset: item.daysOffset ? parseInt(item.daysOffset) : null,
            category: item.category,
            isMandatory: item.isMandatory || false,
          })),
        },
      },
    })
    return NextResponse.json(template, { status: 201 })
  }

  // Apply template to wedding
  if (body.type === 'apply') {
    const template = await prisma.sOPTemplate.findUnique({
      where: { id: body.templateId },
      include: { items: { orderBy: { orderIndex: 'asc' } } },
    })
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    const wedding = await prisma.wedding.findUnique({ where: { id: body.weddingId } })
    if (!wedding) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

    const checklist = await prisma.checklist.create({
      data: {
        name: `${template.name} - ${wedding.clientName}`,
        weddingId: body.weddingId,
        templateId: body.templateId,
        items: {
          create: template.items.map(item => ({
            title: item.title,
            description: item.description,
            orderIndex: item.orderIndex,
            category: item.category,
            isMandatory: item.isMandatory,
            dueDate: item.daysOffset
              ? new Date(wedding.weddingDate.getTime() + item.daysOffset * 24 * 60 * 60 * 1000)
              : null,
          })),
        },
      },
      include: { items: true },
    })
    return NextResponse.json(checklist, { status: 201 })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
