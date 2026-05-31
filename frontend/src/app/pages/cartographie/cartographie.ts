import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  AlertTriangle,
  CheckCircle,
  Droplets,
  Filter,
  Layers,
  LucideAngularModule,
  MapPin,
  Maximize2,
  Wrench,
  ZoomIn,
  ZoomOut,
} from 'lucide-angular';

type ForageStatus = 'operationnel' | 'panne' | 'en_travaux' | 'nouveau';

type ForagePoint = {
  id: string;
  name: string;
  region: string;
  commune: string;
  status: ForageStatus;
  type: 'forage' | 'puits' | 'aep';
  beneficiaires: number;
};

@Component({
  selector: 'app-cartographie',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col justify-between gap-4 sm:flex-row">
        <div class="flex flex-wrap gap-3">
          <select class="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option>Toutes les regions</option>
            <option>Louga</option>
            <option>Matam</option>
            <option>Thies</option>
          </select>
          <select class="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option>Tous les statuts</option>
            <option>Operationnels</option>
            <option>En panne</option>
            <option>En travaux</option>
          </select>
          <button class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input hover:bg-accent">
            <lucide-icon [img]="icons.Filter" class="h-4 w-4"></lucide-icon>
          </button>
        </div>
        <div class="flex gap-2">
          <button class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input hover:bg-accent">
            <lucide-icon [img]="icons.Layers" class="h-4 w-4"></lucide-icon>
          </button>
          <button class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input hover:bg-accent">
            <lucide-icon [img]="icons.Maximize2" class="h-4 w-4"></lucide-icon>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div *ngFor="let stat of stats" class="rounded-xl border bg-card p-4 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="h-3 w-3 rounded-full" [ngClass]="stat.color"></div>
            <div>
              <p class="text-2xl font-bold">{{ stat.count }}</p>
              <p class="text-xs text-muted-foreground">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <div class="relative h-[500px] overflow-hidden rounded-xl border bg-card shadow-sm">
            <div class="relative flex h-full flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
              <svg viewBox="0 0 400 300" class="absolute inset-0 h-full w-full opacity-10">
                <path
                  d="M50,100 Q100,50 200,80 Q300,60 350,100 Q380,150 350,200 Q300,250 200,230 Q100,250 50,200 Q20,150 50,100"
                  fill="hsl(var(--primary))"
                  stroke="hsl(var(--primary))"
                  stroke-width="2"
                />
              </svg>
              <div class="absolute inset-0">
                <div class="absolute left-1/4 top-1/4 h-4 w-4 rounded-full bg-secondary animate-pulse"></div>
                <div class="absolute left-1/2 top-1/3 h-4 w-4 rounded-full bg-secondary"></div>
                <div class="absolute left-1/3 top-1/2 h-4 w-4 rounded-full bg-amber-500"></div>
                <div class="absolute left-2/3 top-2/3 h-4 w-4 rounded-full bg-destructive"></div>
                <div class="absolute right-1/4 top-1/2 h-4 w-4 rounded-full bg-primary animate-pulse"></div>
              </div>
              <div class="relative z-10 text-center">
                <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <lucide-icon [img]="icons.MapPin" class="h-10 w-10 text-primary"></lucide-icon>
                </div>
                <p class="text-lg font-semibold">Carte interactive</p>
                <p class="mt-1 text-sm text-muted-foreground">1,613 points de forages</p>
                <button class="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Ouvrir la carte complete
                </button>
              </div>
              <div class="absolute bottom-4 right-4 flex flex-col gap-2">
                <button class="inline-flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <lucide-icon [img]="icons.ZoomIn" class="h-4 w-4"></lucide-icon>
                </button>
                <button class="inline-flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <lucide-icon [img]="icons.ZoomOut" class="h-4 w-4"></lucide-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div class="border-b p-4">
            <h2 class="flex items-center gap-2 text-lg font-semibold">
              <lucide-icon [img]="icons.Droplets" class="h-5 w-5 text-primary"></lucide-icon>
              Points d'eau recents
            </h2>
          </div>
          <div class="max-h-[430px] divide-y overflow-y-auto">
            <div *ngFor="let forage of foragePoints" class="cursor-pointer p-4 transition-colors hover:bg-muted/30">
              <div class="flex items-start gap-3">
                <div class="rounded-lg p-2" [ngClass]="statusSoftClass(forage.status)">
                  <lucide-icon [img]="statusIcon(forage.status)" class="h-4 w-4"></lucide-icon>
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="truncate text-sm font-medium">{{ forage.name }}</h3>
                  <p class="text-xs text-muted-foreground">{{ forage.commune }}, {{ forage.region }}</p>
                  <div class="mt-2 flex items-center justify-between gap-3">
                    <span class="rounded-full px-2 py-0.5 text-xs" [ngClass]="statusSoftClass(forage.status)">
                      {{ statusLabel(forage.status) }}
                    </span>
                    <span *ngIf="forage.beneficiaires > 0" class="text-xs text-muted-foreground">
                      {{ forage.beneficiaires | number }} benef.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CartographieComponent {
  readonly icons = {
    AlertTriangle,
    CheckCircle,
    Droplets,
    Filter,
    Layers,
    MapPin,
    Maximize2,
    Wrench,
    ZoomIn,
    ZoomOut,
  };

  readonly stats = [
    { status: 'operationnel', count: 1456, label: 'Operationnels', color: 'bg-secondary' },
    { status: 'panne', count: 89, label: 'En panne', color: 'bg-destructive' },
    { status: 'en_travaux', count: 45, label: 'En travaux', color: 'bg-amber-500' },
    { status: 'nouveau', count: 23, label: 'Nouveaux', color: 'bg-primary' },
  ];

  readonly foragePoints: ForagePoint[] = [
    { id: '1', name: 'Forage Nguer Malal', region: 'Louga', commune: 'Nguer Malal', status: 'operationnel', type: 'forage', beneficiaires: 3500 },
    { id: '2', name: 'Forage Koki', region: 'Louga', commune: 'Koki', status: 'operationnel', type: 'forage', beneficiaires: 2800 },
    { id: '3', name: 'Forage Ourossogui', region: 'Matam', commune: 'Ourossogui', status: 'en_travaux', type: 'forage', beneficiaires: 5200 },
    { id: '4', name: 'AEP Mbour', region: 'Thies', commune: 'Mbour', status: 'operationnel', type: 'aep', beneficiaires: 12000 },
    { id: '5', name: 'Forage Tambacounda', region: 'Tambacounda', commune: 'Tambacounda', status: 'panne', type: 'forage', beneficiaires: 4100 },
    { id: '6', name: 'Forage Kaolack', region: 'Kaolack', commune: 'Nioro', status: 'nouveau', type: 'forage', beneficiaires: 0 },
  ];

  statusIcon(status: ForageStatus) {
    return {
      operationnel: CheckCircle,
      panne: AlertTriangle,
      en_travaux: Wrench,
      nouveau: Droplets,
    }[status];
  }

  statusLabel(status: ForageStatus) {
    return {
      operationnel: 'Operationnel',
      panne: 'En panne',
      en_travaux: 'En travaux',
      nouveau: 'Nouveau',
    }[status];
  }

  statusSoftClass(status: ForageStatus) {
    return {
      operationnel: 'bg-secondary/20 text-secondary',
      panne: 'bg-destructive/20 text-destructive',
      en_travaux: 'bg-amber-500/20 text-amber-700',
      nouveau: 'bg-primary/20 text-primary',
    }[status];
  }
}
