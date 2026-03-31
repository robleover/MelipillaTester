import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import IterationsClient from "./IterationsClient";

export default async function IterationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) return null;

  const season = await prisma.season.findFirst({
    where: { teamId: session.user.teamId, status: "ACTIVE" },
    include: {
      decks: {
        where: { status: { not: "DISCARDED" } },
        orderBy: { name: "asc" },
        include: {
          deckChanges: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">🔁 Iteración de Listas</h1>
        <p className="text-gray-500 mt-1">
          Ajusta cartas tech, mejora matchups débiles. ⚠️ No cambies más de 3 cartas a la vez.
        </p>
      </div>
      <IterationsClient
        decks={JSON.parse(JSON.stringify(season?.decks || []))}
      />
    </div>
  );
}
