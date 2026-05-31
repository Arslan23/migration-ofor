import { IndicatorType, ActivityNature } from "@/types/project";

// Indicateur du référentiel central, utilisable dans les projets et les CDP
export interface ReferentielIndicator {
  id: string;
  code: string;
  name: string;
  type: IndicatorType;
  // Unités de mesure impliquées dans la méthode de calcul (référence vers UniteMesure.id)
  uniteMesureIds: string[];
  // Natures d'activité auxquelles cet indicateur peut être rattaché
  natures?: ActivityNature[];
  // Formule / méthode de calcul
  methodeCalcul?: string;
  // Unité d'expression du résultat (ex: %, nombre, ratio)
  unitResultat?: string;
  description?: string;
  source?: string;
  frequence?: "mensuelle" | "trimestrielle" | "semestrielle" | "annuelle";
  createdAt: string;
  updatedAt: string;
}

const now = new Date().toISOString();
const mk = (
  id: string,
  code: string,
  name: string,
  type: IndicatorType,
  uniteMesureIds: string[],
  natures: ActivityNature[],
  unitResultat: string,
  methodeCalcul: string,
  description: string,
  frequence: ReferentielIndicator["frequence"] = "trimestrielle",
  source = "Rapports terrain",
): ReferentielIndicator => ({
  id, code, name, type, uniteMesureIds, natures,
  unitResultat, methodeCalcul, description, source, frequence,
  createdAt: now, updatedAt: now,
});

