import { PTAActivity } from "@/types/pta";
import { getServiceById } from "@/data/entitesExecution";
import { getOperationById } from "@/data/operations";

// Activités PTA transverses, non rattachées à un projet (formations institutionnelles,
// audits, communication, supervision globale, etc.). Elles complètent les PTA générés
// à partir des projets pour refléter une planification complète d'un OFOR.
// Chaque activité est rattachée à une OPÉRATION du service responsable.
export const generateStandalonePTAActivities = (yearSeed: number = 0): PTAActivity[] => {
  const year = 2024 + yearSeed;
  const baseId = `pta-standalone-${yearSeed}`;
  // Quelques services pour la cohérence des filtres (DT/DPSE concentrent la majorité)
  const SRV_DT = "srv-3";
  const SRV_DPSE = "srv-4";
  const SRV_DAF = "srv-5";
  const SRV_RH = "srv-6";
  const SRV_COM = "srv-7";

  type Item = Omit<PTAActivity, "id" | "validationStatus" | "validatedAt" | "validatedBy"> & {
    operationId: string;
  };

  const items: Item[] = [
    {
      name: "Plan annuel de formation interne du personnel",
      project: "",
      projectId: "",
      serviceResponsableId: SRV_RH,
      operationId: "op-rh-1",
      budgetTotal: 45000000,
      budgetT1: 10000000, budgetT2: 12000000, budgetT3: 12000000, budgetT4: 11000000,
      deliverables: [
        { id: `${baseId}-d1-1`, unit: "personnes formées", targetValue: 120 },
        { id: `${baseId}-d1-2`, unit: "sessions", targetValue: 8 },
      ],
      trimestres: ["T1", "T2", "T3", "T4"],
      responsable: "Direction RH",
      nature: "Formation",
      description: `Programme transversal de renforcement des capacités du personnel — exercice ${year}`,
    },
    {
      name: "Audit interne et contrôle qualité",
      project: "",
      projectId: "",
      serviceResponsableId: SRV_DAF,
      operationId: "op-fin-2",
      budgetTotal: 35000000,
      budgetT1: 0, budgetT2: 17500000, budgetT3: 0, budgetT4: 17500000,
      deliverables: [
        { id: `${baseId}-d2-1`, unit: "audits", targetValue: 4 },
        { id: `${baseId}-d2-2`, unit: "rapports", targetValue: 4 },
      ],
      trimestres: ["T2", "T4"],
      responsable: "Auditeur interne",
      nature: "Suivi & Évaluation",
      description: "Audits semestriels des processus financiers et opérationnels",
    },
    {
      name: "Campagne nationale de communication eau & assainissement",
      project: "",
      projectId: "",
      serviceResponsableId: SRV_COM,
      operationId: "op-com-1",
      budgetTotal: 60000000,
      budgetT1: 15000000, budgetT2: 15000000, budgetT3: 15000000, budgetT4: 15000000,
      deliverables: [
        { id: `${baseId}-d3-1`, unit: "campagnes", targetValue: 4 },
        { id: `${baseId}-d3-2`, unit: "supports", targetValue: 50 },
        { id: `${baseId}-d3-3`, unit: "bénéficiaires", targetValue: 250000 },
      ],
      trimestres: ["T1", "T2", "T3", "T4"],
      responsable: "Direction Communication",
      nature: "Sensibilisation",
      description: "Campagne institutionnelle multi-canaux à l'échelle nationale",
    },
    {
      name: "Mission de supervision nationale des chantiers",
      project: "",
      projectId: "",
      serviceResponsableId: SRV_DPSE,
      operationId: "op-dpse-1",
      budgetTotal: 90000000,
      budgetT1: 22500000, budgetT2: 22500000, budgetT3: 22500000, budgetT4: 22500000,
      deliverables: [
        { id: `${baseId}-d4-1`, unit: "missions", targetValue: 24 },
        { id: `${baseId}-d4-2`, unit: "rapports", targetValue: 12 },
      ],
      trimestres: ["T1", "T2", "T3", "T4"],
      responsable: "DPSE",
      nature: "Suivi & Évaluation",
      description: "Supervision transversale des chantiers tous projets confondus",
    },
    {
      name: "Schéma directeur du SIG hydraulique",
      project: "",
      projectId: "",
      serviceResponsableId: SRV_DT,
      operationId: "op-dt-1",
      budgetTotal: 75000000,
      budgetT1: 0, budgetT2: 25000000, budgetT3: 30000000, budgetT4: 20000000,
      deliverables: [
        { id: `${baseId}-d5-1`, unit: "études", targetValue: 1 },
        { id: `${baseId}-d5-2`, unit: "cartes", targetValue: 14 },
      ],
      trimestres: ["T2", "T3", "T4"],
      responsable: "Direction Technique",
      nature: "Étude",
      description: "Étude transversale du système d'information géographique des ouvrages",
    },
    {
      name: "Évaluation à mi-parcours du portefeuille projets",
      project: "",
      projectId: "",
      serviceResponsableId: SRV_DPSE,
      operationId: "op-dpse-2",
      budgetTotal: 55000000,
      budgetT1: 0, budgetT2: 0, budgetT3: 35000000, budgetT4: 20000000,
      deliverables: [
        { id: `${baseId}-d6-1`, unit: "évaluations", targetValue: 1 },
        { id: `${baseId}-d6-2`, unit: "rapports", targetValue: 1 },
      ],
      trimestres: ["T3", "T4"],
      responsable: "DPSE",
      nature: "Suivi & Évaluation",
      description: "Évaluation indépendante consolidée — tous projets",
    },
    {
      name: "Acquisition véhicules et équipements bureautiques",
      project: "",
      projectId: "",
      serviceResponsableId: SRV_DAF,
      operationId: "op-fin-1",
      budgetTotal: 120000000,
      budgetT1: 60000000, budgetT2: 60000000, budgetT3: 0, budgetT4: 0,
      deliverables: [
        { id: `${baseId}-d7-1`, unit: "véhicules", targetValue: 3 },
        { id: `${baseId}-d7-2`, unit: "équipements", targetValue: 25 },
      ],
      trimestres: ["T1", "T2"],
      responsable: "DAF",
      nature: "Équipement",
      description: "Renforcement de la flotte et du parc bureautique de l'OFOR",
    },
    {
      name: "Maintenance préventive du parc véhicules",
      project: "",
      projectId: "",
      serviceResponsableId: "srv-8",
      operationId: "op-maint-1",
      budgetTotal: 28000000,
      budgetT1: 7000000, budgetT2: 7000000, budgetT3: 7000000, budgetT4: 7000000,
      deliverables: [
        { id: `${baseId}-d8-1`, unit: "interventions", targetValue: 48 },
        { id: `${baseId}-d8-2`, unit: "véhicules", targetValue: 12 },
      ],
      trimestres: ["T1", "T2", "T3", "T4"],
      responsable: "Division Maintenance",
      nature: "Maintenance",
      description: `Maintenance préventive trimestrielle du parc — exercice ${year}`,
    },
    {
      name: "Administration des infrastructures SI",
      project: "",
      projectId: "",
      serviceResponsableId: "srv-9",
      operationId: "op-si-1",
      budgetTotal: 42000000,
      budgetT1: 10500000, budgetT2: 10500000, budgetT3: 10500000, budgetT4: 10500000,
      deliverables: [
        { id: `${baseId}-d9-1`, unit: "serveurs", targetValue: 8 },
        { id: `${baseId}-d9-2`, unit: "interventions", targetValue: 60 },
        { id: `${baseId}-d9-3`, unit: "rapports", targetValue: 4 },
      ],
      trimestres: ["T1", "T2", "T3", "T4"],
      responsable: "Cellule SI",
      nature: "Maintenance",
      description: "Administration et supervision continue des infrastructures",
    },
    {
      name: "Suivi des ressources en eau (DGPRE-DRE)",
      project: "",
      projectId: "",
      serviceResponsableId: "srv-10",
      operationId: "op-dre-1",
      budgetTotal: 65000000,
      budgetT1: 16250000, budgetT2: 16250000, budgetT3: 16250000, budgetT4: 16250000,
      deliverables: [
        { id: `${baseId}-d10-1`, unit: "stations suivies", targetValue: 45 },
        { id: `${baseId}-d10-2`, unit: "rapports", targetValue: 4 },
        { id: `${baseId}-d10-3`, unit: "missions", targetValue: 12 },
      ],
      trimestres: ["T1", "T2", "T3", "T4"],
      responsable: "DRE",
      nature: "Suivi & Évaluation",
      description: "Suivi quantitatif et qualitatif des nappes et eaux de surface",
    },
    {
      name: "Recrutement et intégration des nouveaux agents",
      project: "",
      projectId: "",
      serviceResponsableId: SRV_RH,
      operationId: "op-rh-2",
      budgetTotal: 18000000,
      budgetT1: 9000000, budgetT2: 0, budgetT3: 9000000, budgetT4: 0,
      deliverables: [
        { id: `${baseId}-d11-1`, unit: "agents recrutés", targetValue: 18 },
        { id: `${baseId}-d11-2`, unit: "sessions d'intégration", targetValue: 2 },
      ],
      trimestres: ["T1", "T3"],
      responsable: "Direction RH",
      nature: "Étude",
      description: "Campagnes de recrutement semestrielles et parcours d'intégration",
    },
    {
      name: "Relations médias et presse",
      project: "",
      projectId: "",
      serviceResponsableId: SRV_COM,
      operationId: "op-com-2",
      budgetTotal: 22000000,
      budgetT1: 5500000, budgetT2: 5500000, budgetT3: 5500000, budgetT4: 5500000,
      deliverables: [
        { id: `${baseId}-d12-1`, unit: "communiqués", targetValue: 24 },
        { id: `${baseId}-d12-2`, unit: "conférences de presse", targetValue: 4 },
      ],
      trimestres: ["T1", "T2", "T3", "T4"],
      responsable: "Direction Communication",
      nature: "Sensibilisation",
      description: "Veille médiatique et communication institutionnelle continue",
    },
  ];

  return items.map((it, idx) => {
    const validationStatus = ((idx + yearSeed) % 5) < 3 ? "valide" : "brouillon";
    const operation = getOperationById(it.operationId);
    const serviceName = getServiceById(it.serviceResponsableId)?.nom || "Service non défini";
    const quarters = it.trimestres;
    const deliverablesQ = it.deliverables.map((d) => {
      const per = quarters.length > 0 ? Math.floor(d.targetValue / quarters.length) : 0;
      const rest = quarters.length > 0 ? d.targetValue - per * quarters.length : 0;
      const tQ: Record<string, number> = { T1: 0, T2: 0, T3: 0, T4: 0 };
      quarters.forEach((q, i) => { tQ[q] = per + (i === 0 ? rest : 0); });
      return { ...d, targetT1: tQ.T1, targetT2: tQ.T2, targetT3: tQ.T3, targetT4: tQ.T4 };
    });
    return {
      ...it,
      deliverables: deliverablesQ,
      project: serviceName,
      operationName: operation?.libelle,
      id: `${baseId}-${idx}`,
      validationStatus,
      validatedAt: validationStatus === "valide" ? `${year}-02-20T10:00:00Z` : undefined,
      validatedBy: validationStatus === "valide" ? "Direction Générale" : undefined,
    } as PTAActivity;
  });
};
