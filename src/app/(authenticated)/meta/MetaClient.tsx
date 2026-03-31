"use client";

import { useState } from "react";
import { createDeck, updateDeck, deleteDeck } from "@/app/actions";
import { tierLabel, tierColor } from "@/lib/utils";

interface Deck {
  id: string;
  name: string;
  tier: string;
  description: string | null;
  cardList: string | null;
  status: string;
  assignedTo: { id: string; name: string } | null;
}

export default function MetaClient({ decks, isAdmin }: { decks: Deck[]; isAdmin: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [expandedDeck, setExpandedDeck] = useState<string | null>(null);

  const tier1 = decks.filter((d) => d.tier === "TIER1");
  const tier2 = decks.filter((d) => d.tier === "TIER2");
  const rogue = decks.filter((d) => d.tier === "ROGUE");

  return (
    <div>
      {/* Add button */}
      <button
        onClick={() => { setShowForm(true); setEditingDeck(null); }}
        className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
      >
        + Agregar Deck al Meta
      </button>

      {/* Form */}
      {showForm && (
        <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingDeck ? "Editar Deck" : "Nuevo Deck del Meta"}
          </h3>
          <form
            action={async (formData) => {
              if (editingDeck) {
                formData.set("id", editingDeck.id);
                await updateDeck(formData);
              } else {
                await createDeck(formData);
              }
              setShowForm(false);
              setEditingDeck(null);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Deck</label>
                <input
                  name="name"
                  required
                  defaultValue={editingDeck?.name || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                  placeholder="Ej: Elfos Agresivos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                <select
                  name="tier"
                  required
                  defaultValue={editingDeck?.tier || "TIER1"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                >
                  <option value="TIER1">Tier 1 (Los mejores)</option>
                  <option value="TIER2">Tier 2 (Respetables)</option>
                  <option value="ROGUE">Rogue (Sorpresa)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                name="description"
                defaultValue={editingDeck?.description || ""}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                placeholder="Breve descripción de la estrategia del deck"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lista de cartas (una por línea)</label>
              <textarea
                name="cardList"
                defaultValue={editingDeck?.cardList || ""}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm text-gray-900"
                placeholder="3x Elfo Guerrero&#10;2x Bosque Ancestral&#10;..."
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
              >
                {editingDeck ? "Guardar cambios" : "Agregar Deck"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingDeck(null); }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tiers */}
      <TierSection title="🔴 Tier 1 — Los mejores" decks={tier1} isAdmin={isAdmin} onEdit={(d) => { setEditingDeck(d); setShowForm(true); }} expandedDeck={expandedDeck} setExpandedDeck={setExpandedDeck} />
      <TierSection title="🔵 Tier 2 — Respetables" decks={tier2} isAdmin={isAdmin} onEdit={(d) => { setEditingDeck(d); setShowForm(true); }} expandedDeck={expandedDeck} setExpandedDeck={setExpandedDeck} />
      <TierSection title="🟣 Rogue — Sorpresa" decks={rogue} isAdmin={isAdmin} onEdit={(d) => { setEditingDeck(d); setShowForm(true); }} expandedDeck={expandedDeck} setExpandedDeck={setExpandedDeck} />

      {decks.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No hay decks en el meta aún</p>
          <p className="text-sm mt-1">Agrega decks para empezar a mapear el metagame</p>
        </div>
      )}
    </div>
  );
}

function TierSection({
  title, decks, isAdmin, onEdit, expandedDeck, setExpandedDeck,
}: {
  title: string; decks: Deck[]; isAdmin: boolean; onEdit: (d: Deck) => void;
  expandedDeck: string | null; setExpandedDeck: (id: string | null) => void;
}) {
  if (decks.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((deck) => (
          <div key={deck.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{deck.name}</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border ${tierColor(deck.tier)}`}>
                  {tierLabel(deck.tier)}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onEdit(deck)} className="p-1 text-gray-400 hover:text-indigo-600" title="Editar">✏️</button>
                {isAdmin && (
                  <button
                    onClick={async () => {
                      if (confirm("¿Eliminar este deck del meta?")) {
                        await deleteDeck(deck.id);
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Eliminar"
                  >🗑️</button>
                )}
              </div>
            </div>
            {deck.description && <p className="text-sm text-gray-500 mt-2">{deck.description}</p>}
            {deck.assignedTo && (
              <p className="text-xs text-indigo-500 mt-2">👤 Asignado a: {deck.assignedTo.name}</p>
            )}
            {deck.cardList && (
              <button
                onClick={() => setExpandedDeck(expandedDeck === deck.id ? null : deck.id)}
                className="text-xs text-gray-400 hover:text-gray-600 mt-2"
              >
                {expandedDeck === deck.id ? "Ocultar lista ▲" : "Ver lista ▼"}
              </button>
            )}
            {expandedDeck === deck.id && deck.cardList && (
              <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs font-mono text-gray-600 max-h-48 overflow-auto">
                {deck.cardList}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
