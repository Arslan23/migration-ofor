import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import {
  Building2,
  FileText,
  Headphones,
  LucideAngularModule,
  Mail,
  RotateCcw,
  Save,
  Settings,
  Shield,
} from 'lucide-angular';
import { SettingsService } from '../../services/settings.service';
import type {
  AppSettings,
  MailingSettings,
  OrganizationSettings,
  ReportHeaderSettings,
  SecuritySettings,
  SystemSettings,
  TechnicalSupportSettings,
} from '../../models/settings.model';

type AdminTab = 'organisation' | 'rapports' | 'support' | 'mailing' | 'systeme' | 'securite';

type AdminTabConfig = {
  id: AdminTab;
  label: string;
  icon: any;
  title: string;
  subtitle: string;
};

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-4 animate-fade-in">
      <div class="flex justify-end">
        <button
          type="button"
          class="inline-flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm hover:bg-accent"
          (click)="handleReset()"
        >
          <lucide-icon [img]="icons.RotateCcw" class="h-4 w-4"></lucide-icon>
          <span class="hidden sm:inline">Réinitialiser</span>
        </button>
      </div>

      <div class="grid grid-cols-3 gap-1 rounded-md bg-muted p-1 lg:grid-cols-6">
        <button
          *ngFor="let tab of tabs"
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-sm px-3 py-2 text-sm font-medium transition-all"
          [ngClass]="activeTab() === tab.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          (click)="activeTab.set(tab.id)"
        >
          <lucide-icon [img]="tab.icon" class="h-4 w-4"></lucide-icon>
          <span class="hidden sm:inline">{{ tab.label }}</span>
        </button>
      </div>

      <div class="rounded-xl border bg-card shadow-sm">
        <div class="border-b p-4">
          <h2 class="text-lg font-semibold">{{ currentTab()?.title }}</h2>
          <p class="text-sm text-muted-foreground">{{ currentTab()?.subtitle }}</p>
        </div>
        <div class="space-y-6 p-4">
          <ng-container [ngSwitch]="activeTab()">
            <div *ngSwitchCase="'organisation'" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div class="space-y-2">
                <label class="text-sm font-medium">Nom complet</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="orgForm().name"
                  (input)="setOrgField('name', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Sigle / Acronyme</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="orgForm().acronym"
                  (input)="setOrgField('acronym', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Slogan</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="orgForm().slogan"
                  (input)="setOrgField('slogan', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Adresse</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="orgForm().address"
                  (input)="setOrgField('address', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Ville</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="orgForm().city"
                  (input)="setOrgField('city', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Pays</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="orgForm().country"
                  (input)="setOrgField('country', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Téléphone</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="orgForm().phone"
                  (input)="setOrgField('phone', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Email</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="orgForm().email"
                  (input)="setOrgField('email', $event)"
                />
              </div>
              <div class="space-y-2 lg:col-span-2">
                <label class="text-sm font-medium">Site web</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="orgForm().website"
                  (input)="setOrgField('website', $event)"
                />
              </div>
            </div>

            <div *ngSwitchCase="'rapports'" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div class="space-y-2">
                <label class="text-sm font-medium">Titre par défaut</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="reportForm().headerTitle"
                  (input)="setReportField('headerTitle', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Sous-titre</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="reportForm().headerSubtitle"
                  (input)="setReportField('headerSubtitle', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Couleur principale</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="reportForm().headerColor"
                  (input)="setReportField('headerColor', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Pied de page</label>
                <textarea
                  class="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  [value]="reportForm().footerLeftText"
                  (input)="setReportField('footerLeftText', $event)"
                ></textarea>
              </div>
              <div class="space-y-2 lg:col-span-2">
                <label class="text-sm font-medium">Confidentialité</label>
                <textarea
                  class="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  [value]="reportForm().confidentialityNotice"
                  (input)="setReportField('confidentialityNotice', $event)"
                ></textarea>
              </div>
            </div>

            <div *ngSwitchCase="'support'" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div class="space-y-2">
                <label class="text-sm font-medium">Email support</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="supportForm().contactEmail"
                  (input)="setSupportField('contactEmail', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Téléphone</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="supportForm().contactPhone"
                  (input)="setSupportField('contactPhone', $event)"
                />
              </div>
              <div class="space-y-2 lg:col-span-2">
                <label class="text-sm font-medium">Nom du support</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="supportForm().contactName"
                  (input)="setSupportField('contactName', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Heures de support</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="supportForm().supportHours"
                  (input)="setSupportField('supportHours', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Documentation URL</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="supportForm().documentationUrl"
                  (input)="setSupportField('documentationUrl', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Ticket URL</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="supportForm().ticketUrl"
                  (input)="setSupportField('ticketUrl', $event)"
                />
              </div>
              <div class="space-y-2 lg:col-span-2">
                <label class="text-sm font-medium">Téléphone d'urgence</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="supportForm().emergencyPhone"
                  (input)="setSupportField('emergencyPhone', $event)"
                />
              </div>
            </div>

            <div *ngSwitchCase="'mailing'" class="space-y-4">
              <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <label class="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    [checked]="mailingForm().enabled"
                    (change)="setMailingEnabled($event)"
                  />
                  Activer les notifications
                </label>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Expéditeur</label>
                  <input
                    class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    [value]="mailingForm().senderName"
                    (input)="setMailingField('senderName', $event)"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Email expéditeur</label>
                  <input
                    class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    [value]="mailingForm().senderEmail"
                    (input)="setMailingField('senderEmail', $event)"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Réponse à</label>
                  <input
                    class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    [value]="mailingForm().replyToEmail"
                    (input)="setMailingField('replyToEmail', $event)"
                  />
                </div>
              </div>

              <div class="space-y-4">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p class="text-sm font-semibold">Groupes de destinataires</p>
                    <p class="text-xs text-muted-foreground">Ajoutez et gérer les adresses email pour chaque groupe.</p>
                  </div>
                  <button
                    type="button"
                    class="inline-flex h-9 items-center gap-2 rounded-md bg-secondary px-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                    (click)="addRecipientGroup()"
                  >
                    Ajouter un groupe
                  </button>
                </div>

                <div class="grid gap-4">
                  <div *ngFor="let group of mailingForm().recipientGroups" class="rounded-xl border bg-background p-4">
                    <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b">
                      <div>
                        <p class="font-semibold">{{ group.name }}</p>
                        <p class="text-xs text-muted-foreground">{{ group.emails.length }} email(s)</p>
                      </div>
                      <button
                        type="button"
                        class="text-xs text-destructive hover:underline"
                        (click)="removeRecipientGroup(group.id)"
                      >
                        Supprimer le groupe
                      </button>
                    </div>
                    <div class="space-y-3 pt-3">
                      <div *ngIf="group.emails.length; else noEmails" class="space-y-2">
                        <p class="text-xs font-medium">Emails</p>
                        <div class="grid gap-2">
                          <div *ngFor="let email of group.emails" class="flex items-center justify-between gap-3 rounded-md border border-input bg-muted p-2 text-sm">
                            <span class="truncate">{{ email }}</span>
                            <button
                              type="button"
                              class="text-xs text-destructive hover:underline"
                              (click)="removeEmailFromGroup(group.id, email)"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                      <ng-template #noEmails>
                        <p class="text-sm text-muted-foreground">Aucun email n'est encore défini.</p>
                      </ng-template>
                      <div class="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <input
                          class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                          placeholder="Nouvel email"
                          [value]="newEmail()"
                          (input)="newEmail.set($any($event.target).value)"
                        />
                        <button
                          type="button"
                          class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                          (click)="addEmailToGroup(group.id)"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div *ngSwitchCase="'systeme'" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div class="space-y-2">
                <label class="text-sm font-medium">Langue par défaut</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="systemForm().defaultLanguage"
                  (input)="setSystemField('defaultLanguage', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Fuseau horaire</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="systemForm().timezone"
                  (input)="setSystemField('timezone', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Format de date</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="systemForm().dateFormat"
                  (input)="setSystemField('dateFormat', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Symbole de devise</label>
                <input
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="systemForm().currencySymbol"
                  (input)="setSystemField('currencySymbol', $event)"
                />
              </div>
              <div class="space-y-2 lg:col-span-2">
                <label class="text-sm font-medium">Message de maintenance</label>
                <textarea
                  class="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  [value]="systemForm().maintenanceMessage"
                  (input)="setSystemField('maintenanceMessage', $event)"
                ></textarea>
              </div>
              <div class="space-y-2">
                <label class="inline-flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    [checked]="systemForm().maintenanceMode"
                    (change)="setSystemField('maintenanceMode', $event)"
                  />
                  Mode maintenance
                </label>
              </div>
            </div>

            <div *ngSwitchCase="'securite'" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div class="space-y-2">
                <label class="text-sm font-medium">Longueur minimale du mot de passe</label>
                <input
                  type="number"
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="securityForm().passwordMinLength"
                  (input)="setSecurityNumberField('passwordMinLength', $event)"
                />
              </div>
              <div class="space-y-2">
                <label class="inline-flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    [checked]="securityForm().passwordRequireUppercase"
                    (change)="setSecurityField('passwordRequireUppercase', $event)"
                  />
                  Exiger une majuscule
                </label>
              </div>
              <div class="space-y-2">
                <label class="inline-flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    [checked]="securityForm().passwordRequireNumbers"
                    (change)="setSecurityField('passwordRequireNumbers', $event)"
                  />
                  Exiger un chiffre
                </label>
              </div>
              <div class="space-y-2">
                <label class="inline-flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    [checked]="securityForm().twoFactorEnabled"
                    (change)="setSecurityField('twoFactorEnabled', $event)"
                  />
                  Authentification à deux facteurs
                </label>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Tentatives max</label>
                <input
                  type="number"
                  class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  [value]="securityForm().maxLoginAttempts"
                  (input)="setSecurityNumberField('maxLoginAttempts', $event)"
                />
              </div>
              <div class="space-y-2 lg:col-span-2">
                <label class="text-sm font-medium">IP Whitelist</label>
                <textarea
                  class="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  [value]="securityForm().ipWhitelist.join('\n')"
                  (input)="setSecurityIpWhitelist($event)"
                ></textarea>
              </div>
            </div>
          </ng-container>
        </div>
        <div class="flex justify-end border-t p-4">
          <button
            type="button"
            class="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            (click)="handleSave()"
          >
            <lucide-icon [img]="icons.Save" class="h-4 w-4"></lucide-icon>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AdministrationComponent {
  readonly icons = { RotateCcw, Save };
  readonly settingsService = inject(SettingsService);
  readonly activeTab = signal<AdminTab>('organisation');
  readonly orgForm = signal<OrganizationSettings>(this.settingsService.settingsSignal().organization);
  readonly reportForm = signal<ReportHeaderSettings>(this.settingsService.settingsSignal().reportHeader);
  readonly supportForm = signal<TechnicalSupportSettings>(this.settingsService.settingsSignal().technicalSupport);
  readonly mailingForm = signal<MailingSettings>(this.settingsService.settingsSignal().mailing);
  readonly systemForm = signal<SystemSettings>(this.settingsService.settingsSignal().system);
  readonly securityForm = signal<SecuritySettings>(this.settingsService.settingsSignal().security);
  readonly newEmail = signal('');

  readonly tabs: AdminTabConfig[] = [
    {
      id: 'organisation',
      label: 'Organisation',
      icon: Building2,
      title: "Informations de l'organisation",
      subtitle: 'Ces informations apparaissent sur les rapports et documents exportés',
    },
    {
      id: 'rapports',
      label: 'Rapports',
      icon: FileText,
      title: 'Personnalisation des en-têtes',
      subtitle: 'Configuration des bannières, logos et exports',
    },
    {
      id: 'support',
      label: 'Support',
      icon: Headphones,
      title: 'Support technique',
      subtitle: 'Contacts affichés aux utilisateurs',
    },
    {
      id: 'mailing',
      label: 'Mailing',
      icon: Mail,
      title: 'Notifications et diffusion',
      subtitle: 'Paramètres SMTP et groupes destinataires',
    },
    {
      id: 'systeme',
      label: 'Système',
      icon: Settings,
      title: 'Préférences système',
      subtitle: 'Langue, fuseau horaire et limites applicatives',
    },
    {
      id: 'securite',
      label: 'Sécurité',
      icon: Shield,
      title: 'Politique de sécurité',
      subtitle: 'Mots de passe, sessions et contrôle d’accès',
    },
  ];

  constructor() {
    effect(() => {
      const settings = this.settingsService.settingsSignal();
      this.orgForm.set(settings.organization);
      this.reportForm.set(settings.reportHeader);
      this.supportForm.set(settings.technicalSupport);
      this.mailingForm.set(settings.mailing);
      this.systemForm.set(settings.system);
      this.securityForm.set(settings.security);
    });
  }

  currentTab() {
    return this.tabs.find((tab) => tab.id === this.activeTab());
  }

  handleSave() {
    switch (this.activeTab()) {
      case 'organisation':
        this.settingsService.updateOrganization(this.orgForm());
        break;
      case 'rapports':
        this.settingsService.updateReportHeader(this.reportForm());
        break;
      case 'support':
        this.settingsService.updateTechnicalSupport(this.supportForm());
        break;
      case 'mailing':
        this.settingsService.updateMailing(this.mailingForm());
        break;
      case 'systeme':
        this.settingsService.updateSystem(this.systemForm());
        break;
      case 'securite':
        this.settingsService.updateSecurity(this.securityForm());
        break;
    }
  }

  handleReset() {
    this.settingsService.resetSettings();
    this.newEmail.set('');
  }

  addRecipientGroup() {
    const groupId = Date.now().toString();
    this.mailingForm.update((value) => ({
      ...value,
      recipientGroups: [...value.recipientGroups, { id: groupId, name: `Groupe ${value.recipientGroups.length + 1}`, emails: [], active: true }],
    }));
  }

  removeRecipientGroup(groupId: string) {
    this.mailingForm.update((value) => ({
      ...value,
      recipientGroups: value.recipientGroups.filter((group) => group.id !== groupId),
    }));
  }

  addEmailToGroup(groupId: string) {
    const email = this.newEmail().trim();
    if (!email) {
      return;
    }
    this.mailingForm.update((value) => ({
      ...value,
      recipientGroups: value.recipientGroups.map((group) =>
        group.id === groupId ? { ...group, emails: [...group.emails, email] } : group,
      ),
    }));
    this.newEmail.set('');
  }

  removeEmailFromGroup(groupId: string, email: string) {
    this.mailingForm.update((value) => ({
      ...value,
      recipientGroups: value.recipientGroups.map((group) =>
        group.id === groupId ? { ...group, emails: group.emails.filter((item) => item !== email) } : group,
      ),
    }));
  }

  // Helpers used by template to update signals (avoid complex inline expressions)
  setOrgField<K extends keyof OrganizationSettings>(field: K, event: Event) {
    const v = (event.target as HTMLInputElement).value;
    this.orgForm.update((cur) => ({ ...cur, [field]: v } as any));
  }

  setReportField<K extends keyof ReportHeaderSettings>(field: K, event: Event) {
    const v = (event.target as HTMLInputElement).value;
    this.reportForm.update((cur) => ({ ...cur, [field]: v } as any));
  }

  setSupportField<K extends keyof TechnicalSupportSettings>(field: K, event: Event) {
    const v = (event.target as HTMLInputElement).value;
    this.supportForm.update((cur) => ({ ...cur, [field]: v } as any));
  }

  setMailingEnabled(event: Event) {
    const checked = !!(event.target as HTMLInputElement).checked;
    this.mailingForm.update((cur) => ({ ...cur, enabled: checked }));
  }

  setMailingField<K extends keyof MailingSettings>(field: K, event: Event) {
    const v = (event.target as HTMLInputElement).value;
    this.mailingForm.update((cur) => ({ ...cur, [field]: v } as any));
  }

  setSystemField<K extends keyof SystemSettings>(field: K, event: Event) {
    const el = event.target as HTMLInputElement;
    const val: any = el.type === 'checkbox' ? !!el.checked : el.value;
    this.systemForm.update((cur) => ({ ...cur, [field]: val } as any));
  }

  setSecurityField<K extends keyof SecuritySettings>(field: K, event: Event) {
    const checked = !!(event.target as HTMLInputElement).checked;
    this.securityForm.update((cur) => ({ ...cur, [field]: checked } as any));
  }

  setSecurityNumberField(field: keyof SecuritySettings, event: Event) {
    const v = Number((event.target as HTMLInputElement).value || 0);
    this.securityForm.update((cur) => ({ ...cur, [field]: v } as any));
  }

  setSecurityIpWhitelist(event: Event) {
    const raw = (event.target as HTMLTextAreaElement).value || '';
    const arr = raw.split('\n').map((s) => s.trim()).filter(Boolean);
    this.securityForm.update((cur) => ({ ...cur, ipWhitelist: arr } as any));
  }
}
