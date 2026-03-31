import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AnalysisClient from "./AnalysisClient";

export default async function AnalysisPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) return null;

  const season = await prisma.season.findFirst({
    where: { teamId: session.user.teamId, status: "ACTIVE" },
    include: {
      decks: { where: { status: { not: "DISCARDED" } }, orderBy: { name: "asc" } },
      matchResults: {
        include: { deckA: true, deckB: true },
      },
    },
  });

  // Calculate winrate matrix
  const decks = season?.decks || [];
  const results = season?.matchResults || [];

  const matrix: Record<string, Record<string, { winsA: number; winsB: number; total: number }>> = {};

  for (const deck of decks) {
    matrix[deck.id] = {};
    for (const other of decks) {
      if (deck.id !== other.id) {
        matrix[deck.id][other.id] = { winsA: 0, winsB: 0, total: 0 };
      }
    }
  }

  for (const r of results) {
    if (matrix[r.deckAId]?.[r.deckBId]) {
      matrix[r.deckAId][r.deckBId].winsA += r.winsA;
      matrix[r.deckAId][r.deckBId].winsB += r.winsB;
      matrix[r.deckAId][r.deckBId].total += r.winsA + r.winsB;
    }
    if (matrix[r.deckBId]?.[r.deckAId]) {
      matrix[r.deckBId][r.deckAId].winsA += r.winsB;
      matrix[r.deckBId][r.deckAId].winsB += r.winsA;
      matrix[r.deckBId][r.deckAId].total += r.winsA + r.winsB;
    }
  }

  // Calculate global winrates
  const globalStats = decks.map((deck) => {
    let totalWins = 0;
    let totalGames = 0;
    for (const otherId of Object.keys(matrix[deck.id] || {})) {
      totalWins += matrix[deck.id][otherId].winsA;
      totalGames += matrix[deck.id][otherId].total;
    }
    return {
      id: deck.id,
      name: deck.name,
      tier: deck.tier,
      totalWins,
      totalGames,
      winrate: totalGames > 0 ? Math.round((totalWins / totalGames) * 1000) / 10 : 0,
    };
  }).sort((a, b) => b.winrate - a.winrate);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">📊 Análisis de Winrates</h1>
        <p className="text-gray-500 mt-1">
          Análisis real, no emocional. Matchups {"<"}40% = imposibles 🔴, {">"}60% = favorables 🟢
        </p>
      </div>
      <AnalysisClient
        decks={JSON.parse(JSON.stringify(decks))}
        matrix={JSON.parse(JSON.stringify(matrix))}
        globalStats={globalStats}
      />
    </div>
  );
}
