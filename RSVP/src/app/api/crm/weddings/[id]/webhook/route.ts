import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";
import { authenticateCRM } from "@/lib/auth/crm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** GET — Retrieve current webhook URL */
export async function GET(req: Request, { params }: RouteParams) {
  const planner = await authenticateCRM(req);
  if (!planner) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { id } = await params;
  const wedding = await prisma.wedding.findFirst({
    where: { id, plannerId: planner.id },
    select: { id: true, crmWebhookUrl: true },
  });

  if (!wedding) {
    return NextResponse.json(apiError("Wedding not found"), { status: 404 });
  }

  return NextResponse.json(
    apiSuccess({ webhookUrl: wedding.crmWebhookUrl })
  );
}

/** PUT — Set/update webhook URL */
export async function PUT(req: Request, { params }: RouteParams) {
  const planner = await authenticateCRM(req);
  if (!planner) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { id } = await params;
  const wedding = await prisma.wedding.findFirst({
    where: { id, plannerId: planner.id },
    select: { id: true },
  });

  if (!wedding) {
    return NextResponse.json(apiError("Wedding not found"), { status: 404 });
  }

  const { webhookUrl } = await req.json();

  const updated = await prisma.wedding.update({
    where: { id },
    data: { crmWebhookUrl: webhookUrl || null },
  });

  return NextResponse.json(
    apiSuccess({ webhookUrl: updated.crmWebhookUrl })
  );
}
