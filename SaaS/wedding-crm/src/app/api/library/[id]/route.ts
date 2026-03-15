import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const item = await prisma.dataLibraryItem.update({
    where: { id },
    data: {
      title: body.title,
      content: body.content,
      category: body.category,
      tags: body.tags,
      isPublic: body.isPublic,
    },
  })
  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.dataLibraryItem.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
