import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DecksClient from "./DecksClient";

export default async function DecksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) return null;

  const season = await prisma.season.findFirst({
    where: { teamId: session.user.teamId, status: "ACTIVE" },
    include: {
      decks: {
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">🃏 Selección de Decks</h1>
        <p className="text-gray-500 mt-1">
          Asigna decks a jugadores para testeo. Elige 2-3 Tier 1, 1-2 anti-meta, y 1 rogue.
        </p>
      </div>
      <DecksClient
        decks={JSON.parse(JSON.stringify(season?.decks || []))}
        members={JSON.parse(JSON.stringify(members))}
      />
    </div>
  );
}
