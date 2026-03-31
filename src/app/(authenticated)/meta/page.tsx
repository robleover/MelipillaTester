import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MetaClient from "./MetaClient";

export default async function MetaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) return null;

  const season = await prisma.season.findFirst({
    where: { teamId: session.user.teamId, status: "ACTIVE" },
    include: {
      decks: {
        orderBy: [{ tier: "asc" }, { position: "asc" }, { name: "asc" }],
        include: { assignedTo: true, createdBy: { select: { id: true, name: true } } },
      },
    },
  });

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🔍 Mapa del Meta</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Define los decks relevantes del metagame actual.
        </p>
      </div>
      <MetaClient
        decks={JSON.parse(JSON.stringify(season?.decks || []))}
        isAdmin={session.user.role === "ADMIN"}
      />
    </div>
  );
}
