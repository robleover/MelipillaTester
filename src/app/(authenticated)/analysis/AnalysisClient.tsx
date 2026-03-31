"use client";

import { calculateWinrate, getWinrateColor, tierLabel, tierColor } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Deck {
  id: string;
  name: string;
  tier: string;
}

interface MatchupData {
  winsA: number;
  winsB: number;
  total: number;
}

interface GlobalStat {
  id: string;
  name: string;
  tier: string;
  totalWins: number;
  totalGames: number;
  winrate: number;
}

export default function AnalysisClient({
  decks,
  matrix,
  globalStats,
}: {
  decks: Deck[];
  matrix: Record<string, Record<string, MatchupData>>;
  globalStats: GlobalStat[];
}) {
  const chartData = globalStats.map((s) => ({
    name: s.name.length > 15 ? s.name.slice(0, 15) + "…" : s.name,
    winrate: s.winrate,
    games: s.totalGames,
  }));

  return (
    <div className="space-y-8">
      {/* Global Ranking */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🏆 Ranking Global de Decks</h2>
        <p className="text-sm text-gray-500 mb-4">
          ¿Este deck puede ganar un torneo largo? Necesita consistencia, no autoperder por mala mano, y tener outs en casi todas las partidas.
        </p>
        {globalStats.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {globalStats.map((stat, i) => (
                <div key={stat.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <span className="text-lg font-bold text-gray-300 w-6">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{stat.name}</p>
                    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded border ${tierColor(stat.tier)}`}>
                      {tierLabel(stat.tier)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${getWinrateColor(stat.winrate)}`}>
                      {stat.winrate}%
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5">{stat.totalGames} partidas</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Winrate"]}
                    labelFormatter={(label) => `Deck: ${label}`}
                  />
                  <Bar dataKey="winrate" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={entry.winrate >= 60 ? "#22c55e" : entry.winrate >= 40 ? "#eab308" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <p className="text-gray-400 text-sm">Sin datos aún. Registra partidas en la sección de testeo.</p>
        )}
      </div>

      {/* Matchup Matrix */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">⚔️ Matriz de Matchups</h2>
        {decks.length >= 2 ? (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 bg-gray-50 sticky left-0">
                  Deck ↓ vs →
                </th>
                {decks.map((d) => (
                  <th key={d.id} className="px-3 py-2 text-center text-xs font-medium text-gray-500 bg-gray-50 min-w-[80px]">
                    {d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {decks.map((deckRow) => (
                <tr key={deckRow.id}>
                  <td className="px-3 py-2 text-xs font-medium text-gray-900 bg-gray-50 sticky left-0">
                    {deckRow.name}
                  </td>
                  {decks.map((deckCol) => {
                    if (deckRow.id === deckCol.id) {
                      return (
                        <td key={deckCol.id} className="px-3 py-2 text-center bg-gray-100 text-gray-300 text-xs">
                          —
                        </td>
                      );
                    }
                    const data = matrix[deckRow.id]?.[deckCol.id];
                    if (!data || data.total === 0) {
                      return (
                        <td key={deckCol.id} className="px-3 py-2 text-center text-gray-300 text-xs">
                          N/A
                        </td>
                      );
                    }
                    const wr = calculateWinrate(data.winsA, data.total);
                    return (
                      <td key={deckCol.id} className="px-3 py-2 text-center">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${getWinrateColor(wr)}`}>
                          {wr}%
                        </span>
                        <p className="text-[10px] text-gray-400">{data.winsA}-{data.winsB}</p>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400 text-sm">Necesitas al menos 2 decks activos para ver la matriz.</p>
        )}
      </div>
    </div>
  );
}
