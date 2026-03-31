import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DecisionClient from "./DecisionClient";
import FormatSelector from "@/components/FormatSelector";
import { Suspense } from "react";

export default async function DecisionPage({ searchParams }: { searchParams: { format?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) return null;

  const format = searchParams.format === "RACIAL_EDICION" ? "RACIAL_EDICION" : "RACIAL_LIBRE";

  const season = await prisma.season.findFirst({
    where: { teamId: session.user.teamId, status: "ACTIVE" },
    include: {
      decks: {
        where: { status: { not: "DISCARDED" }, format },
        orderBy: { name: "asc" },
      },
      decisions: {
        where: { format },
        orderBy: { decidedAt: "desc" },
        include: { chosenDecks: true },
      },
    },
  });

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🧬 Decisión Final del Team</h1>
          <p className="text-gray-500 mt-1 text-sm">
            El mejor deck es el que tiene mejor winrate global, buen matchup vs Tier 1 y baja varianza.
          </p>
        </div>
        <Suspense><FormatSelector /></Suspense>
      </div>
      <DecisionClient
        decks={JSON.parse(JSON.stringify(season?.decks || []))}
        decisions={JSON.parse(JSON.stringify(season?.decisions || []))}
        isAdmin={session.user.role === "ADMIN"}
        format={format}
      />
    </div>
  );
}
