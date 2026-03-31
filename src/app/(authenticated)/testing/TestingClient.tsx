"use client";

import { useState } from "react";
import { createMatchResult, deleteMatchResult } from "@/app/actions";
import { calculateWinrate, getWinrateColor } from "@/lib/utils";

interface Deck {
  id: string;
  name: string;
  tier: string;
}

interface MatchResult {
  id: string;
  deckA: { id: string; name: string };
  deckB: { id: string; name: string };
  winsA: number;
  winsB: number;
  goingFirst: string;
  withSidePlan: boolean;
  notes: string | null;
  player: { id: string; name: string };
  createdAt: string;
}

export default function TestingClient({ decks, results }: { decks: Deck[]; results: MatchResult[] }) {
  const [showForm, setShowForm] = useState(false);
  const [filterDeck, setFilterDeck] = useState("");

  const filteredResults = filterDeck
    ? results.filter((r) => r.deckA.id === filterDeck || r.deckB.id === filterDeck)
    : results;

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
        >
          + Registrar Partidas
        </button>

        <select
          value={filterDeck}
          onChange={(e) => setFilterDeck(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
        >
          <option value="">Todos los matchups</option>
          {decks.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Registrar Set de Partidas</h3>
          <form
            action={async (formData) => {
              await createMatchResult(formData);
              setShowForm(false);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deck A</label>
                <select name="deckAId" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                  <option value="">Seleccionar...</option>
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deck B</label>
                <select name="deckBId" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                  <option value="">Seleccionar...</option>
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Victorias Deck A</label>
                <input name="winsA" type="number" min="0" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Victorias Deck B</label>
                <input name="winsB" type="number" min="0" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">¿Quién fue primero?</label>
                <select name="goingFirst" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                  <option value="MIXED">Mixto / Alternado</option>
                  <option value="A">Deck A siempre primero</option>
                  <option value="B">Deck B siempre primero</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">¿Con Side Plan?</label>
                <select name="withSidePlan" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                  <option value="false">No (Game 1)</option>
                  <option value="true">Sí (Post-side)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                name="notes"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                placeholder="Observaciones del matchup, cartas clave, etc."
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm">
                Registrar
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Results table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Matchup</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Resultado</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">WR Deck A</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Detalles</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Jugador</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredResults.map((r) => {
              const total = r.winsA + r.winsB;
              const wr = calculateWinrate(r.winsA, total);
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {r.deckA.name} vs {r.deckB.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                    {r.winsA}-{r.winsB}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium px-2 py-0.5 rounded ${getWinrateColor(wr)}`}>
                      {wr}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {r.goingFirst !== "MIXED" ? `1ro: Deck ${r.goingFirst}` : "Mixto"}
                    {r.withSidePlan && " · Con side"}
                    {r.notes && <span className="block mt-0.5 text-gray-400">{r.notes}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.player.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString("es-CL")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (confirm("¿Eliminar este registro?")) deleteMatchResult(r.id);
                      }}
                      className="text-gray-300 hover:text-red-500 text-sm"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredResults.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No hay resultados registrados aún.
          </div>
        )}
      </div>
    </div>
  );
}
