"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function FormatSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("format") || "RACIAL_LIBRE";

  function switchFormat(format: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("format", format);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => switchFormat("RACIAL_LIBRE")}
        className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
          current === "RACIAL_LIBRE"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
        }`}
      >
        R. Libre
      </button>
      <button
        onClick={() => switchFormat("RACIAL_EDICION")}
        className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
          current === "RACIAL_EDICION"
            ? "bg-purple-600 text-white shadow-sm"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
        }`}
      >
        R. Edición
      </button>
    </div>
  );
}
