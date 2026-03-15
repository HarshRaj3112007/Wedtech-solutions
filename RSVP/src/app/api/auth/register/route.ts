import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        apiError("Name, email, and password are required"),
        { status: 400 }
      );
    }

    const existing = await prisma.planner.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        apiError("An account with this email already exists"),
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);
    const apiKey = "rsvp_" + randomBytes(24).toString("hex");
    const apiKeyPrefix = apiKey.slice(0, 12);

    const planner = await prisma.planner.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        apiKey,
        apiKeyPrefix,
      },
    });

    return NextResponse.json(
      apiSuccess({
        id: planner.id,
        name: planner.name,
        email: planner.email,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      apiError("Failed to create account"),
      { status: 500 }
    );
  }
}
