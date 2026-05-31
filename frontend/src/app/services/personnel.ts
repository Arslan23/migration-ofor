import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Personnel } from '../models/personnel.model';
import { mockPersonnel, getPersonnelFullName, getPersonnelById } from '../data/personnel.data';

@Injectable({
  providedIn: 'root'
})
export class PersonnelService {

  getPersonnelList(): Observable<Personnel[]> {
    return of(mockPersonnel);
  }

  getPersonnel(id: string): Observable<Personnel | undefined> {
    return of(getPersonnelById(id));
  }

  getActivePersonnel(): Observable<Personnel[]> {
    return of(mockPersonnel.filter(p => p.actif));
  }

  getFullName(personnel: Personnel): string {
    return getPersonnelFullName(personnel);
  }
}
