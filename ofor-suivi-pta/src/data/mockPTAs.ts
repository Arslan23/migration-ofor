import { PTAStatus } from "@/types/pta";

// Référence PTA partagée entre les modules Planification et Suivi.
// Liste légère (sans activités/indicateurs détaillés) suffisant au filtrage et
// à l'articulation des collectes avec un PTA donné.
export interface PTARef {
  id: string;
  code: string;
  name: string;
  year: number;
  status: PTAStatus;
}

export const mockPTARefs: PTARef[] = [
  { id: "pta-2024-1", code: "PTA-2024-V01", name: "Plan de Travail Annuel 2024", year: 2024, status: "archive" },
  { id: "pta-2025-1", code: "PTA-2025-V01", name: "Plan de Travail Annuel 2025", year: 2025, status: "cloture" },
  { id: "pta-2026-1", code: "PTA-2026-V01", name: "Plan de Travail Annuel 2026", year: 2026, status: "ouvert" },
];

export const getPTARefById = (id?: string | null): PTARef | undefined =>
  id ? mockPTARefs.find(p => p.id === id) : undefined;

export const getOpenPTAs = (): PTARef[] => mockPTARefs.filter(p => p.status === "ouvert");

// Détermine le PTA correspondant à une date de collecte par appariement d'année.
export const getPTAForDate = (dateISO: string): PTARef | undefined => {
  const y = new Date(dateISO).getFullYear();
  return mockPTARefs.find(p => p.year === y);
};
