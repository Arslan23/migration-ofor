import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Award, BarChart3, CheckCircle, LucideAngularModule, Plus } from 'lucide-angular';
import { mockCDPEvaluations, mockCDPFichesSuivi, mockCDPs } from '../../models/cdp.model';

@Component({
  selector: 'app-contrat-performance',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="rounded-xl border bg-card p-4 shadow-sm">
            <lucide-icon [img]="icons.Award" class="h-5 w-5 text-primary"></lucide-icon>
            <p class="mt-3 text-2xl font-bold">{{ cdps.length }}</p>
            <p class="text-sm text-muted-foreground">Contrats</p>
          </div>
          <div class="rounded-xl border bg-card p-4 shadow-sm">
            <lucide-icon [img]="icons.BarChart3" class="h-5 w-5 text-secondary"></lucide-icon>
            <p class="mt-3 text-2xl font-bold">{{ evaluations.length }}</p>
            <p class="text-sm text-muted-foreground">Evaluations annuelles</p>
          </div>
          <div class="rounded-xl border bg-card p-4 shadow-sm">
            <lucide-icon [img]="icons.CheckCircle" class="h-5 w-5 text-secondary"></lucide-icon>
            <p class="mt-3 text-2xl font-bold">{{ averagePerformance }}%</p>
            <p class="text-sm text-muted-foreground">Performance moyenne</p>
          </div>
        </div>
        <button class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <lucide-icon [img]="icons.Plus" class="h-4 w-4"></lucide-icon>
          Nouveau CDP
        </button>
      </div>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <a
          *ngFor="let cdp of cdps"
          [routerLink]="['/contrat-performance', cdp.id]"
          class="rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-primary">{{ cdp.code }}</p>
              <h2 class="mt-1 text-lg font-semibold">{{ cdp.name }}</h2>
              <p class="mt-2 line-clamp-3 text-sm text-muted-foreground">{{ cdp.description }}</p>
            </div>
            <span class="badge-status badge-success">{{ cdp.status }}</span>
          </div>
          <div class="mt-5 grid grid-cols-3 gap-3 text-sm">
            <div>
              <p class="text-muted-foreground">Debut</p>
              <p class="font-semibold">{{ cdp.startYear }}</p>
            </div>
            <div>
              <p class="text-muted-foreground">Fin</p>
              <p class="font-semibold">{{ cdp.endYear }}</p>
            </div>
            <div>
              <p class="text-muted-foreground">Indicateurs</p>
              <p class="font-semibold">{{ cdp.indicateurs.length }}</p>
            </div>
          </div>
        </a>
      </div>

      <div class="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div class="border-b p-4">
          <h2 class="text-lg font-semibold">Evaluations et fiches de suivi</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="table-header">
              <tr>
                <th class="px-4 py-3 text-left">Annee</th>
                <th class="px-4 py-3 text-left">Contrat</th>
                <th class="px-4 py-3 text-left">Statut</th>
                <th class="px-4 py-3 text-left">Fiches</th>
                <th class="px-4 py-3 text-left">Cree par</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr *ngFor="let evaluation of evaluations" class="hover:bg-muted/40">
                <td class="px-4 py-3 font-medium">{{ evaluation.year }}</td>
                <td class="px-4 py-3">{{ evaluation.cdpName }}</td>
                <td class="px-4 py-3"><span class="badge-status badge-info">{{ evaluation.status }}</span></td>
                <td class="px-4 py-3">{{ fichesCount(evaluation.id) }}</td>
                <td class="px-4 py-3 text-muted-foreground">{{ evaluation.createdBy }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class ContratPerformanceComponent {
  readonly icons = { Award, BarChart3, CheckCircle, Plus };
  readonly cdps = mockCDPs;
  readonly evaluations = mockCDPEvaluations;

  readonly averagePerformance = Math.round(
    mockCDPFichesSuivi
      .filter((fiche) => typeof fiche.performanceRate === 'number')
      .reduce((sum, fiche) => sum + (fiche.performanceRate ?? 0), 0) /
      mockCDPFichesSuivi.filter((fiche) => typeof fiche.performanceRate === 'number').length,
  );

  fichesCount(evaluationId: string) {
    return mockCDPFichesSuivi.filter((fiche) => fiche.evaluationId === evaluationId).length;
  }
}