export const REFERENTIEL_INDICATEURS: ReferentielIndicator[] = [
  // === ACCÈS & COUVERTURE (transverses) ===
  mk("ind-ref-1", "IND-001", "Taux d'accès à l'eau potable", "quantitatif",
    ["travaux-1", "travaux-3", "sensibilisation-3"], ["travaux", "sensibilisation"],
    "%", "(Bénéficiaires desservis / Population totale) × 100",
    "Pourcentage de la population ayant accès à un point d'eau potable", "annuelle", "Enquête terrain"),
  mk("ind-ref-2", "IND-002", "Population desservie", "quantitatif",
    ["travaux-1", "travaux-3", "sensibilisation-3"], ["travaux", "sensibilisation"],
    "habitants", "Somme des bénéficiaires raccordés",
    "Population effectivement desservie par les nouveaux ouvrages", "trimestrielle"),

  // === TRAVAUX / OUVRAGES ===
  mk("ind-ref-3", "IND-003", "Nombre de forages réalisés", "quantitatif",
    ["travaux-1"], ["travaux"],
    "forages", "Somme des forages réceptionnés",
    "Nombre cumulé de forages mis en service"),
  mk("ind-ref-4", "IND-004", "Nombre de forages réhabilités", "quantitatif",
    ["travaux-1"], ["travaux", "etude"],
    "forages", "Somme des forages remis en service après diagnostic",
    "Forages anciennement en panne remis en service"),
  mk("ind-ref-5", "IND-005", "Linéaire de réseau posé", "quantitatif",
    ["travaux-2"], ["travaux"],
    "km", "Somme des km de canalisation posés et réceptionnés",
    "Kilomètres de réseau d'adduction installés"),
  mk("ind-ref-6", "IND-006", "Ouvrages hydrauliques construits", "quantitatif",
    ["travaux-3"], ["travaux"],
    "ouvrages", "Somme des ouvrages réceptionnés",
    "Châteaux d'eau, bornes-fontaines et ouvrages annexes"),
  mk("ind-ref-7", "IND-007", "Bâtiments construits", "quantitatif",
    ["travaux-4"], ["travaux"],
    "bâtiments", "Somme des bâtiments réceptionnés",
    "Locaux techniques, abris de groupes, bureaux"),
  mk("ind-ref-8", "IND-008", "Réservoirs de stockage installés", "quantitatif",
    ["travaux-5"], ["travaux", "equipement"],
    "réservoirs", "Somme des réservoirs mis en service",
    "Capacité de stockage déployée sur le terrain"),
  mk("ind-ref-9", "IND-009", "Branchements particuliers réalisés", "quantitatif",
    ["travaux-6"], ["travaux"],
    "branchements", "Somme des branchements abonnés activés",
    "Nouveaux branchements domiciliaires raccordés au réseau"),
  mk("ind-ref-10", "IND-010", "Taux de réception des ouvrages", "quantitatif",
    ["travaux-1", "travaux-3", "travaux-4"], ["travaux"],
    "%", "(Ouvrages réceptionnés / Ouvrages planifiés) × 100",
    "Niveau de réalisation physique des ouvrages programmés", "trimestrielle"),

  // === ÉTUDES ===
  mk("ind-ref-11", "IND-011", "Études techniques livrées", "quantitatif",
    ["etude-1", "etude-2"], ["etude"],
    "études", "Somme des rapports d'étude validés",
    "Études techniques et de faisabilité finalisées", "semestrielle"),
  mk("ind-ref-12", "IND-012", "Sites identifiés et validés", "quantitatif",
    ["etude-4"], ["etude"],
    "sites", "Somme des sites validés à l'issue des études",
    "Sites retenus pour implantation suite aux études géophysiques"),
  mk("ind-ref-13", "IND-013", "Diagnostics réalisés", "quantitatif",
    ["etude-3"], ["etude", "suivi"],
    "diagnostics", "Somme des diagnostics finalisés",
    "Diagnostics techniques d'ouvrages ou organisationnels"),
  mk("ind-ref-14", "IND-014", "Dossiers techniques produits", "quantitatif",
    ["etude-5", "etude-6"], ["etude"],
    "dossiers", "Somme des DAO/dossiers techniques produits",
    "Dossiers d'appel d'offre et plans techniques", "semestrielle"),

  // === FORMATION & RENFORCEMENT DE CAPACITÉS ===
  mk("ind-ref-15", "IND-015", "Personnes formées", "quantitatif",
    ["formation-1", "formation-2"], ["formation"],
    "personnes", "Somme des participants formés",
    "Nombre cumulé de personnes ayant suivi une formation"),
  mk("ind-ref-16", "IND-016", "Taux de personnel formé", "quantitatif",
    ["formation-1"], ["formation"],
    "%", "(Personnes formées / Cible totale) × 100",
    "Pourcentage du personnel cible ayant été formé", "semestrielle"),
  mk("ind-ref-17", "IND-017", "ASUFOR formées", "quantitatif",
    ["formation-3"], ["formation", "sensibilisation"],
    "ASUFOR", "Somme des associations d'usagers formées",
    "Associations d'usagers de forages renforcées en gestion"),
  mk("ind-ref-18", "IND-018", "Opérateurs/délégataires formés", "quantitatif",
    ["formation-4"], ["formation"],
    "opérateurs", "Somme des opérateurs formés",
    "Opérateurs et délégataires ayant achevé un cycle de formation"),
  mk("ind-ref-19", "IND-019", "Sessions de formation organisées", "quantitatif",
    ["formation-2", "formation-5"], ["formation"],
    "sessions", "Somme des sessions tenues",
    "Sessions et modules de formation réalisés"),

  // === ÉQUIPEMENTS ===
  mk("ind-ref-20", "IND-020", "Pompes installées", "quantitatif",
    ["equipement-1"], ["equipement", "travaux"],
    "pompes", "Somme des pompes installées et réceptionnées",
    "Pompes d'exhaure mises en service"),
  mk("ind-ref-21", "IND-021", "Systèmes solaires déployés", "quantitatif",
    ["equipement-1", "equipement-4"], ["equipement", "travaux"],
    "systèmes", "Somme des systèmes photovoltaïques opérationnels",
    "Équipements solaires installés sur les forages ruraux"),
  mk("ind-ref-22", "IND-022", "Compteurs installés", "quantitatif",
    ["equipement-6"], ["equipement"],
    "compteurs", "Somme des compteurs posés",
    "Compteurs abonnés ou de production installés"),
  mk("ind-ref-23", "IND-023", "Véhicules acquis", "quantitatif",
    ["equipement-3"], ["equipement"],
    "véhicules", "Somme des véhicules réceptionnés",
    "Véhicules opérationnels mis à disposition", "annuelle"),

  // === SENSIBILISATION ===
  mk("ind-ref-24", "IND-024", "Bénéficiaires sensibilisés", "quantitatif",
    ["sensibilisation-3"], ["sensibilisation"],
    "personnes", "Somme des bénéficiaires touchés par les actions",
    "Personnes touchées par les campagnes de sensibilisation"),
  mk("ind-ref-25", "IND-025", "Villages sensibilisés", "quantitatif",
    ["sensibilisation-2"], ["sensibilisation"],
    "villages", "Somme des villages couverts",
    "Villages ayant bénéficié d'au moins une action de sensibilisation"),
  mk("ind-ref-26", "IND-026", "Campagnes de communication menées", "quantitatif",
    ["sensibilisation-4", "sensibilisation-5"], ["sensibilisation"],
    "campagnes", "Somme des campagnes réalisées",
    "Campagnes média et supports de communication produits", "semestrielle"),

  // === SUIVI & ÉVALUATION ===
  mk("ind-ref-27", "IND-027", "Missions de suivi terrain", "quantitatif",
    ["suivi-1", "suivi-5"], ["suivi"],
    "missions", "Somme des missions terrain effectuées",
    "Missions de supervision sur les chantiers et ouvrages"),
  mk("ind-ref-28", "IND-028", "Rapports de suivi produits", "quantitatif",
    ["suivi-2"], ["suivi"],
    "rapports", "Somme des rapports périodiques produits",
    "Rapports trimestriels, semestriels et annuels"),
  mk("ind-ref-29", "IND-029", "Évaluations réalisées", "quantitatif",
    ["suivi-3", "suivi-4"], ["suivi"],
    "évaluations", "Somme des évaluations et audits clôturés",
    "Évaluations à mi-parcours, finales et audits", "annuelle"),

  // === PERFORMANCE OPÉRATIONNELLE (transverse) ===
  mk("ind-ref-30", "IND-030", "Taux de fonctionnalité des ouvrages", "quantitatif",
    ["travaux-1", "travaux-3", "equipement-1"], ["travaux", "equipement", "suivi"],
    "%", "(Ouvrages fonctionnels / Ouvrages totaux) × 100",
    "Part des ouvrages opérationnels dans le parc", "trimestrielle"),
  mk("ind-ref-31", "IND-031", "Taux d'exécution budgétaire", "quantitatif",
    [], ["etude", "travaux", "formation", "equipement", "sensibilisation", "suivi", "autre"],
    "%", "(Dépenses engagées / Budget alloué) × 100",
    "Niveau de consommation budgétaire des activités", "trimestrielle", "Système comptable"),
  mk("ind-ref-32", "IND-032", "Délai moyen de mise en service", "quantitatif",
    ["travaux-1", "travaux-3"], ["travaux"],
    "jours", "Moyenne (Date mise en service - Date réception travaux)",
    "Délai moyen entre réception technique et mise en service effective", "semestrielle"),

  // === QUALITATIFS ===
  mk("ind-ref-33", "IND-033", "Niveau de satisfaction des bénéficiaires", "qualitatif",
    ["sensibilisation-3"], ["sensibilisation", "suivi"],
    "score (1-5)", "Moyenne des scores d'enquête de satisfaction",
    "Satisfaction perçue par les usagers des services d'eau", "annuelle", "Enquête bénéficiaires"),
  mk("ind-ref-34", "IND-034", "Qualité de la gouvernance ASUFOR", "qualitatif",
    ["formation-3"], ["formation", "suivi"],
    "score (A-D)", "Évaluation grille de gouvernance",
    "Niveau de structuration et fonctionnement des ASUFOR", "annuelle"),
];

/**
 * Récupère un indicateur du référentiel via son id ou son code.
 * Utilisé pour résoudre les unités de mesure (`uniteMesureIds`) liées à un
 * indicateur PTA / projet à partir de son identifiant ou code.
 */
export const getReferentielIndicatorByIdOrCode = (
  idOrCode?: string,
): ReferentielIndicator | undefined => {
  if (!idOrCode) return undefined;
  return REFERENTIEL_INDICATEURS.find(
    (i) => i.id === idOrCode || i.code === idOrCode,
  );
};

/**
 * Renvoie les ids d'unités de mesure déclarées sur l'indicateur référentiel
 * correspondant (recherche par id puis par code). Tableau vide si aucun match.
 */
export const getUniteMesureIdsForIndicator = (
  idOrCode?: string,
  fallbackCode?: string,
): string[] => {
  const ind =
    getReferentielIndicatorByIdOrCode(idOrCode) ||
    getReferentielIndicatorByIdOrCode(fallbackCode);
  return ind?.uniteMesureIds || [];
};

