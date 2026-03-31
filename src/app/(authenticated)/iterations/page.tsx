import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import IterationsClient from "./IterationsClient";
import FormatSelector from "@/components/FormatSelector";
import { Suspense } from "react";

export default async function IterationsPage({ searchParams }: { searchParams: { format?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) return null;

  const format = searchParams.format === "RACIAL_EDICION" ? "RACIAL_EDICION" : "RACIAL_LIBRE";

  const season = await prisma.season.findFirst({
    where: { teamId: session.user.teamId, status: "ACTIVE" },
    include: {
      decks: {
        where: { status: { not: "DISCARDED" }, format },
        orderBy: { name: "asc" },
        include: {
          deckChanges: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🔁 Iteración de Listas</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Ajusta cartas tech, mejora matchups débiles. ⚠️ No cambies más de 3 cartas a la vez.
          </p>
        </div>
        <Suspense><FormatSelector /></Suspense>
      </div>
      <IterationsClient
        decks={JSON.parse(JSON.stringify(season?.decks || []))}
        format={format}
      />
    </div>
  );
}
