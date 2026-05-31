import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ArrowLeft, LucideAngularModule } from 'lucide-angular';
import { mockCDPFichesSuivi, mockCDPs } from '../../models/cdp.model';

@Component({
  selector: 'app-cdp-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <a routerLink="/contrat-performance" class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <lucide-icon [img]="icons.ArrowLeft" class="h-4 w-4"></lucide-icon>
        Retour aux contrats
      </a>

      <ng-container *ngIf="cdp(); else missing">
        <div class="rounded-xl border bg-card p-5 shadow-sm">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p class="text-sm font-medium text-primary">{{ cdp()?.code }}</p>
              <h1 class="mt-1 text-2xl font-bold">{{ cdp()?.name }}</h1>
              <p class="mt-2 max-w-4xl text-sm text-muted-foreground">{{ cdp()?.description }}</p>
            </div>
            <span class="badge-status badge-success">{{ cdp()?.status }}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div class="rounded-xl border bg-card p-4 shadow-sm">
            <p class="text-sm text-muted-foreground">Periode</p>
            <p class="mt-2 text-xl font-bold">{{ cdp()?.startYear }} - {{ cdp()?.endYear }}</p>
          </div>
          <div class="rounded-xl border bg-card p-4 shadow-sm">
            <p class="text-sm text-muted-foreground">Indicateurs</p>
            <p class="mt-2 text-xl font-bold">{{ cdp()?.indicateurs?.length }}</p>
          </div>
          <div class="rounded-xl border bg-card p-4 shadow-sm">
            <p class="text-sm text-muted-foreground">Fiches 2024</p>
            <p class="mt-2 text-xl font-bold">{{ fiches.length }}</p>
          </div>
          <div class="rounded-xl border bg-card p-4 shadow-sm">
            <p class="text-sm text-muted-foreground">Performance moyenne</p>
            <p class="mt-2 text-xl font-bold text-secondary">{{ averagePerformance }}%</p>
          </div>
        </div>

        <div class="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div class="border-b p-4">
            <h2 class="text-lg font-semibold">Cibles triennales</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="table-header">
                <tr>
                  <th class="px-4 py-3 text-left">Code</th>
                  <th class="px-4 py-3 text-left">Indicateur</th>
                  <th class="px-4 py-3 text-left">Composante</th>
                  <th class="px-4 py-3 text-left">Baseline</th>
                  <th class="px-4 py-3 text-left">Annee 1</th>
                  <th class="px-4 py-3 text-left">Annee 2</th>
                  <th class="px-4 py-3 text-left">Annee 3</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr *ngFor="let indicateur of cdp()?.indicateurs" class="hover:bg-muted/40">
                  <td class="px-4 py-3 font-medium">{{ indicateur.indicateurCode }}</td>
                  <td class="px-4 py-3">{{ indicateur.indicateurName }}</td>
                  <td class="px-4 py-3 text-muted-foreground">{{ indicateur.composanteName }}</td>
                  <td class="px-4 py-3">{{ indicateur.baselineValue }} {{ indicateur.unit }}</td>
                  <td class="px-4 py-3">{{ indicateur.targetYear1 }} {{ indicateur.unit }}</td>
                  <td class="px-4 py-3">{{ indicateur.targetYear2 }} {{ indicateur.unit }}</td>
                  <td class="px-4 py-3">{{ indicateur.targetYear3 }} {{ indicateur.unit }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>

      <ng-template #missing>
        <div class="rounded-xl border bg-card p-6 text-muted-foreground">Contrat introuvable.</div>
      </ng-template>
    </div>
  `,
})
export class CdpDetailComponent {
  private readonly route = inject(ActivatedRoute);
  readonly icons = { ArrowLeft };
  readonly fiches = mockCDPFichesSuivi.filter((fiche) => fiche.evaluationId === 'eval-1');
  readonly cdp = computed(() => mockCDPs.find((item) => item.id === this.route.snapshot.paramMap.get('id')));
  readonly averagePerformance = Math.round(
    this.fiches.reduce((sum, fiche) => sum + (fiche.performanceRate ?? 0), 0) / this.fiches.length,
  );
}
