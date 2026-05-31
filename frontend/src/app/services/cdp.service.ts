import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
    CDP, CDPCategorie, CDPComposante, CDPEvaluationAnnuelle, CDPFicheSuiviIndicateur,
    mockCDPCategories, mockCDPComposantes, mockCDPs, mockCDPEvaluations, mockCDPFichesSuivi
} from '../models/cdp.model';

@Injectable({
    providedIn: 'root'
})
export class CdpService {
    private categoriesList = signal<CDPCategorie[]>(mockCDPCategories);
    private composantesList = signal<CDPComposante[]>(mockCDPComposantes);
    private cdpList = signal<CDP[]>(mockCDPs);
    private evaluationsList = signal<CDPEvaluationAnnuelle[]>(mockCDPEvaluations);
    private fichesList = signal<CDPFicheSuiviIndicateur[]>(mockCDPFichesSuivi);

    getCategories(): Observable<CDPCategorie[]> {
        return of(this.categoriesList());
    }

    getComposantes(): Observable<CDPComposante[]> {
        return of(this.composantesList());
    }

    getCDPs(): Observable<CDP[]> {
        return of(this.cdpList());
    }

    getEvaluations(): Observable<CDPEvaluationAnnuelle[]> {
        return of(this.evaluationsList());
    }

    getFichesSuivi(evaluationId: string): Observable<CDPFicheSuiviIndicateur[]> {
        return of(this.fichesList().filter(f => f.evaluationId === evaluationId));
    }
}

// Re-export mock data for service implementation
export { mockCDPCategories, mockCDPComposantes, mockCDPs, mockCDPEvaluations, mockCDPFichesSuivi };
