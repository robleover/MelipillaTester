"use client";

import { assignDeck, updateDeckStatus } from "@/app/actions";
import { tierLabel, tierColor, statusLabel, statusColor } from "@/lib/utils";

interface Deck {
  id: string;
  name: string;
  tier: string;
  description: string | null;
  status: string;
  assignedTo: { id: string; name: string } | null;
}

interface Member {
  id: string;
  name: string;
}

export default function DecksClient({ decks, members }: { decks: Deck[]; members: Member[] }) {
  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-700">{decks.filter((d) => d.status === "TESTING").length}</p>
          <p className="text-xs text-yellow-600">En testeo</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{decks.filter((d) => d.status === "CHOSEN").length}</p>
          <p className="text-xs text-green-600">Elegidos</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-500">{decks.filter((d) => d.status === "DISCARDED").length}</p>
          <p className="text-xs text-gray-500">Descartados</p>
        </div>
      </div>

      {/* Deck table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Deck</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tier</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Asignado a</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {decks.map((deck) => (
              <tr key={deck.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{deck.name}</p>
                  {deck.description && <p className="text-xs text-gray-400">{deck.description}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${tierColor(deck.tier)}`}>
                    {tierLabel(deck.tier)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={deck.status}
                    onChange={(e) => updateDeckStatus(deck.id, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor(deck.status)}`}
                  >
                    <option value="TESTING">En testeo</option>
                    <option value="CHOSEN">Elegido</option>
                    <option value="DISCARDED">Descartado</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={deck.assignedTo?.id || ""}
                    onChange={(e) => assignDeck(deck.id, e.target.value || null)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700"
                  >
                    <option value="">Sin asignar</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-400">
                    {deck.assignedTo ? `👤 ${deck.assignedTo.name}` : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {decks.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No hay decks. Ve a <span className="text-indigo-500">Meta</span> para agregar decks primero.
          </div>
        )}
      </div>
    </div>
  );
}
