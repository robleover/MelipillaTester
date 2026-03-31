import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PreparationClient from "./PreparationClient";
import FormatSelector from "@/components/FormatSelector";
import { Suspense } from "react";

export default async function PreparationPage({ searchParams }: { searchParams: { format?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) return null;

  const format = searchParams.format === "RACIAL_EDICION" ? "RACIAL_EDICION" : "RACIAL_LIBRE";

  const season = await prisma.season.findFirst({
    where: { teamId: session.user.teamId, status: "ACTIVE" },
    include: {
      decks: {
        where: { status: "CHOSEN", format },
        orderBy: { name: "asc" },
      },
      matchupPlans: {
        where: { format },
        include: { deck: true, opponentDeck: true },
      },
    },
  });

  const allDecks = await prisma.deck.findMany({
    where: { seasonId: season?.id, status: { not: "DISCARDED" }, format },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🧠 Preparación Final</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Practicar mirror match, memorizar líneas de juego, definir planes vs cada matchup. Esto marca MUCHO la diferencia.
          </p>
        </div>
        <Suspense><FormatSelector /></Suspense>
      </div>
      <PreparationClient
        chosenDecks={JSON.parse(JSON.stringify(season?.decks || []))}
        allDecks={JSON.parse(JSON.stringify(allDecks))}
        plans={JSON.parse(JSON.stringify(season?.matchupPlans || []))}
        format={format}
      />
    </div>
  );
}
