import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DecksClient from "./DecksClient";
import FormatSelector from "@/components/FormatSelector";
import { Suspense } from "react";

export default async function DecksPage({ searchParams }: { searchParams: { format?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) return null;

  const format = searchParams.format === "RACIAL_EDICION" ? "RACIAL_EDICION" : "RACIAL_LIBRE";

  const season = await prisma.season.findFirst({
    where: { teamId: session.user.teamId, status: "ACTIVE" },
    include: {
      decks: {
        where: { format },
        orderBy: [{ status: "asc" }, { tier: "asc" }, { name: "asc" }],
        include: { assignedTo: true },
      },
    },
  });

  const members = await prisma.user.findMany({
    where: { teamId: session.user.teamId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🃏 Selección de Decks</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Asigna decks a jugadores para testeo. Elige 2-3 Tier 1, 1-2 anti-meta, y 1 rogue.
          </p>
        </div>
        <Suspense><FormatSelector /></Suspense>
      </div>
      <DecksClient
        decks={JSON.parse(JSON.stringify(season?.decks || []))}
        members={JSON.parse(JSON.stringify(members))}
        format={format}
      />
    </div>
  );
}
