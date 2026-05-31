import { mockProjects } from "@/data/mockProjects";
import { getAllUnitesMesure, UniteMesure } from "@/types/project";

export interface UnitContributor {
  projectId: string;
  projectName: string;
  source: "deliverable" | "indicator";
  name: string;
  current: number;
  target: number;
  updatedAt?: string;
}

export interface PerUnitAggregation {
  uniteMesure: UniteMesure;
  /** Mode d'agrégation : moyenne pour les unités exprimées en %, somme sinon */
  mode: "sum" | "average";
  totalCurrent: number;
  totalTarget: number;
  achievementRate: number;
  contributors: UnitContributor[];
  /** Date de la dernière mise à jour PTA utilisée dans l'agrégat */
  lastUpdate?: string;
}

export interface MultiUnitAggregation {
  /** Agrégat détaillé par unité de mesure */
  units: PerUnitAggregation[];
  /** Nombre total de contributions PTA prises en compte */
  totalContributors: number;
  /** Date la plus récente parmi toutes les unités */
  lastUpdate?: string;
}

const isPercentUnit = (u: UniteMesure) => {
  const n = (u.code + " " + u.name).toLowerCase();
  return n.includes("%") || n.includes("pourcent") || n.includes("taux");
};

/**
 * Agrège les dernières réalisations PTA pour les unités de mesure
 * explicitement déclarées sur l'indicateur CDP.
 *
 * - Source primaire : livrables d'activités liés via `uniteMesureId`
 * - Source secondaire : livrables avec `unit` libre correspondant au code/nom de l'unité
 * - Règle : moyenne si l'unité représente un %/taux, sinon somme
 * - Renvoie pour chaque unité la date de dernière mise à jour utilisée
 */
export const aggregateRealisationsByUniteIds = (
  uniteMesureIds: string[],
  year?: number,
): MultiUnitAggregation => {
  const all = getAllUnitesMesure();
  const units: PerUnitAggregation[] = [];

  uniteMesureIds.forEach((uid) => {
    const unite = all.find((u) => u.id === uid);
    if (!unite) return;
    const percent = isPercentUnit(unite);
    const contributors: UnitContributor[] = [];

    mockProjects.forEach((p: any) => {
      (p.activities || []).forEach((act: any) => {
        (act.deliverables || []).forEach((d: any) => {
          const matchById = d.uniteMesureId === uid || d.uniteMesure?.id === uid;
          const dUnitLabel = (d.uniteMesure?.code || d.unit || "").toString().toLowerCase();
          const matchByName = !matchById && (dUnitLabel === unite.code.toLowerCase() || dUnitLabel === unite.name.toLowerCase());
          if (!matchById && !matchByName) return;
          const updatedAt = act.updatedAt || p.updatedAt;
          if (year && updatedAt) {
            const y = new Date(updatedAt).getFullYear();
            if (y !== year) return;
          }
          contributors.push({
            projectId: p.id,
            projectName: p.name,
            source: "deliverable",
            name: d.name || unite.name,
            current: Number(d.currentValue) || 0,
            target: Number(d.targetValue) || 0,
            updatedAt,
          });
        });
      });
    });

    const sumCurrent = contributors.reduce((s, c) => s + c.current, 0);
    const sumTarget = contributors.reduce((s, c) => s + c.target, 0);
    const count = contributors.length;
    const totalCurrent = percent && count > 0 ? Math.round((sumCurrent / count) * 100) / 100 : sumCurrent;
    const totalTarget = percent && count > 0 ? Math.round((sumTarget / count) * 100) / 100 : sumTarget;
    const achievementRate = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;
    const lastUpdate = contributors
      .map((c) => c.updatedAt)
      .filter(Boolean)
      .sort()
      .pop();

    units.push({
      uniteMesure: unite,
      mode: percent ? "average" : "sum",
      totalCurrent,
      totalTarget,
      achievementRate,
      contributors,
      lastUpdate,
    });
  });

  const totalContributors = units.reduce((s, u) => s + u.contributors.length, 0);
  const lastUpdate = units
    .map((u) => u.lastUpdate)
    .filter(Boolean)
    .sort()
    .pop();

  return { units, totalContributors, lastUpdate };
};

export const formatAggregationDate = (iso?: string): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
};
