import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { UNITES_MESURE_BY_NATURE, UniteMesure } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class UnitesService {
  private unitsSignal = signal<Record<string, UniteMesure[]>>(UNITES_MESURE_BY_NATURE);

  getUnitsByNature(): Observable<Record<string, UniteMesure[]>> {
    return of(this.unitsSignal());
  }

  getUnitsSignal() {
    return this.unitsSignal;
  }

  addUnit(nature: string, unit: UniteMesure) {
    this.unitsSignal.update((current) => ({
      ...current,
      [nature]: [...(current[nature] || []), unit],
    }));
  }

  updateUnit(oldNature: string, newNature: string, updated: UniteMesure) {
    this.unitsSignal.update((current) => {
      const copy = { ...current };
      copy[oldNature] = (copy[oldNature] || []).filter((u) => u.id !== updated.id);
      copy[newNature] = [...(copy[newNature] || []), updated];
      return copy;
    });
  }

  deleteUnit(nature: string, id: string) {
    this.unitsSignal.update((current) => ({
      ...current,
      [nature]: (current[nature] || []).filter((u) => u.id !== id),
    }));
  }
}
