"use client";

import { useState } from "react";
import { createDeckChange } from "@/app/actions";

interface DeckChange {
  id: string;
  description: string;
  cardsAdded: string | null;
  cardsRemoved: string | null;
  createdAt: string;
}

interface Deck {
  id: string;
  name: string;
  tier: string;
  cardList: string | null;
  deckChanges: DeckChange[];
}

export default function IterationsClient({ decks }: { decks: Deck[] }) {
  const [selectedDeck, setSelectedDeck] = useState<string>(decks[0]?.id || "");
  const [showForm, setShowForm] = useState(false);

  const deck = decks.find((d) => d.id === selectedDeck);

  return (
    <div>
      {/* Deck selector */}
      <div className="flex gap-3 mb-6">
        <select
          value={selectedDeck}
          onChange={(e) => setSelectedDeck(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
        >
          {decks.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
        >
          + Registrar Cambio
        </button>
      </div>

      {/* Change form */}
      {showForm && (
        <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Registrar Cambio en {deck?.name}</h3>
          <form
            action={async (formData) => {
              formData.set("deckId", selectedDeck);
              const added = (formData.get("cardsAdded") as string)?.split("\n").filter(Boolean).length || 0;
              const removed = (formData.get("cardsRemoved") as string)?.split("\n").filter(Boolean).length || 0;
              if (added > 3 || removed > 3) {
                if (!confirm(`⚠️ Estás cambiando ${Math.max(added, removed)} cartas. Se recomienda máximo 3 para mantener control del experimento. ¿Continuar?`)) {
                  return;
                }
              }
              await createDeckChange(formData);
              setShowForm(false);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del cambio</label>
              <input
                name="description"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                placeholder="Ej: Mejorar matchup vs Elfos"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">➕ Cartas agregadas (una por línea)</label>
                <textarea
                  name="cardsAdded"
                  rows={4}
                  className="w-full px-3 py-2 border border-green-200 rounded-lg font-mono text-sm text-gray-900 bg-green-50"
                  placeholder="1x Carta Nueva&#10;2x Otra Carta"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1">➖ Cartas removidas (una por línea)</label>
                <textarea
                  name="cardsRemoved"
                  rows={4}
                  className="w-full px-3 py-2 border border-red-200 rounded-lg font-mono text-sm text-gray-900 bg-red-50"
                  placeholder="1x Carta Vieja&#10;2x Otra Carta"
                />
              </div>
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

      {/* Change log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Changelog */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">📋 Historial de cambios</h3>
          {deck?.deckChanges && deck.deckChanges.length > 0 ? (
            <div className="space-y-4">
              {deck.deckChanges.map((change) => (
                <div key={change.id} className="border-l-2 border-indigo-300 pl-4 py-2">
                  <p className="text-sm font-medium text-gray-900">{change.description}</p>
                  <p className="text-xs text-gray-400 mb-2">
                    {new Date(change.createdAt).toLocaleDateString("es-CL")}
                  </p>
                  <div className="flex gap-4 text-xs">
                    {change.cardsAdded && (
                      <div className="text-green-600">
                        <span className="font-medium">+</span> {change.cardsAdded.split("\n").filter(Boolean).join(", ")}
                      </div>
                    )}
                    {change.cardsRemoved && (
                      <div className="text-red-600">
                        <span className="font-medium">-</span> {change.cardsRemoved.split("\n").filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Sin cambios registrados.</p>
          )}
        </div>

        {/* Current card list */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">🃏 Lista actual</h3>
          {deck?.cardList ? (
            <pre className="text-xs font-mono text-gray-600 bg-gray-50 p-4 rounded-lg max-h-96 overflow-auto">
              {deck.cardList}
            </pre>
          ) : (
            <p className="text-gray-400 text-sm">Sin lista de cartas definida.</p>
          )}
        </div>
      </div>
    </div>
  );
}
