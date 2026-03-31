"use client";

import { useState } from "react";
import { createTeamDecision } from "@/app/actions";

interface Deck {
  id: string;
  name: string;
  tier: string;
  status: string;
}

interface Decision {
  id: string;
  approach: string;
  notes: string | null;
  decidedAt: string;
  chosenDecks: Deck[];
}

export default function DecisionClient({
  decks,
  decisions,
  isAdmin,
  format,
}: {
  decks: Deck[];
  decisions: Decision[];
  isAdmin: boolean;
  format: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [selectedDecks, setSelectedDecks] = useState<string[]>([]);

  const latestDecision = decisions[0];

  return (
    <div className="space-y-8">
      {/* Current decision */}
      {latestDecision && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
          <h2 className="text-lg font-semibold text-indigo-900 mb-3">✅ Decisión vigente</h2>
          <div className="flex flex-wrap gap-3 mb-3">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
              {latestDecision.approach === "ALL_SAME" ? "Opción A: Todos el mismo deck" : "Opción B: Decks distintos"}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(latestDecision.decidedAt).toLocaleDateString("es-CL")}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {latestDecision.chosenDecks.map((d) => (
              <span key={d.id} className="px-3 py-1 bg-white border border-indigo-200 rounded-lg text-sm font-medium text-indigo-700">
                🃏 {d.name}
              </span>
            ))}
          </div>
          {latestDecision.notes && (
            <p className="text-sm text-gray-600 mt-2">{latestDecision.notes}</p>
          )}
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-medium text-gray-900 mb-2">Opción A — Todos el mismo deck</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✅ Maximiza preparación</li>
            <li>✅ Comparten conocimiento total</li>
            <li>✅ Más común y efectivo</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-medium text-gray-900 mb-2">Opción B — 2-3 decks distintos</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✅ Si el meta está muy abierto</li>
            <li>✅ Cubren distintos matchups</li>
            <li>⚠️ Menos preparación por deck</li>
          </ul>
        </div>
      </div>

      {/* New decision (admin only) */}
      {isAdmin && (
        <div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
          >
            📣 Publicar Nueva Decisión
          </button>

          {showForm && (
            <div className="mt-4 bg-white rounded-xl border border-gray-200 p-6">
              <form
                action={async (formData) => {
                  formData.set("format", format);
                  for (const id of selectedDecks) {
                    formData.append("deckIds", id);
                  }
                  await createTeamDecision(formData);
                  setShowForm(false);
                  setSelectedDecks([]);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enfoque</label>
                  <select name="approach" required className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                    <option value="ALL_SAME">Opción A: Todos el mismo deck</option>
                    <option value="SPLIT">Opción B: Decks distintos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Decks elegidos</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {decks.map((d) => (
                      <label
                        key={d.id}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                          selectedDecks.includes(d.id)
                            ? "bg-indigo-50 border-indigo-300"
                            : "bg-gray-50 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDecks.includes(d.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDecks([...selectedDecks, d.id]);
                            } else {
                              setSelectedDecks(selectedDecks.filter((id) => id !== d.id));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-900">{d.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas / Justificación</label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Explicar la razón de esta decisión..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={selectedDecks.length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm disabled:opacity-50"
                >
                  Publicar Decisión
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Decision history */}
      {decisions.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">📜 Historial de decisiones</h3>
          <div className="space-y-3">
            {decisions.slice(1).map((d) => (
              <div key={d.id} className="border-l-2 border-gray-200 pl-4 py-2">
                <p className="text-sm text-gray-600">
                  {d.approach === "ALL_SAME" ? "Todos el mismo deck" : "Decks distintos"} —{" "}
                  {d.chosenDecks.map((dk) => dk.name).join(", ")}
                </p>
                <p className="text-xs text-gray-400">{new Date(d.decidedAt).toLocaleDateString("es-CL")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
