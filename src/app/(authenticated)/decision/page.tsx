import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DecisionClient from "./DecisionClient";

export default async function DecisionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) return null;

  const season = await prisma.season.findFirst({
    where: { teamId: session.user.teamId, status: "ACTIVE" },
    include: {
      decks: {
        where: { status: { not: "DISCARDED" } },
        orderBy: { name: "asc" },
      },
      decisions: {
        orderBy: { decidedAt: "desc" },
        include: { chosenDecks: true },
      },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">🧬 Decisión Final del Team</h1>
        <p className="text-gray-500 mt-1">
          El mejor deck es el que tiene mejor winrate global, buen matchup vs Tier 1 y baja varianza.
        </p>
      </div>
      <DecisionClient
        decks={JSON.parse(JSON.stringify(season?.decks || []))}
        decisions={JSON.parse(JSON.stringify(season?.decisions || []))}
        isAdmin={session.user.role === "ADMIN"}
      />
    </div>
  );
}
