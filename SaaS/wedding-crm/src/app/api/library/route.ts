import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  const where: any = {}
  if (category) where.category = category
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { tags: { contains: search } },
      { content: { contains: search } },
    ]
  }

  const items = await prisma.dataLibraryItem.findMany({ where, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const item = await prisma.dataLibraryItem.create({
    data: {
      title: body.title,
      content: body.content,
      category: body.category,
      tags: body.tags,
      fileUrl: body.fileUrl,
      fileType: body.fileType,
      isPublic: body.isPublic || false,
    },
  })
  return NextResponse.json(item, { status: 201 })
}
