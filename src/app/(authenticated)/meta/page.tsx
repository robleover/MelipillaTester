import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MetaClient from "./MetaClient";
import FormatSelector from "@/components/FormatSelector";
import { Suspense } from "react";

export default async function MetaPage({ searchParams }: { searchParams: { format?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) return null;

  const format = searchParams.format === "RACIAL_EDICION" ? "RACIAL_EDICION" : "RACIAL_LIBRE";

  const season = await prisma.season.findFirst({
    where: { teamId: session.user.teamId, status: "ACTIVE" },
    include: {
      decks: {
        where: { format },
        orderBy: [{ tier: "asc" }, { position: "asc" }, { name: "asc" }],
        include: { assignedTo: true, createdBy: { select: { id: true, name: true } } },
      },
    },
  });

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🔍 Mapa del Meta</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Define los decks relevantes del metagame actual.
          </p>
        </div>
        <Suspense><FormatSelector /></Suspense>
      </div>
      <MetaClient
        decks={JSON.parse(JSON.stringify(season?.decks || []))}
        isAdmin={session.user.role === "ADMIN"}
        format={format}
      />
    </div>
  );
}
