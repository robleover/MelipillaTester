import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import FormatSelector from "@/components/FormatSelector";
import { Suspense } from "react";

export default async function DashboardPage({ searchParams }: { searchParams: { format?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.teamId) return null;

  const format = searchParams.format === "RACIAL_EDICION" ? "RACIAL_EDICION" : "RACIAL_LIBRE";

  const season = await prisma.season.findFirst({
    where: { teamId: session.user.teamId, status: "ACTIVE" },
    include: {
      decks: { where: { format }, include: { assignedTo: true } },
      matchResults: { where: { format }, orderBy: { createdAt: "desc" }, take: 10, include: { deckA: true, deckB: true, player: true } },
    },
  });

  const totalGames = season?.matchResults?.reduce((acc, r) => acc + r.winsA + r.winsB, 0) || 0;
  const decksInTesting = season?.decks?.filter((d) => d.status === "TESTING").length || 0;
  const decksChosen = season?.decks?.filter((d) => d.status === "CHOSEN").length || 0;

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Temporada: <span className="font-medium text-indigo-600">{season?.name || "Sin temporada activa"}</span>
          </p>
        </div>
        <Suspense><FormatSelector /></Suspense>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard label="Decks en testeo" value={decksInTesting} icon="🃏" />
        <StatCard label="Decks elegidos" value={decksChosen} icon="✅" />
        <StatCard label="Partidas totales" value={totalGames} icon="⚔️" />
        <StatCard label="Sets registrados" value={season?.matchResults?.length || 0} icon="📝" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <QuickAction href="/meta" title="Mapear Meta" desc="Agregar decks al metagame" icon="🔍" />
        <QuickAction href="/testing" title="Registrar Testeo" desc="Registrar resultados de partidas" icon="⚔️" />
        <QuickAction href="/analysis" title="Ver Análisis" desc="Winrates y matchup matrix" icon="📊" />
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad reciente</h2>
        {season?.matchResults && season.matchResults.length > 0 ? (
          <div className="space-y-3">
            {season.matchResults.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">⚔️</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {r.deckA.name} vs {r.deckB.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.winsA}-{r.winsB} · por {r.player.name}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString("es-CL")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No hay actividad aún. ¡Empieza agregando decks al meta!</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <p className="text-sm text-gray-500 mt-2">{label}</p>
    </div>
  );
}

function QuickAction({ href, title, desc, icon }: { href: string; title: string; desc: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </Link>
  );
}
