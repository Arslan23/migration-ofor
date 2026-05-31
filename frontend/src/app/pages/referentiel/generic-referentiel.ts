import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Plus, Search, SlidersHorizontal } from 'lucide-angular';
import { mockOperations } from '../../data/operations.data';
import { SENEGAL_GEO } from '../../data/geo.data';
import {
  mockCDPCategories,
  mockCDPComposantes,
  mockCDPs,
} from '../../models/cdp.model';

type RefRow = {
  code: string;
  name: string;
  category: string;
  status: string;
  description: string;
};

@Component({
  selector: 'app-generic-referentiel',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-wrap gap-2">
          <div class="relative">
            <lucide-icon [img]="icons.Search" class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"></lucide-icon>
            <input
              class="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm md:w-72"
              placeholder="Rechercher..."
            />
          </div>
          <button class="inline-flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm hover:bg-accent">
            <lucide-icon [img]="icons.SlidersHorizontal" class="h-4 w-4"></lucide-icon>
            Filtres
          </button>
        </div>
        <button class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <lucide-icon [img]="icons.Plus" class="h-4 w-4"></lucide-icon>
          Ajouter
        </button>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div class="rounded-xl border bg-card p-4 shadow-sm">
          <p class="text-sm text-muted-foreground">Elements</p>
          <p class="mt-2 text-2xl font-bold">{{ rows().length }}</p>
        </div>
        <div class="rounded-xl border bg-card p-4 shadow-sm">
          <p class="text-sm text-muted-foreground">Actifs</p>
          <p class="mt-2 text-2xl font-bold text-secondary">{{ activeCount() }}</p>
        </div>
        <div class="rounded-xl border bg-card p-4 shadow-sm">
          <p class="text-sm text-muted-foreground">Familles</p>
          <p class="mt-2 text-2xl font-bold text-primary">{{ categoriesCount() }}</p>
        </div>
        <div class="rounded-xl border bg-card p-4 shadow-sm">
          <p class="text-sm text-muted-foreground">Derniere mise a jour</p>
          <p class="mt-2 text-sm font-semibold">Aujourd'hui</p>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div class="border-b p-4">
          <h2 class="text-lg font-semibold">{{ route.snapshot.data['title'] }}</h2>
          <p class="text-sm text-muted-foreground">{{ route.snapshot.data['subtitle'] }}</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="table-header">
              <tr>
                <th class="px-4 py-3 text-left">Code</th>
                <th class="px-4 py-3 text-left">Libelle</th>
                <th class="px-4 py-3 text-left">Categorie</th>
                <th class="px-4 py-3 text-left">Statut</th>
                <th class="px-4 py-3 text-left">Description</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr *ngFor="let row of rows()" class="hover:bg-muted/40">
                <td class="px-4 py-3 font-medium">{{ row.code }}</td>
                <td class="px-4 py-3">{{ row.name }}</td>
                <td class="px-4 py-3 text-muted-foreground">{{ row.category }}</td>
                <td class="px-4 py-3">
                  <span class="badge-status" [ngClass]="row.status === 'Actif' ? 'badge-success' : 'badge-warning'">
                    {{ row.status }}
                  </span>
                </td>
                <td class="max-w-md px-4 py-3 text-muted-foreground">{{ row.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class GenericReferentielComponent {
  readonly route = inject(ActivatedRoute);
  readonly icons = { Plus, Search, SlidersHorizontal };

  rows = computed<RefRow[]>(() => this.buildRows(this.route.snapshot.data['refType']));
  activeCount = computed(() => this.rows().filter((row) => row.status === 'Actif').length);
  categoriesCount = computed(() => new Set(this.rows().map((row) => row.category)).size);

  private buildRows(refType: string): RefRow[] {
    switch (refType) {
      case 'operations':
        return mockOperations.map((operation) => ({
          code: operation.code,
          name: operation.libelle,
          category: operation.nature ?? 'Operation',
          status: operation.actif ? 'Actif' : 'Inactif',
          description: operation.description ?? 'Operation rattachee a une entite de service',
        }));
      case 'zones':
        return SENEGAL_GEO.map((region) => ({
          code: region.code,
          name: region.name,
          category: `${region.departements.length} departements`,
          status: 'Actif',
          description: `${region.departements.reduce((total, dept) => total + dept.communes.length, 0)} communes referencees`,
        }));
      case 'cdp':
        return [
          ...mockCDPCategories.map((category) => ({
            code: category.code,
            name: category.name,
            category: 'Categorie',
            status: 'Actif',
            description: category.description ?? '',
          })),
          ...mockCDPComposantes.slice(0, 8).map((component) => ({
            code: component.code,
            name: component.name,
            category: component.categorieName ?? 'Composante',
            status: 'Actif',
            description: component.description ?? '',
          })),
        ];
      case 'indicateurs':
        return (mockCDPs[0]?.indicateurs ?? []).slice(0, 20).map((indicator) => ({
          code: indicator.indicateurCode,
          name: indicator.indicateurName,
          category: indicator.composanteName ?? 'Indicateur',
          status: 'Actif',
          description: `Cible finale: ${indicator.targetYear3} ${indicator.unit}`,
        }));
      case 'unites':
        return ['%', 'FCFA', 'MFCFA', 'km', 'm3/j', 'heures', 'jours', 'nombre'].map((unit) => ({
          code: unit.toUpperCase(),
          name: unit,
          category: 'Unite',
          status: 'Actif',
          description: 'Unite disponible pour la planification et le suivi',
        }));
      case 'bailleurs':
        return ['Etat du Senegal', 'Banque Mondiale', 'AFD', 'BAD', 'Union Europeenne'].map((name, index) => ({
          code: `BAIL-${index + 1}`,
          name,
          category: index === 0 ? 'National' : 'Partenaire technique et financier',
          status: 'Actif',
          description: 'Source de financement mobilisable sur les projets',
        }));
      case 'workflows':
        return ['Projet', 'PTA', 'Fiche de suivi', 'Contrat de performance'].map((name, index) => ({
          code: `WF-${index + 1}`,
          name,
          category: 'Validation',
          status: 'Actif',
          description: 'Brouillon, soumission, validation et approbation',
        }));
      default:
        return [];
    }
  }
}
