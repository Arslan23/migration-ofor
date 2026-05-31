import { ReferentielIndicator } from '../models/referentiel-indicator.model';

const now = new Date().toISOString();
const mk = (
  id: string,
  code: string,
  name: string,
  type: ReferentielIndicator['type'],
  uniteMesureIds: string[],
  natures: ReferentielIndicator['natures'],
  unitResultat: string,
  methodeCalcul: string,
  description: string,
  frequence: ReferentielIndicator['frequence'] = 'trimestrielle',
  source = 'Rapports terrain',
): ReferentielIndicator => ({
  id,
  code,
  name,
  type,
  uniteMesureIds,
  natures,
  unitResultat,
  methodeCalcul,
  description,
  source,
  frequence,
  createdAt: now,
  updatedAt: now,
});

export const REFERENTIEL_INDICATEURS: ReferentielIndicator[] = [
  mk('ind-ref-1', 'IND-001', "Taux d'accès à l'eau potable", 'quantitatif',
    ['travaux-1', 'travaux-3', 'sensibilisation-3'], ['travaux', 'sensibilisation'],
    '%', "(Bénéficiaires desservis / Population totale) × 100",
    "Pourcentage de la population ayant accès à un point d'eau potable", 'annuelle', 'Enquête terrain'),
  mk('ind-ref-2', 'IND-002', 'Population desservie', 'quantitatif',
    ['travaux-1', 'travaux-3', 'sensibilisation-3'], ['travaux', 'sensibilisation'],
    'habitants', 'Somme des bénéficiaires raccordés',
    'Population effectivement desservie par les nouveaux ouvrages', 'trimestrielle'),
  mk('ind-ref-3', 'IND-003', 'Nombre de forages réalisés', 'quantitatif', ['travaux-1'], ['travaux'],
    'forages', 'Somme des forages réceptionnés', 'Nombre cumulé de forages mis en service'),
  mk('ind-ref-33', 'IND-033', "Niveau de satisfaction des bénéficiaires", 'qualitatif', ['sensibilisation-3'], ['sensibilisation', 'suivi'],
    'score (1-5)', "Moyenne des scores d'enquête de satisfaction", "Satisfaction perçue par les usagers des services d'eau", 'annuelle', 'Enquête bénéficiaires'),
];

export const getReferentielIndicatorByIdOrCode = (idOrCode?: string) => {
  if (!idOrCode) return undefined;
  return REFERENTIEL_INDICATEURS.find((i) => i.id === idOrCode || i.code === idOrCode);
};
