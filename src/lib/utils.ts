import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getWinrateColor(winrate: number): string {
  if (winrate >= 60) return "text-green-600 bg-green-50";
  if (winrate >= 40) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
}

export function getWinrateBgColor(winrate: number): string {
  if (winrate >= 60) return "bg-green-500";
  if (winrate >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

export function calculateWinrate(wins: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((wins / total) * 100 * 10) / 10;
}

export function tierLabel(tier: string): string {
  switch (tier) {
    case "TIER1": return "Tier 1";
    case "TIER2": return "Tier 2";
    case "ROGUE": return "Rogue";
    default: return tier;
  }
}

export function tierColor(tier: string): string {
  switch (tier) {
    case "TIER1": return "bg-red-100 text-red-800 border-red-200";
    case "TIER2": return "bg-blue-100 text-blue-800 border-blue-200";
    case "ROGUE": return "bg-purple-100 text-purple-800 border-purple-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case "TESTING": return "En testeo";
    case "DISCARDED": return "Descartado";
    case "CHOSEN": return "Elegido";
    default: return status;
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "TESTING": return "bg-yellow-100 text-yellow-800";
    case "DISCARDED": return "bg-gray-100 text-gray-500";
    case "CHOSEN": return "bg-green-100 text-green-800";
    default: return "bg-gray-100 text-gray-800";
  }
}
