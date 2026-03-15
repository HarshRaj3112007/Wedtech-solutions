import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  if (body.toggleItem) {
    const item = await prisma.checklistItem.findUnique({ where: { id: body.toggleItem } })
    if (item) {
      await prisma.checklistItem.update({
        where: { id: body.toggleItem },
        data: { isCompleted: !item.isCompleted, completedAt: item.isCompleted ? null : new Date() },
      })
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Check if it's a template or checklist
  const template = await prisma.sOPTemplate.findUnique({ where: { id } })
  if (template) {
    await prisma.sOPTemplate.update({ where: { id }, data: { isActive: false } })
  } else {
    await prisma.checklist.delete({ where: { id } })
  }
  return NextResponse.json({ success: true })
}
