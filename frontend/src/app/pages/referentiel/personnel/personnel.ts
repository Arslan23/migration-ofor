import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LucideAngularModule, Plus, Search, UserCheck, Users } from 'lucide-angular';
import { mockPersonnel } from '../../../data/personnel.data';

@Component({
  selector: 'app-personnel',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="relative">
          <lucide-icon [img]="icons.Search" class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"></lucide-icon>
          <input class="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm md:w-80" placeholder="Rechercher un agent..." />
        </div>
        <button class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <lucide-icon [img]="icons.Plus" class="h-4 w-4"></lucide-icon>
          Ajouter
        </button>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded-xl border bg-card p-4 shadow-sm">
          <lucide-icon [img]="icons.Users" class="h-5 w-5 text-primary"></lucide-icon>
          <p class="mt-3 text-2xl font-bold">{{ personnel.length }}</p>
          <p class="text-sm text-muted-foreground">Agents references</p>
        </div>
        <div class="rounded-xl border bg-card p-4 shadow-sm">
          <lucide-icon [img]="icons.UserCheck" class="h-5 w-5 text-secondary"></lucide-icon>
          <p class="mt-3 text-2xl font-bold">{{ actifs }}</p>
          <p class="text-sm text-muted-foreground">Agents actifs</p>
        </div>
        <div class="rounded-xl border bg-card p-4 shadow-sm">
          <p class="text-sm text-muted-foreground">Directions</p>
          <p class="mt-3 text-2xl font-bold">{{ directions }}</p>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="table-header">
              <tr>
                <th class="px-4 py-3 text-left">Matricule</th>
                <th class="px-4 py-3 text-left">Nom complet</th>
                <th class="px-4 py-3 text-left">Fonction</th>
                <th class="px-4 py-3 text-left">Direction</th>
                <th class="px-4 py-3 text-left">Contact</th>
                <th class="px-4 py-3 text-left">Statut</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr *ngFor="let agent of personnel" class="hover:bg-muted/40">
                <td class="px-4 py-3 font-medium">{{ agent.matricule }}</td>
                <td class="px-4 py-3">{{ agent.prenom }} {{ agent.nom }}</td>
                <td class="px-4 py-3 text-muted-foreground">{{ agent.fonction }}</td>
                <td class="px-4 py-3">{{ agent.direction }}</td>
                <td class="px-4 py-3 text-muted-foreground">{{ agent.email }}</td>
                <td class="px-4 py-3">
                  <span class="badge-status" [ngClass]="agent.actif ? 'badge-success' : 'badge-warning'">
                    {{ agent.actif ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class PersonnelComponent {
  readonly icons = { Plus, Search, UserCheck, Users };
  readonly personnel = mockPersonnel;
  readonly actifs = mockPersonnel.filter((agent) => agent.actif).length;
  readonly directions = new Set(mockPersonnel.map((agent) => agent.direction)).size;
}
