"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createDeck(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) throw new Error("No autorizado");

  const season = await prisma.season.findFirst({
    where: { teamId: session.user.teamId, status: "ACTIVE" },
  });
  if (!season) throw new Error("No hay temporada activa");

  const name = formData.get("name") as string;
  const tier = formData.get("tier") as string;
  const description = formData.get("description") as string;
  const cardList = formData.get("cardList") as string;

  if (!name || !tier) throw new Error("Nombre y tier son requeridos");

  await prisma.deck.create({
    data: {
      name,
      tier: tier as "TIER1" | "TIER2" | "ROGUE",
      description: description || null,
      cardList: cardList || null,
      seasonId: season.id,
    },
  });

  revalidatePath("/meta");
}

export async function updateDeck(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) throw new Error("No autorizado");

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const tier = formData.get("tier") as string;
  const description = formData.get("description") as string;
  const cardList = formData.get("cardList") as string;

  if (!id || !name || !tier) throw new Error("Datos incompletos");

  await prisma.deck.update({
    where: { id },
    data: {
      name,
      tier: tier as "TIER1" | "TIER2" | "ROGUE",
      description: description || null,
      cardList: cardList || null,
    },
  });

  revalidatePath("/meta");
}

export async function deleteDeck(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId || session.user.role !== "ADMIN") {
    throw new Error("No autorizado");
  }

  await prisma.deck.delete({ where: { id } });
  revalidatePath("/meta");
}

export async function assignDeck(deckId: string, userId: string | null) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) throw new Error("No autorizado");

  await prisma.deck.update({
    where: { id: deckId },
    data: { assignedToId: userId, status: userId ? "TESTING" : "TESTING" },
  });

  revalidatePath("/decks");
}

export async function updateDeckStatus(deckId: string, status: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) throw new Error("No autorizado");

  await prisma.deck.update({
    where: { id: deckId },
    data: { status: status as "TESTING" | "DISCARDED" | "CHOSEN" },
  });

  revalidatePath("/decks");
}

export async function createMatchResult(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) throw new Error("No autorizado");

  const season = await prisma.season.findFirst({
    where: { teamId: session.user.teamId, status: "ACTIVE" },
  });
  if (!season) throw new Error("No hay temporada activa");

  const deckAId = formData.get("deckAId") as string;
  const deckBId = formData.get("deckBId") as string;
  const winsA = parseInt(formData.get("winsA") as string);
  const winsB = parseInt(formData.get("winsB") as string);
  const goingFirst = formData.get("goingFirst") as string;
  const withSidePlan = formData.get("withSidePlan") === "true";
  const notes = formData.get("notes") as string;

  if (!deckAId || !deckBId || isNaN(winsA) || isNaN(winsB)) {
    throw new Error("Datos incompletos");
  }

  if (deckAId === deckBId) {
    throw new Error("Los decks deben ser diferentes");
  }

  await prisma.matchResult.create({
    data: {
      deckAId,
      deckBId,
      winsA,
      winsB,
      goingFirst: goingFirst || "MIXED",
      withSidePlan,
      notes: notes || null,
      playerId: session.user.id,
      seasonId: season.id,
    },
  });

  revalidatePath("/testing");
  revalidatePath("/analysis");
}

export async function deleteMatchResult(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) throw new Error("No autorizado");

  await prisma.matchResult.delete({ where: { id } });
  revalidatePath("/testing");
  revalidatePath("/analysis");
}

