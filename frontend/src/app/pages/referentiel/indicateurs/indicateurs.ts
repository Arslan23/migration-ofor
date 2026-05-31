import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IndicateursService } from '../../../services/indicateurs.service';
import { UnitesService } from '../../../services/unites.service';
import { ButtonComponent } from '../../../shared/ui/button';
import { DialogComponent } from '../../../shared/ui/dialog';

@Component({
  selector: 'app-referentiel-indicateurs',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonComponent, DialogComponent],
  template: `
<section class="p-4">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-semibold">Référentiel — Indicateurs</h2>
    <button class="btn" (click)="openNew()">Nouveau</button>
  </div>

  <div class="grid grid-cols-3 gap-4 mb-4">
    <div class="col-span-2">
      <input type="text" placeholder="Rechercher par code ou nom" class="input" [(ngModel)]="searchVal" />
    </div>
    <div>
      <select class="input" [(ngModel)]="filterTypeVal">
        <option value="">Tous types</option>
        <option value="quantitatif">Quantitatif</option>
        <option value="qualitatif">Qualitatif</option>
      </select>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-4 mb-4">
    <div class="card">Total: {{ totalCount() }}</div>
    <div class="card">Quantitatifs: {{ quantCount() }}</div>
    <div class="card">Qualitatifs: {{ qualCount() }}</div>
  </div>

  <table class="w-full table-auto">
    <thead>
      <tr>
        <th>Code</th>
        <th>Nom</th>
        <th>Type</th>
        <th>Unités</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let ind of filteredList()">
        <td>{{ind.code}}</td>
        <td>{{ind.name}}</td>
        <td>{{ind.type}}</td>
        <td>
          <span *ngFor="let uid of ind.uniteMesureIds" class="badge">{{ getUnitCode(uid) || uid }}</span>
        </td>
        <td>
          <button class="btn-sm" (click)="edit(ind)">Éditer</button>
          <button class="btn-sm btn-danger" (click)="delete(ind.id)">Suppr</button>
        </td>
      </tr>
    </tbody>
  </table>

  <app-dialog [open]="dialogOpen()" (close)="closeDialog()">
    <div class="p-4">
      <h3 class="font-semibold mb-2">{{ editingId() ? 'Éditer' : 'Nouveau' }} indicateur</h3>
      <form [formGroup]="form">
        <div class="grid grid-cols-2 gap-2">
          <label>Code<input class="input" formControlName="code" /></label>
          <label>Nom<input class="input" formControlName="name" /></label>
        </div>
        <div class="grid grid-cols-2 gap-2 mt-2">
          <label>Type
            <select class="input" formControlName="type">
              <option value="quantitatif">Quantitatif</option>
              <option value="qualitatif">Qualitatif</option>
            </select>
          </label>
          <label>Fréquence
            <select class="input" formControlName="frequence">
              <option value="mensuelle">Mensuelle</option>
              <option value="trimestrielle">Trimestrielle</option>
              <option value="annuelle">Annuelle</option>
            </select>
          </label>
        </div>

        <div class="mt-2">
          <label>Unités sélectionnées</label>
          <div>
            <span *ngFor="let uid of form.value.uniteMesureIds" class="badge">{{ getUnitCode(uid) || uid }} <button class="inline" (click)="removeUnit(uid)">x</button></span>
          </div>
          <button class="btn-ghost mt-2" type="button" (click)="openUnitsPicker()">Sélectionner unités</button>
        </div>

        <div class="mt-4 flex gap-2">
          <button class="btn" type="button" (click)="save()">Enregistrer</button>
          <button class="btn-ghost" type="button" (click)="closeDialog()">Annuler</button>
        </div>
      </form>
    </div>
  </app-dialog>

  <app-dialog [open]="unitsPickerOpen()" (close)="closeUnitsPicker()">
    <div class="p-4 max-h-96 overflow-auto">
      <h3 class="font-semibold mb-2">Choisir des unités</h3>
      <div *ngFor="let group of unitsByNature() | keyvalue">
        <div class="font-medium mt-2">{{group.key}}</div>
        <div class="grid grid-cols-2 gap-2">
          <label *ngFor="let u of group.value">
            <input type="checkbox" [checked]="isUnitSelected(u.id)" (change)="toggleUnit(u.id, $event.target.checked)" />
            {{u.code}} — {{u.name}}
          </label>
        </div>
      </div>
      <div class="mt-4">
        <button class="btn" (click)="confirmUnitsPicker()">Valider</button>
        <button class="btn-ghost" (click)="closeUnitsPicker()">Fermer</button>
      </div>
    </div>
  </app-dialog>

</section>
`,
})
export class IndicateursComponent {
  search = signal('');
  filterType = signal('');
  dialogOpen = signal(false);
  unitsPickerOpen = signal(false);
  editingId = signal<string | null>(null);

