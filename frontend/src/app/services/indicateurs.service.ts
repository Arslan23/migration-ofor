import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { REFERENTIEL_INDICATEURS, getReferentielIndicatorByIdOrCode } from '../data/referentiel-indicateurs';
import { ReferentielIndicator } from '../models/referentiel-indicator.model';

@Injectable({ providedIn: 'root' })
export class IndicateursService {
  private listSignal = signal<ReferentielIndicator[]>(REFERENTIEL_INDICATEURS);

  getIndicators(): Observable<ReferentielIndicator[]> {
    return of(this.listSignal());
  }

  getIndicatorsSignal() {
    return this.listSignal;
  }

  addIndicator(ind: ReferentielIndicator) {
    this.listSignal.update((cur) => [...cur, ind]);
  }

  updateIndicator(updated: ReferentielIndicator) {
    this.listSignal.update((cur) => cur.map((i) => (i.id === updated.id ? updated : i)));
  }

  deleteIndicator(id: string) {
    this.listSignal.update((cur) => cur.filter((i) => i.id !== id));
  }

  findByIdOrCode(idOrCode?: string) {
    return getReferentielIndicatorByIdOrCode(idOrCode);
  }
}