export async function createDeckChange(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) throw new Error("No autorizado");

  const deckId = formData.get("deckId") as string;
  const description = formData.get("description") as string;
  const cardsAdded = formData.get("cardsAdded") as string;
  const cardsRemoved = formData.get("cardsRemoved") as string;

  if (!deckId || !description) throw new Error("Datos incompletos");

  const addedCount = cardsAdded ? cardsAdded.split("\n").filter(Boolean).length : 0;
  const removedCount = cardsRemoved ? cardsRemoved.split("\n").filter(Boolean).length : 0;

  await prisma.deckChange.create({
    data: {
      deckId,
      description,
      cardsAdded: cardsAdded || null,
      cardsRemoved: cardsRemoved || null,
    },
  });

  // Also update the deck's cardList if needed
  if (cardsAdded || cardsRemoved) {
    const deck = await prisma.deck.findUnique({ where: { id: deckId } });
    if (deck) {
      let currentCards = deck.cardList ? deck.cardList.split("\n").filter(Boolean) : [];
      if (cardsRemoved) {
        const toRemove = cardsRemoved.split("\n").filter(Boolean);
        currentCards = currentCards.filter((c) => !toRemove.includes(c));
      }
      if (cardsAdded) {
        const toAdd = cardsAdded.split("\n").filter(Boolean);
        currentCards = [...currentCards, ...toAdd];
      }
      await prisma.deck.update({
        where: { id: deckId },
        data: { cardList: currentCards.join("\n") },
      });
    }
  }

  revalidatePath("/iterations");
  revalidatePath("/decks");
}

export async function createTeamDecision(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId || session.user.role !== "ADMIN") {
    throw new Error("Solo el admin puede publicar decisiones");
  }

  const season = await prisma.season.findFirst({
    where: { teamId: session.user.teamId, status: "ACTIVE" },
  });
  if (!season) throw new Error("No hay temporada activa");

  const approach = formData.get("approach") as string;
  const notes = formData.get("notes") as string;
  const deckIds = formData.getAll("deckIds") as string[];

  if (!approach || deckIds.length === 0) {
    throw new Error("Selecciona al menos un deck y un enfoque");
  }

  await prisma.teamDecision.create({
    data: {
      seasonId: season.id,
      approach: approach as "ALL_SAME" | "SPLIT",
      notes: notes || null,
      chosenDecks: { connect: deckIds.map((id) => ({ id })) },
    },
  });

  // Mark chosen decks
  await prisma.deck.updateMany({
    where: { id: { in: deckIds } },
    data: { status: "CHOSEN" },
  });

  revalidatePath("/decision");
  revalidatePath("/decks");
}

export async function saveMatchupPlan(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) throw new Error("No autorizado");

  const season = await prisma.season.findFirst({
    where: { teamId: session.user.teamId, status: "ACTIVE" },
  });
  if (!season) throw new Error("No hay temporada activa");

  const id = formData.get("id") as string;
  const deckId = formData.get("deckId") as string;
  const opponentDeckId = formData.get("opponentDeckId") as string;
  const plan = formData.get("plan") as string;
  const keyCards = formData.get("keyCards") as string;
  const sideboardPlan = formData.get("sideboardPlan") as string;

  if (!deckId || !opponentDeckId || !plan) {
    throw new Error("Datos incompletos");
  }

  if (id) {
    await prisma.matchupPlan.update({
      where: { id },
      data: { plan, keyCards: keyCards || null, sideboardPlan: sideboardPlan || null },
    });
  } else {
    await prisma.matchupPlan.create({
      data: {
        deckId,
        opponentDeckId,
        plan,
        keyCards: keyCards || null,
        sideboardPlan: sideboardPlan || null,
        seasonId: season.id,
      },
    });
  }

  revalidatePath("/preparation");
}

export async function createInvitation(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId || session.user.role !== "ADMIN") {
    throw new Error("Solo el admin puede crear invitaciones");
  }

  const email = formData.get("email") as string;
  if (!email) throw new Error("Email requerido");

  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.invitation.create({
    data: {
      email,
      token,
      teamId: session.user.teamId,
      createdBy: session.user.id,
      expiresAt,
    },
  });

  revalidatePath("/admin");
  return token;
}

export async function updateUserRole(userId: string, role: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId || session.user.role !== "ADMIN") {
    throw new Error("Solo el admin puede cambiar roles");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: role as "ADMIN" | "MEMBER" },
  });

  revalidatePath("/admin");
}
