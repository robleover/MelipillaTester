"use client";

import { signOut } from "next-auth/react";

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
      <div className="w-full max-w-md px-4 sm:px-8 py-8 sm:py-10 bg-white rounded-2xl shadow-2xl mx-4 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Cuenta pendiente de activación</h1>
        <p className="text-gray-500 mb-6">
          Tu cuenta fue creada correctamente pero aún no ha sido activada por un administrador del team.
          Contacta al admin para que active tu acceso.
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition"
        >
          Volver al login
        </button>
      </div>
    </div>
  );
}