  // will be initialized in constructor after services are available
  listSignal: any;
  filteredList: any;
  unitsByNature: any;
  form: any;

  // counts
  totalCount: any;
  quantCount: any;
  qualCount: any;

  // staging selection while picker open
  private stagedUnitIds = signal<string[]>([]);

  // ngModel-friendly accessors
  get searchVal() { return this.search(); }
  set searchVal(v: string) { this.search.set(v || ''); }
  get filterTypeVal() { return this.filterType(); }
  set filterTypeVal(v: string) { this.filterType.set(v || ''); }

  constructor(
    private indicateurs: IndicateursService,
    private unites: UnitesService,
    private fb: FormBuilder,
  ) {}

  ngOnInit() {
    // initialize after constructor
    this.listSignal = this.indicateurs.getIndicatorsSignal();

    this.form = this.fb.nonNullable.group({
      id: [''],
      code: [''],
      name: [''],
      type: ['quantitatif'],
      frequence: ['trimestrielle'],
      uniteMesureIds: [[] as string[]],
    });

    this.filteredList = computed(() => {
      const q = this.search().toLowerCase();
      const type = this.filterType();
      return (this.listSignal() || []).filter((i: any) => {
        const matchesQ = !q || i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q);
        const matchesType = !type || i.type === type;
        return matchesQ && matchesType;
      });
    });

    this.totalCount = computed(() => (this.filteredList() || []).length);
    this.quantCount = computed(() => (this.filteredList() || []).filter((i: any) => i.type === 'quantitatif').length);
    this.qualCount = computed(() => (this.filteredList() || []).filter((i: any) => i.type === 'qualitatif').length);

    this.unitsByNature = computed(() => {
      const data = this.unites.getUnitsSignal()();
      const map: Record<string, any[]> = {};
      for (const nature in data) {
        const units = (data as Record<string, any[]>)[nature] || [];
        map[nature] = units;
      }
      return map;
    });
  }

  openNew() {
    this.editingId.set(null);
    this.form.reset({ id: '', code: '', name: '', type: 'quantitatif', frequence: 'trimestrielle', uniteMesureIds: [] });
    this.dialogOpen.set(true);
  }

  edit(ind: any) {
    this.editingId.set(ind.id);
    this.form.patchValue({ ...ind });
    this.dialogOpen.set(true);
  }

  closeDialog() {
    this.dialogOpen.set(false);
  }

  save() {
    const val = this.form.value as any;
    if (!val.code || !val.name || (val.uniteMesureIds || []).length === 0) {
      alert('Code, nom et au moins une unité sont requis');
      return;
    }
    const model = {
      ...val,
      id: val.id || 'ind-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;
    if (this.editingId()) {
      this.indicateurs.updateIndicator(model);
    } else {
      this.indicateurs.addIndicator(model);
    }
    this.closeDialog();
  }

  delete(id: string) {
    if (!confirm('Supprimer cet indicateur ?')) return;
    this.indicateurs.deleteIndicator(id);
  }

  getUnitCode(uid: string) {
    const data = this.unites.getUnitsSignal()();
    const list = Object.values(data).flat();
    const u = list.find((x: any) => x.id === uid);
    return u ? u.code : undefined;
  }

  // Units picker
  openUnitsPicker() {
    this.stagedUnitIds.set([...this.form.value.uniteMesureIds || []]);
    this.unitsPickerOpen.set(true);
  }
  closeUnitsPicker() {
    this.unitsPickerOpen.set(false);
  }
  isUnitSelected(id: string) {
    return (this.stagedUnitIds() || []).includes(id);
  }
  toggleUnit(id: string, checked: boolean) {
    if (checked) {
      this.stagedUnitIds.update((s) => Array.from(new Set([...s, id])));
    } else {
      this.stagedUnitIds.update((s) => s.filter((x) => x !== id));
    }
  }
  confirmUnitsPicker() {
    this.form.patchValue({ uniteMesureIds: this.stagedUnitIds() });
    this.closeUnitsPicker();
  }
  removeUnit(id: string) {
    const cur = this.form.value.uniteMesureIds || [];
    this.form.patchValue({ uniteMesureIds: cur.filter((x: string) => x !== id) });
  }
}
