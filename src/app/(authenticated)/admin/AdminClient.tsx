"use client";

import { useState } from "react";
import { createInvitation, updateUserRole, toggleUserActive } from "@/app/actions";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  token: string;
  used: boolean;
  expiresAt: string;
  createdAt: string;
}

interface Season {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
}

export default function AdminClient({
  members,
  invitations,
  seasons,
  team,
  currentUserId,
}: {
  members: Member[];
  invitations: Invitation[];
  seasons: Season[];
  team: Team | null;
  currentUserId: string;
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("email", inviteEmail);
    const token = await createInvitation(formData);
    const baseUrl = window.location.origin;
    setInviteResult(`${baseUrl}/register?token=${token}`);
    setInviteEmail("");
  };

  return (
    <div className="space-y-8">
      {/* Team info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">🏆 {team?.name}</h2>
        <p className="text-sm text-gray-500">{team?.description}</p>
        <p className="text-sm text-gray-400 mt-1">{members.length} miembros</p>
      </div>

      {/* Members */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">👥 Miembros del Team</h2>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
          >
            + Invitar Miembro
          </button>
        </div>

        {showInviteForm && (
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="email@ejemplo.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
              />
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
                Enviar Invitación
              </button>
            </form>
            {inviteResult && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">Link de invitación generado:</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-white px-2 py-1 rounded border flex-1 break-all text-green-700">
                    {inviteResult}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteResult);
                    }}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                  >
                    Copiar
                  </button>
                </div>
                <p className="text-xs text-green-600 mt-1">Comparte este link con el jugador. Expira en 7 días.</p>
              </div>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Desde</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{m.email}</td>
                <td className="px-4 py-3">
                  {m.id === currentUserId ? (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">Admin (tú)</span>
                  ) : (
                    <select
                      value={m.role}
                      onChange={(e) => updateUserRole(m.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-700"
                    >
                      <option value="MEMBER">Miembro</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  )}
                </td>
                <td className="px-4 py-3">
                  {m.id === currentUserId ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Activo</span>
                  ) : (
                    <button
                      onClick={() => toggleUserActive(m.id, !m.active)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                        m.active
                          ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                          : "bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700"
                      }`}
                    >
                      {m.active ? "Activo" : "Inactivo"}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(m.createdAt).toLocaleDateString("es-CL")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Invitations */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📧 Invitaciones</h2>
        {invitations.length > 0 ? (
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm text-gray-700">{inv.email}</p>
                  <p className="text-xs text-gray-400">
                    Expira: {new Date(inv.expiresAt).toLocaleDateString("es-CL")}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    inv.used
                      ? "bg-green-100 text-green-700"
                      : new Date(inv.expiresAt) < new Date()
                        ? "bg-gray-100 text-gray-500"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {inv.used ? "Usada" : new Date(inv.expiresAt) < new Date() ? "Expirada" : "Pendiente"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No hay invitaciones.</p>
        )}
      </div>

      {/* Seasons */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📅 Temporadas</h2>
        <div className="space-y-2">
          {seasons.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{s.name}</p>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  s.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {s.status === "ACTIVE" ? "Activa" : "Cerrada"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
