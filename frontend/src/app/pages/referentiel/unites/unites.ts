import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Pencil, Trash2, Ruler, Search, Info } from 'lucide-angular';
import { UnitesService } from '../../../services/unites.service';
import { UNITES_MESURE_BY_NATURE, ACTIVITY_NATURE_LABELS, UniteMesure, ActivityNature } from '../../../models/project.model';
import { ButtonComponent } from '../../../shared/ui/button';
import { InputComponent } from '../../../shared/ui/input';
import { DialogComponent, DialogHeaderComponent, DialogTitleComponent, DialogFooterComponent } from '../../../shared/ui/dialog';

@Component({
  selector: 'app-unites',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ButtonComponent, InputComponent, DialogComponent, DialogHeaderComponent, DialogTitleComponent, DialogFooterComponent],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row gap-4 justify-between">
        <div class="flex gap-3 flex-wrap">
          <div class="relative">
            <lucide-icon [img]="icons.Search" class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"></lucide-icon>
            <app-input class="pl-9 w-72" placeholder="Rechercher (code, nom, description)..." [(ngModel)]="searchQueryVal"></app-input>
          </div>
          <select class="h-9 w-48 rounded-md border border-input bg-background px-3 text-sm" [(ngModel)]="selectedNatureVal">
            <option value="all">Toutes les natures</option>
            <option *ngFor="let key of natureKeys" [value]="key">{{ natureLabels[key] || key }}</option>
          </select>
        </div>
        <button app-button (click)="openAdd()">
          <lucide-icon [img]="icons.Plus" class="h-4 w-4 mr-2"></lucide-icon>
          Ajouter une unité
        </button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="rounded-xl border bg-card p-4 shadow-sm">
          <p class="text-sm text-muted-foreground">Total unités</p>
          <p class="mt-2 text-2xl font-bold">{{ totalUnits }}</p>
        </div>
        <div class="rounded-xl border bg-card p-4 shadow-sm">
          <p class="text-sm text-muted-foreground">Natures</p>
          <p class="mt-2 text-2xl font-bold">{{ natureKeys.length }}</p>
        </div>
      </div>

      <div class="grid gap-4">
        <div *ngFor="let group of groups()">
          <div class="rounded-xl border bg-card">
            <div class="border-b p-3 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <h3 class="text-base font-semibold">{{ group.natureLabel }}</h3>
                <span class="text-sm text-muted-foreground">{{ group.units.length }} unité(s)</span>
              </div>
            </div>
            <div class="p-4 overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="table-header">
                  <tr>
                    <th class="px-4 py-3 text-left w-24">Code</th>
                    <th class="px-4 py-3 text-left w-48">Nom</th>
                    <th class="px-4 py-3 text-left">Description</th>
                    <th class="px-4 py-3 text-left w-20"></th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr *ngFor="let u of group.units" class="hover:bg-muted/40 cursor-pointer" (click)="openDetail(group.nature, u)">
                    <td class="px-4 py-3 font-mono text-sm font-medium">{{ u.code }}</td>
                    <td class="px-4 py-3 font-medium">{{ u.name }}</td>
                    <td class="px-4 py-3 text-sm text-muted-foreground">{{ u.description || '-' }}</td>
                    <td class="px-4 py-3" (click)="$event.stopPropagation()">
                      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button app-button variant="ghost" size="icon" (click)="openEdit(group.nature, u)">
                          <lucide-icon [img]="icons.Pencil" class="h-3.5 w-3.5"></lucide-icon>
                        </button>
                        <button app-button variant="ghost" size="icon" class="text-destructive" (click)="deleteUnit(group.nature, u.id)">
                          <lucide-icon [img]="icons.Trash2" class="h-3.5 w-3.5"></lucide-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div *ngIf="groups().length === 0" class="text-center py-12 text-muted-foreground">
          <lucide-icon [img]="icons.Ruler" class="h-12 w-12 mx-auto mb-4 opacity-50"></lucide-icon>
          <p>Aucune unité trouvée</p>
        </div>
      </div>

      <!-- Add/Edit Dialog -->
      <app-dialog [open]="formOpen" (openChange)="formOpen = $event" class="max-w-md">
        <app-dialog-header>
          <app-dialog-title>{{ editing ? 'Modifier l\'unité' : 'Ajouter une unité' }}</app-dialog-title>
        </app-dialog-header>
        <div class="space-y-3">
          <div class="space-y-2">
            <label class="text-sm font-medium">Nature d'activité *</label>
            <select class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" [(ngModel)]="formModel.nature">
              <option *ngFor="let k of natureKeys" [value]="k">{{ natureLabels[k] || k }}</option>
            </select>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">Code *</label>
              <input class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-mono" [(ngModel)]="formModel.code" maxlength="10" />
            </div>
            <div class="space-y-2 col-span-2">
              <label class="text-sm font-medium">Nom *</label>
              <input class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" [(ngModel)]="formModel.name" />
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Description</label>
            <textarea class="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" [(ngModel)]="formModel.description"></textarea>
          </div>
        </div>
        <app-dialog-footer>
          <button app-button variant="outline" (click)="formOpen = false">Annuler</button>
          <button app-button (click)="save()">{{ editing ? 'Enregistrer' : 'Ajouter' }}</button>
        </app-dialog-footer>
      </app-dialog>

      <!-- Detail Dialog -->
      <app-dialog [open]="detailOpen" (openChange)="detailOpen = $event" class="max-w-sm">
        <app-dialog-header>
          <app-dialog-title>
            <lucide-icon [img]="icons.Ruler" class="h-5 w-5 text-primary mr-2"></lucide-icon>
            Fiche Unité de Mesure
          </app-dialog-title>
        </app-dialog-header>
            <div *ngIf="selected" class="space-y-4">
          <div class="p-4 bg-muted/50 rounded-lg space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-mono text-2xl font-bold text-primary">{{ selected.unit.code }}</span>
              <span class="badge-secondary">{{ natureLabels[selected.nature] || selected.nature }}</span>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Libellé</p>
              <p class="font-semibold text-lg">{{ selected.unit.name }}</p>
            </div>
          </div>

          <div *ngIf="selected.unit.description">
            <p class="text-xs font-medium text-muted-foreground uppercase mb-1">Description</p>
            <p class="text-sm">{{ selected.unit.description }}</p>
          </div>

          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <lucide-icon [img]="icons.Info" class="h-4 w-4"></lucide-icon>
            <span>Identifiant: {{ selected.unit.id }}</span>
          </div>

            <div class="flex justify-end gap-2 pt-2 border-t">
            <button app-button variant="outline" size="sm" (click)="detailOpen = false">Fermer</button>
            <button app-button size="sm" (click)="editFromDetail()">
              <lucide-icon [img]="icons.Pencil" class="h-4 w-4 mr-1"></lucide-icon>
              Modifier
            </button>
          </div>
        </div>
      </app-dialog>
    </div>
  `
})
export class UnitesComponent {
  readonly unitesService = inject(UnitesService);
  readonly icons = { Plus, Pencil, Trash2, Ruler, Search, Info };

  selectedNature = signal<string>('all');
  searchQuery = signal<string>('');

  formOpen = false;
  detailOpen = false;
  editing = false;

  natureKeys: ActivityNature[] = Object.keys(UNITES_MESURE_BY_NATURE) as ActivityNature[];
  natureLabels: Record<string, string> = ACTIVITY_NATURE_LABELS as any;
  form = signal<Partial<UniteMesure & { nature?: ActivityNature }>>({ code: '', name: '', description: '', nature: this.natureKeys[0] });
  selected: { nature: ActivityNature; unit: UniteMesure } | null = null;

  // Bindable model for ngModel in dialog
  formModel: Partial<UniteMesure & { nature?: ActivityNature }> = { code: '', name: '', description: '', nature: this.natureKeys[0] };

  // ngModel bindings for search/select use getters/setters
  get searchQueryVal() {
    return this.searchQuery();
  }
  set searchQueryVal(v: string) {
    this.searchQuery.set(v || '');
  }

  get selectedNatureVal() {
    return this.selectedNature();
  }
  set selectedNatureVal(v: string) {
    this.selectedNature.set(v || 'all');
  }

  groups = computed(() => {
    const data = this.unitesService.getUnitsSignal()();
    const entries = Object.entries(data)
      .filter(([nature]) => this.selectedNature() === 'all' || nature === this.selectedNature())
      .map(([nature, units]) => ({
        nature,
        natureLabel: this.natureLabels[nature] || nature,
        units: units.filter(u => {
          const q = this.searchQuery().toLowerCase();
          return q === '' || u.code.toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || (u.description || '').toLowerCase().includes(q);
        })
      }))
      .filter(g => g.units.length > 0);
    return entries;
  });

  get totalUnits() {
    const data = this.unitesService.getUnitsSignal()();
    return Object.values(data).flat().length;
  }

  openAdd() {
    this.editing = false;
    this.form.set({ code: '', name: '', description: '', nature: this.natureKeys[0] });
    this.formModel = { code: '', name: '', description: '', nature: this.natureKeys[0] };
    this.formOpen = true;
  }

  openEdit(nature: ActivityNature, unit: UniteMesure) {
    this.editing = true;
    this.form.set({ ...unit, nature });
    this.formModel = { ...unit, nature };
    this.formOpen = true;
  }

  openDetail(nature: ActivityNature, unit: UniteMesure) {
    this.selected = { nature, unit };
    this.detailOpen = true;
  }

  save() {
    const value = this.formModel;
    if (!value.code || !value.name || !value.nature) {
      return;
    }
    const newUnit: UniteMesure = {
      id: (value as any).id || `${value.nature}-${Date.now()}`,
      code: (value.code || '').toUpperCase(),
      name: value.name as string,
      description: value.description,
      nature: value.nature as ActivityNature,
    };

    if (this.editing) {
      const oldNature = this.selected?.nature || newUnit.nature || this.natureKeys[0];
      this.unitesService.updateUnit(oldNature, newUnit.nature || oldNature, newUnit);
    } else {
      this.unitesService.addUnit(newUnit.nature || this.natureKeys[0], newUnit);
    }

    // sync signal state
    this.form.set({ ...newUnit });
    this.formOpen = false;
  }

  deleteUnit(nature: string, id: string) {
    this.unitesService.deleteUnit(nature, id);
  }

  editFromDetail() {
    if (!this.selected) return;
    const { nature, unit } = this.selected;
    this.detailOpen = false;
    this.openEdit(nature, unit);
  }
}
