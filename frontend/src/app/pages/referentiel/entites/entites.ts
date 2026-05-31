import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LucideAngularModule, Building2, Network, Plus, Search } from 'lucide-angular';
import { mockEntitesExecution, mockServices } from '../../../data/entites-execution.data';

@Component({
  selector: 'app-entites',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="relative">
          <lucide-icon [img]="icons.Search" class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"></lucide-icon>
          <input class="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm md:w-80" placeholder="Rechercher une entite..." />
        </div>
        <button class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <lucide-icon [img]="icons.Plus" class="h-4 w-4"></lucide-icon>
          Ajouter
        </button>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded-xl border bg-card p-4 shadow-sm">
          <lucide-icon [img]="icons.Building2" class="h-5 w-5 text-primary"></lucide-icon>
          <p class="mt-3 text-2xl font-bold">{{ entites.length }}</p>
          <p class="text-sm text-muted-foreground">Entites d'execution</p>
        </div>
        <div class="rounded-xl border bg-card p-4 shadow-sm">
          <lucide-icon [img]="icons.Network" class="h-5 w-5 text-secondary"></lucide-icon>
          <p class="mt-3 text-2xl font-bold">{{ services.length }}</p>
          <p class="text-sm text-muted-foreground">Services rattaches</p>
        </div>
        <div class="rounded-xl border bg-card p-4 shadow-sm">
          <p class="text-sm text-muted-foreground">Entites actives</p>
          <p class="mt-3 text-2xl font-bold">{{ actifs }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div class="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div class="border-b p-4">
            <h2 class="text-lg font-semibold">Entites</h2>
          </div>
          <div class="divide-y">
            <div *ngFor="let entite of entites" class="p-4 hover:bg-muted/40">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-semibold">{{ entite.code }} - {{ entite.nom }}</p>
                  <p class="mt-1 text-sm text-muted-foreground">{{ entite.description }}</p>
                </div>
                <span class="badge-status" [ngClass]="entite.actif ? 'badge-success' : 'badge-warning'">
                  {{ entite.actif ? 'Actif' : 'Inactif' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div class="border-b p-4">
            <h2 class="text-lg font-semibold">Services</h2>
          </div>
          <div class="max-h-[560px] divide-y overflow-y-auto">
            <div *ngFor="let service of services" class="p-4 hover:bg-muted/40">
              <p class="font-semibold">{{ service.code }} - {{ service.nom }}</p>
              <p class="text-sm text-muted-foreground">{{ service.type }} | {{ service.responsable || 'Responsable a definir' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class EntitesComponent {
  readonly icons = { Building2, Network, Plus, Search };
  readonly entites = mockEntitesExecution;
  readonly services = mockServices;
  readonly actifs = mockEntitesExecution.filter((entite) => entite.actif).length;
}
