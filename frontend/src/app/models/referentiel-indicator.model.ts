import { ActivityNature } from './project.model';

export type IndicatorType = 'quantitatif' | 'qualitatif';

export interface ReferentielIndicator {
  id: string;
  code: string;
  name: string;
  type: IndicatorType;
  uniteMesureIds: string[];
  natures?: ActivityNature[];
  methodeCalcul?: string;
  unitResultat?: string;
  description?: string;
  source?: string;
  frequence?: 'mensuelle' | 'trimestrielle' | 'semestrielle' | 'annuelle';
  createdAt: string;
  updatedAt: string;
}
