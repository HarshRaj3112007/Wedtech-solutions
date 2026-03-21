import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

function getRegistrationErrorMessage(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    const errorCode = error.errorCode;

    if (errorCode === "P1000" || errorCode === "P1010") {
      return "Database access is misconfigured. Update DATABASE_URL to a valid local PostgreSQL user and try again.";
    }

    if (errorCode === "P1001") {
      return "PostgreSQL is not reachable. Start the local database and try again.";
    }

    return "Database setup is incomplete. Check DATABASE_URL and Prisma setup, then try again.";
  }

  return "Failed to create account";
}

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
      apiError(getRegistrationErrorMessage(error)),
      { status: 500 }
    );
  }
}
