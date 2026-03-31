import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PreparationClient from "./PreparationClient";

export default async function PreparationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) return null;

  const season = await prisma.season.findFirst({
    where: { teamId: session.user.teamId, status: "ACTIVE" },
    include: {
      decks: {
        where: { status: "CHOSEN" },
        orderBy: { name: "asc" },
      },
      matchupPlans: {
        include: { deck: true, opponentDeck: true },
      },
    },
  });

  const allDecks = await prisma.deck.findMany({
    where: { seasonId: season?.id, status: { not: "DISCARDED" } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">🧠 Preparación Final</h1>
        <p className="text-gray-500 mt-1">
          Practicar mirror match, memorizar líneas de juego, definir planes vs cada matchup. Esto marca MUCHO la diferencia.
        </p>
      </div>
      <PreparationClient
        chosenDecks={JSON.parse(JSON.stringify(season?.decks || []))}
        allDecks={JSON.parse(JSON.stringify(allDecks))}
        plans={JSON.parse(JSON.stringify(season?.matchupPlans || []))}
      />
    </div>
  );
}
