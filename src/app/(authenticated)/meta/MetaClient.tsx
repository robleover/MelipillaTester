"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { createDeck, updateDeck, deleteDeck, reorderDecks } from "@/app/actions";

interface Deck {
  id: string;
  name: string;
  tier: string;
  description: string | null;
  imageUrl: string | null;
  cardList: string | null;
  status: string;
  position: number;
  createdBy: { id: string; name: string } | null;
  assignedTo: { id: string; name: string } | null;
}

type TierKey = "TIER1" | "TIER2" | "ROGUE" | "TIER3";

const TIERS: { key: TierKey; label: string; color: string; bg: string; border: string; glow: string }[] = [
  { key: "TIER1", label: "S", color: "bg-red-500", bg: "bg-red-500/10", border: "border-red-500/40", glow: "shadow-red-500/20" },
  { key: "TIER2", label: "A", color: "bg-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/40", glow: "shadow-blue-500/20" },
  { key: "ROGUE", label: "B", color: "bg-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/40", glow: "shadow-purple-500/20" },
  { key: "TIER3", label: "C", color: "bg-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/40", glow: "shadow-emerald-500/20" },
];

export default function MetaClient({ decks: initialDecks, isAdmin, format }: { decks: Deck[]; isAdmin: boolean; format: string }) {
  const [decks, setDecks] = useState<Deck[]>(initialDecks);
  const [showForm, setShowForm] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [expandedDeck, setExpandedDeck] = useState<string | null>(null);
  const [draggedDeck, setDraggedDeck] = useState<Deck | null>(null);
  const [dropTarget, setDropTarget] = useState<TierKey | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ tier: TierKey; index: number } | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const getDecksByTier = useCallback(
    (tier: TierKey) => decks.filter((d) => d.tier === tier).sort((a, b) => a.position - b.position),
    [decks]
  );

  const handleDragStart = (e: React.DragEvent, deck: Deck) => {
    setDraggedDeck(deck);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", deck.id);
    if (dragRef.current) dragRef.current.style.opacity = "0.4";
  };

  const handleDragEnd = () => {
    setDraggedDeck(null);
    setDropTarget(null);
    setDropIndicator(null);
    if (dragRef.current) dragRef.current.style.opacity = "1";
  };

  const handleDragOverTier = (e: React.DragEvent, tier: TierKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(tier);
  };

  const handleDragOverCard = (e: React.DragEvent, tier: TierKey, cardIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const insertIndex = e.clientX < midX ? cardIndex : cardIndex + 1;
    setDropIndicator({ tier, index: insertIndex });
    setDropTarget(tier);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
    setDropIndicator(null);
  };

  const handleDrop = async (e: React.DragEvent, tier: TierKey) => {
    e.preventDefault();
    const indicator = dropIndicator;
    setDropTarget(null);
    setDropIndicator(null);

    if (!draggedDeck) { setDraggedDeck(null); return; }

    const isSameTier = draggedDeck.tier === tier;

    // Get tier decks without the dragged one
    const tierDecks = decks
      .filter((d) => d.tier === tier && d.id !== draggedDeck.id)
      .sort((a, b) => a.position - b.position);

    // Determine insertion index
    let insertIdx: number;
    if (indicator?.tier === tier) {
      // Adjust: if same tier and we removed the dragged deck from before the insert point, shift back
      if (isSameTier) {
        const originalSorted = decks.filter((d) => d.tier === tier).sort((a, b) => a.position - b.position);
        const origIdx = originalSorted.findIndex((d) => d.id === draggedDeck.id);
        insertIdx = origIdx < indicator.index ? indicator.index - 1 : indicator.index;
      } else {
        insertIdx = indicator.index;
      }
    } else {
      insertIdx = tierDecks.length; // append at end
    }
    insertIdx = Math.max(0, Math.min(insertIdx, tierDecks.length));

    // Check if position actually changed
    if (isSameTier) {
      const currentSorted = decks.filter((d) => d.tier === tier).sort((a, b) => a.position - b.position);
      const currentIdx = currentSorted.findIndex((d) => d.id === draggedDeck.id);
      if (currentIdx === insertIdx) { setDraggedDeck(null); return; }
    }

    // Build new order
    tierDecks.splice(insertIdx, 0, { ...draggedDeck, tier });
    const orderUpdates: { id: string; tier: string; position: number }[] = tierDecks.map((d, i) => ({ id: d.id, tier, position: i }));

    // If cross-tier, also reindex old tier
    if (!isSameTier) {
      const oldTierDecks = decks
        .filter((d) => d.tier === draggedDeck.tier && d.id !== draggedDeck.id)
        .sort((a, b) => a.position - b.position);
      oldTierDecks.forEach((d, i) => orderUpdates.push({ id: d.id, tier: d.tier, position: i }));
    }

    // Optimistic update
    const prevDecks = [...decks];
    const updateMap = new Map(orderUpdates.map((u) => [u.id, u]));
    setDecks((prev) =>
      prev.map((d) => {
        const upd = updateMap.get(d.id);
        return upd ? { ...d, tier: upd.tier, position: upd.position } : d;
      })
    );
    setDraggedDeck(null);

    try {
      await reorderDecks(orderUpdates);
    } catch {
      setDecks(prevDecks);
    }
  };

  const handleMoveWithinTier = async (deck: Deck, direction: -1 | 1) => {
    const tierDecks = decks.filter((d) => d.tier === deck.tier).sort((a, b) => a.position - b.position);
    const idx = tierDecks.findIndex((d) => d.id === deck.id);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= tierDecks.length) return;

    // Swap
    [tierDecks[idx], tierDecks[newIdx]] = [tierDecks[newIdx], tierDecks[idx]];
    const orderUpdates = tierDecks.map((d, i) => ({ id: d.id, tier: d.tier, position: i }));

    const prevDecks = [...decks];
    const updateMap = new Map(orderUpdates.map((u) => [u.id, u]));
    setDecks((prev) => prev.map((d) => { const upd = updateMap.get(d.id); return upd ? { ...d, position: upd.position } : d; }));

    try {
      await reorderDecks(orderUpdates);
    } catch {
      setDecks(prevDecks);
    }
  };

  const pyramidWidth = (tier: TierKey) => {
    switch (tier) {
      case "TIER1": return "lg:max-w-2xl";
      case "TIER2": return "lg:max-w-4xl";
      case "ROGUE": return "lg:max-w-6xl";
      case "TIER3": return "lg:max-w-full";
    }
  };

  return (
    <div>
      <button
        onClick={() => { setShowForm(true); setEditingDeck(null); }}
        className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
      >
        + Agregar Deck al Meta
      </button>

      {showForm && (
        <DeckForm
          editingDeck={editingDeck}
          format={format}
          onClose={() => { setShowForm(false); setEditingDeck(null); }}
          onSaved={(deck, isEdit) => {
            if (isEdit) setDecks((prev) => prev.map((d) => (d.id === deck.id ? deck : d)));
            setShowForm(false);
            setEditingDeck(null);
          }}
        />
      )}

      {/* TierMaker Pyramid */}
      <div className="flex flex-col items-center gap-0">
        {TIERS.map((tier) => {
          const tierDecks = getDecksByTier(tier.key);
          const isOver = dropTarget === tier.key;
          return (
            <div key={tier.key} className={`w-full ${pyramidWidth(tier.key)} mx-auto transition-all duration-300`}>
              <div
                onDragOver={(e) => handleDragOverTier(e, tier.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, tier.key)}
                className={`
                  relative flex items-stretch rounded-2xl border-2 transition-all duration-200
                  ${tier.bg} ${tier.border}
                  ${isOver ? `shadow-lg ${tier.glow} scale-[1.01] border-dashed` : ""}
                  min-h-[80px] sm:min-h-[100px] mb-0
                `}
              >
                <div className={`flex-shrink-0 w-10 sm:w-16 flex items-center justify-center rounded-l-2xl ${tier.color} text-white font-black text-xl sm:text-3xl`}>
                  {tier.label}
                </div>
                <div className="flex-1 p-2 sm:p-3 flex flex-wrap items-center gap-2 min-h-[80px] sm:min-h-[100px]">
                  {tierDecks.length === 0 && !isOver && (
                    <span className="text-gray-400 text-xs sm:text-sm italic mx-auto">
                      <span className="hidden sm:inline">Arrastra decks aquí</span>
                      <span className="sm:hidden">Toca un deck para mover</span>
                    </span>
                  )}
                  {isOver && draggedDeck && draggedDeck.tier !== tier.key && tierDecks.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <span className="bg-white/80 backdrop-blur px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 shadow">
                        Soltar en {tier.label}
                      </span>
                    </div>
                  )}
                  {tierDecks.map((deck, idx) => (
                    <React.Fragment key={deck.id}>
                      {dropIndicator?.tier === tier.key && dropIndicator.index === idx && draggedDeck && draggedDeck.id !== deck.id && (
                        <div className="w-1 self-stretch bg-indigo-500 rounded-full animate-pulse min-h-[60px]" />
                      )}
                      <DeckCard
                        deck={deck}
                        tier={tier}
                        tiers={TIERS}
                        isAdmin={isAdmin}
                        isDragging={draggedDeck?.id === deck.id}
                        expanded={expandedDeck === deck.id}
                        onToggleExpand={() => setExpandedDeck(expandedDeck === deck.id ? null : deck.id)}
                        onEdit={() => { setEditingDeck(deck); setShowForm(true); }}
                        onDelete={async () => {
                          if (confirm("¿Eliminar este deck del meta?")) {
                            await deleteDeck(deck.id);
                            setDecks((prev) => prev.filter((d) => d.id !== deck.id));
                          }
                        }}
                        onDragStart={(e) => { dragRef.current = e.currentTarget as HTMLDivElement; handleDragStart(e, deck); }}
                        onDragEnd={handleDragEnd}
                        onDragOverCard={(e) => handleDragOverCard(e, tier.key, idx)}
                        onMoveTier={async (newTier: TierKey) => {
                          const prevDecks = [...decks];
                          const targetDecks = decks.filter((d) => d.tier === newTier).sort((a, b) => a.position - b.position);
                          const newPosition = targetDecks.length;
                          const oldTierDecks = decks.filter((d) => d.tier === deck.tier && d.id !== deck.id).sort((a, b) => a.position - b.position);
                          const orderUpdates: { id: string; tier: string; position: number }[] = [
                            { id: deck.id, tier: newTier, position: newPosition },
                            ...oldTierDecks.map((d, i) => ({ id: d.id, tier: d.tier, position: i })),
                          ];
                          const updateMap = new Map(orderUpdates.map((u) => [u.id, u]));
                          setDecks((prev) => prev.map((d) => { const upd = updateMap.get(d.id); return upd ? { ...d, tier: upd.tier, position: upd.position } : d; }));
                          try { await reorderDecks(orderUpdates); } catch { setDecks(prevDecks); }
                        }}
                        onMoveLeft={() => handleMoveWithinTier(deck, -1)}
                        onMoveRight={() => handleMoveWithinTier(deck, 1)}
                        isFirst={idx === 0}
                        isLast={idx === tierDecks.length - 1}
                      />
                    </React.Fragment>
                  ))}
                  {dropIndicator?.tier === tier.key && dropIndicator.index === tierDecks.length && draggedDeck && (
                    <div className="w-1 self-stretch bg-indigo-500 rounded-full animate-pulse min-h-[60px]" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {decks.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🃏</div>
          <p className="text-lg font-medium">No hay decks en el meta aún</p>
          <p className="text-sm mt-1">Agrega decks y arrástralos entre tiers para clasificarlos</p>
        </div>
      )}
    </div>
  );
}

function DeckCard({
  deck, tier, tiers, isAdmin, isDragging, expanded, onToggleExpand, onEdit, onDelete, onDragStart, onDragEnd, onDragOverCard, onMoveTier, onMoveLeft, onMoveRight, isFirst, isLast,
}: {
  deck: Deck; tier: (typeof TIERS)[number]; tiers: typeof TIERS; isAdmin: boolean; isDragging: boolean;
  expanded: boolean; onToggleExpand: () => void; onEdit: () => void; onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void; onDragEnd: () => void; onDragOverCard: (e: React.DragEvent) => void;
  onMoveTier: (tier: TierKey) => void; onMoveLeft: () => void; onMoveRight: () => void;
  isFirst: boolean; isLast: boolean;
}) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const otherTiers = tiers.filter((t) => t.key !== tier.key);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOverCard}
      className={`
        group relative bg-white rounded-xl border shadow-sm
        cursor-grab active:cursor-grabbing select-none
        transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
        ${isDragging ? "opacity-40 scale-95 ring-2 ring-indigo-400" : ""}
        ${tier.border} w-[calc(50%-4px)] sm:w-[140px]
      `}
    >
      <div className={`h-1.5 rounded-t-xl ${tier.color}`} />
      {deck.imageUrl && (
        <div className="w-full aspect-[3/4] relative overflow-hidden">
          <Image src={deck.imageUrl} alt={deck.name} fill className="object-cover" draggable={false} sizes="140px" />
        </div>
      )}
      <div className="p-2 sm:p-2.5">
        <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight truncate" title={deck.name}>{deck.name}</p>
        {deck.createdBy && <p className="text-[10px] text-gray-400 mt-0.5 truncate" title={`Creado por ${deck.createdBy.name}`}>por {deck.createdBy.name}</p>}
        {deck.description && <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1 line-clamp-2">{deck.description}</p>}
        {deck.assignedTo && <p className="text-[10px] text-indigo-500 mt-1 truncate">👤 {deck.assignedTo.name}</p>}
        <div className="flex items-center justify-between mt-1.5 sm:mt-2 gap-1">
          {deck.cardList ? (
            <button onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} className="text-[10px] text-gray-400 hover:text-gray-600">
              {expanded ? "▲" : "▼"}
            </button>
          ) : <span />}
          <div className="flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition ml-auto">
            {/* Mobile: reorder within tier */}
            {!isFirst && (
              <button onClick={(e) => { e.stopPropagation(); onMoveLeft(); }} className="sm:hidden p-0.5 text-gray-400 hover:text-indigo-500 text-xs" title="Mover izquierda">◀</button>
            )}
            {!isLast && (
              <button onClick={(e) => { e.stopPropagation(); onMoveRight(); }} className="sm:hidden p-0.5 text-gray-400 hover:text-indigo-500 text-xs" title="Mover derecha">▶</button>
            )}
            {/* Mobile: move tier button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowMoveMenu(!showMoveMenu); }}
              className="sm:hidden p-0.5 text-gray-400 hover:text-indigo-500 text-xs"
              title="Mover tier"
            >↕️</button>
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-0.5 text-gray-400 hover:text-indigo-500 text-xs" title="Editar">✏️</button>
            {isAdmin && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-0.5 text-gray-400 hover:text-red-500 text-xs" title="Eliminar">🗑️</button>
            )}
          </div>
        </div>
        {/* Mobile move tier dropdown */}
        {showMoveMenu && (
          <div className="sm:hidden flex gap-1 mt-1.5 pt-1.5 border-t border-gray-100">
            {otherTiers.map((t) => (
              <button
                key={t.key}
                onClick={(e) => { e.stopPropagation(); setShowMoveMenu(false); onMoveTier(t.key); }}
                className={`flex-1 text-[10px] font-bold py-1 rounded ${t.color} text-white`}
              >
                → {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {expanded && deck.cardList && (
        <div className="border-t border-gray-100 px-2 sm:px-2.5 py-2">
          <pre className="text-[10px] font-mono text-gray-500 max-h-32 overflow-auto whitespace-pre-wrap">{deck.cardList}</pre>
        </div>
      )}
    </div>
  );
}

function DeckForm({ editingDeck, format, onClose, onSaved }: {
  editingDeck: Deck | null; format: string; onClose: () => void;
  onSaved: (deck: Deck, isEdit: boolean) => void;
}) {
  const [imagePreview, setImagePreview] = useState<string | null>(editingDeck?.imageUrl || null);
  const [imageUrl, setImageUrl] = useState<string>(editingDeck?.imageUrl || "");
  const [uploading, setUploading] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) { const err = await res.json(); alert(err.error || "Error al subir imagen"); setUploading(false); return; }
      const data = await res.json();
      setImageUrl(data.url);
    } catch { alert("Error al subir imagen"); }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 w-full sm:max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">{editingDeck ? "Editar Deck" : "Nuevo Deck del Meta"}</h3>
        <form
          action={async (formData) => {
            formData.set("imageUrl", imageUrl);
            formData.set("format", format);
            if (editingDeck) {
              formData.set("id", editingDeck.id);
              await updateDeck(formData);
              onSaved({ ...editingDeck, name: formData.get("name") as string, tier: formData.get("tier") as string, description: (formData.get("description") as string) || null, imageUrl: imageUrl || null, cardList: (formData.get("cardList") as string) || null }, true);
            } else {
              await createDeck(formData);
              onClose();
              window.location.reload();
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Deck</label>
            {imagePreview && (
              <div className="mb-2 relative w-32 aspect-[3/4] rounded-lg overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setImagePreview(null); setImageUrl(""); }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/80">×</button>
              </div>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            {uploading && <p className="text-xs text-indigo-500 mt-1">Subiendo imagen...</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Deck</label>
              <input name="name" required defaultValue={editingDeck?.name || ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" placeholder="Ej: Elfos Agresivos" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select name="tier" required defaultValue={editingDeck?.tier || "TIER1"} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                <option value="TIER1">S — Tier 1 (Los mejores)</option>
                <option value="TIER2">A — Tier 2 (Respetables)</option>
                <option value="ROGUE">B — Rogue (Sorpresa)</option>
                <option value="TIER3">C — Tier 3 (Inferior)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea name="description" defaultValue={editingDeck?.description || ""} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" placeholder="Breve descripción de la estrategia del deck" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lista de cartas (una por línea)</label>
            <textarea name="cardList" defaultValue={editingDeck?.cardList || ""} rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm text-gray-900" placeholder={"3x Elfo Guerrero\n2x Bosque Ancestral\n..."} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm">{editingDeck ? "Guardar cambios" : "Agregar Deck"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
