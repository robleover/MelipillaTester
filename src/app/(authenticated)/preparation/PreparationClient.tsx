"use client";

import { useState } from "react";
import { saveMatchupPlan } from "@/app/actions";

interface Deck {
  id: string;
  name: string;
  tier: string;
}

interface Plan {
  id: string;
  deckId: string;
  opponentDeckId: string;
  plan: string;
  keyCards: string | null;
  sideboardPlan: string | null;
  deck: Deck;
  opponentDeck: Deck;
}

export default function PreparationClient({
  chosenDecks,
  allDecks,
  plans,
}: {
  chosenDecks: Deck[];
  allDecks: Deck[];
  plans: Plan[];
}) {
  const [selectedDeck, setSelectedDeck] = useState<string>(chosenDecks[0]?.id || "");
  const [editingPlan, setEditingPlan] = useState<string | null>(null);

  const deckPlans = plans.filter((p) => p.deckId === selectedDeck);

  if (chosenDecks.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <p className="text-gray-400 text-lg">No hay decks elegidos aún</p>
        <p className="text-gray-400 text-sm mt-1">
          Primero elige los decks finales en la sección de Decisión.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Deck selector */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
        {chosenDecks.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDeck(d.id)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
              selectedDeck === d.id
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            🃏 {d.name}
          </button>
        ))}
      </div>

      {/* Checklist */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5 mb-6">
        <h3 className="font-medium text-amber-900 mb-2">📋 Checklist de Preparación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <label className="flex items-center gap-2 text-amber-800">
            <input type="checkbox" className="rounded" /> Practicar mirror match
          </label>
          <label className="flex items-center gap-2 text-amber-800">
            <input type="checkbox" className="rounded" /> Memorizar líneas de juego
          </label>
          <label className="flex items-center gap-2 text-amber-800">
            <input type="checkbox" className="rounded" /> Definir plan vs cada matchup
          </label>
          <label className="flex items-center gap-2 text-amber-800">
            <input type="checkbox" className="rounded" /> Side plan optimizado
          </label>
          <label className="flex items-center gap-2 text-amber-800">
            <input type="checkbox" className="rounded" /> Conocer outs en cada situación
          </label>
          <label className="flex items-center gap-2 text-amber-800">
            <input type="checkbox" className="rounded" /> Repaso final con el team
          </label>
        </div>
      </div>

      {/* Matchup plans */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Planes por Matchup</h3>
          <button
            onClick={() => setEditingPlan("new")}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
          >
            + Nuevo Plan
          </button>
        </div>

        {editingPlan === "new" && (
          <PlanForm
            deckId={selectedDeck}
            allDecks={allDecks.filter((d) => d.id !== selectedDeck)}
            onClose={() => setEditingPlan(null)}
          />
        )}

        {deckPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deckPlans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-gray-900">vs {plan.opponentDeck.name}</h4>
                  <button
                    onClick={() => setEditingPlan(plan.id)}
                    className="text-xs text-indigo-500 hover:text-indigo-700"
                  >
                    Editar
                  </button>
                </div>

                {editingPlan === plan.id ? (
                  <PlanForm
                    deckId={selectedDeck}
                    allDecks={allDecks.filter((d) => d.id !== selectedDeck)}
                    existingPlan={plan}
                    onClose={() => setEditingPlan(null)}
                  />
                ) : (
                  <>
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Plan de juego:</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.plan}</p>
                    </div>
                    {plan.keyCards && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Cartas clave:</p>
                        <p className="text-sm text-gray-700">{plan.keyCards}</p>
                      </div>
                    )}
                    {plan.sideboardPlan && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Side plan:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.sideboardPlan}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Sin planes definidos. Agrega planes para cada matchup importante.</p>
        )}
      </div>
    </div>
  );
}

function PlanForm({
  deckId,
  allDecks,
  existingPlan,
  onClose,
}: {
  deckId: string;
  allDecks: Deck[];
  existingPlan?: Plan;
  onClose: () => void;
}) {
  return (
    <form
      action={async (formData) => {
        formData.set("deckId", deckId);
        if (existingPlan) formData.set("id", existingPlan.id);
        await saveMatchupPlan(formData);
        onClose();
      }}
      className="space-y-3 bg-gray-50 rounded-lg p-4"
    >
      {!existingPlan && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Oponente</label>
          <select name="opponentDeckId" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900">
            <option value="">Seleccionar deck oponente...</option>
            {allDecks.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}
      {existingPlan && <input type="hidden" name="opponentDeckId" value={existingPlan.opponentDeckId} />}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Plan de juego</label>
        <textarea
          name="plan"
          required
          rows={3}
          defaultValue={existingPlan?.plan || ""}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          placeholder="Estrategia general, qué priorizar, cómo ganar..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cartas clave</label>
        <input
          name="keyCards"
          defaultValue={existingPlan?.keyCards || ""}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          placeholder="Cartas importantes en este matchup"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Side plan</label>
        <textarea
          name="sideboardPlan"
          rows={2}
          defaultValue={existingPlan?.sideboardPlan || ""}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          placeholder="IN: ... / OUT: ..."
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          Guardar
        </button>
        <button type="button" onClick={onClose} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
          Cancelar
        </button>
      </div>
    </form>
  );
}
