import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TestingClient from "./TestingClient";

export default async function TestingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) return null;

  const season = await prisma.season.findFirst({
    where: { teamId: session.user.teamId, status: "ACTIVE" },
    include: {
      decks: { where: { status: { not: "DISCARDED" } }, orderBy: { name: "asc" } },
      matchResults: {
        orderBy: { createdAt: "desc" },
        include: { deckA: true, deckB: true, player: true },
      },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">⚔️ Sistema de Testeo</h1>
        <p className="text-gray-500 mt-1">
          Registra sets de partidas. Mínimo 20-30 partidas por matchup para datos fiables.
        </p>
      </div>
      <TestingClient
        decks={JSON.parse(JSON.stringify(season?.decks || []))}
        results={JSON.parse(JSON.stringify(season?.matchResults || []))}
      />
    </div>
  );
}
