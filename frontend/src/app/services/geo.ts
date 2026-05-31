import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Region, Departement, Commune, ZoneIntervention } from '../models/geo.model';
import {
  SENEGAL_GEO,
  getAllRegions,
  getDepartementsByRegion,
  getCommunesByDepartement,
  getRegionByCode,
  getDepartementByCode,
  getCommuneByCode,
  formatZoneIntervention,
  getZoneTypeLabel
} from '../data/geo.data';

@Injectable({
  providedIn: 'root'
})
export class GeoService {

  // Get all regions
  getRegions(): Observable<Region[]> {
    return of(SENEGAL_GEO);
  }

  getRegionList(): Observable<{ code: string, name: string }[]> {
    return of(getAllRegions());
  }

  getDepartements(regionCode: string): Observable<{ code: string, name: string }[]> {
    return of(getDepartementsByRegion(regionCode));
  }

  getCommunes(departementCode: string): Observable<{ code: string, name: string }[]> {
    return of(getCommunesByDepartement(departementCode));
  }

  getRegion(code: string): Observable<Region | undefined> {
    return of(getRegionByCode(code));
  }

  // Helpers exposed as utilities
  formatZone(zone: ZoneIntervention): string {
    return formatZoneIntervention(zone);
  }

  getZoneLabel(type: ZoneIntervention['type']): string {
    return getZoneTypeLabel(type);
  }
}
