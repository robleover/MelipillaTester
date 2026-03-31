import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, token } = await req.json();

    if (!name || !email || !password || !token) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Validate invitation token
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitación no válida" },
        { status: 400 }
      );
    }

    if (invitation.used) {
      return NextResponse.json(
        { error: "Esta invitación ya fue utilizada" },
        { status: 400 }
      );
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Esta invitación ha expirado" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email" },
        { status: 400 }
      );
    }

    // Create user
    const hashedPassword = await hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: invitation.role,
        teamId: invitation.teamId,
      },
    });

    // Mark invitation as used
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { used: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
