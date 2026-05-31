import { Injectable, computed, effect, signal } from '@angular/core';
import { AppSettings, defaultSettings } from '../models/settings.model';

const STORAGE_KEY = 'ofor_app_settings';

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<AppSettings>;
    return { ...defaultSettings, ...parsed, organization: { ...defaultSettings.organization, ...parsed.organization }, reportHeader: { ...defaultSettings.reportHeader, ...parsed.reportHeader }, technicalSupport: { ...defaultSettings.technicalSupport, ...parsed.technicalSupport }, mailing: { ...defaultSettings.mailing, ...parsed.mailing, notifications: { ...defaultSettings.mailing.notifications, ...(parsed.mailing?.notifications ?? {}) }, recipientGroups: parsed.mailing?.recipientGroups ?? defaultSettings.mailing.recipientGroups }, system: { ...defaultSettings.system, ...parsed.system }, security: { ...defaultSettings.security, ...parsed.security } };
  } catch {
    return defaultSettings;
  }
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  readonly settingsSignal = signal<AppSettings>(loadSettings());
  readonly settings = computed(() => this.settingsSignal());

  constructor() {
    effect(() => {
      if (typeof window === 'undefined') {
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settingsSignal()));
    });
  }

  updateOrganization(data: Partial<AppSettings['organization']>) {
    this.settingsSignal.update((current) => ({
      ...current,
      organization: { ...current.organization, ...data },
    }));
  }

  updateReportHeader(data: Partial<AppSettings['reportHeader']>) {
    this.settingsSignal.update((current) => ({
      ...current,
      reportHeader: { ...current.reportHeader, ...data },
    }));
  }

  updateTechnicalSupport(data: Partial<AppSettings['technicalSupport']>) {
    this.settingsSignal.update((current) => ({
      ...current,
      technicalSupport: { ...current.technicalSupport, ...data },
    }));
  }

  updateMailing(data: Partial<AppSettings['mailing']>) {
    this.settingsSignal.update((current) => ({
      ...current,
      mailing: { ...current.mailing, ...data },
    }));
  }

  updateSystem(data: Partial<AppSettings['system']>) {
    this.settingsSignal.update((current) => ({
      ...current,
      system: { ...current.system, ...data },
    }));
  }

  updateSecurity(data: Partial<AppSettings['security']>) {
    this.settingsSignal.update((current) => ({
      ...current,
      security: { ...current.security, ...data },
    }));
  }

  resetSettings() {
    this.settingsSignal.set(defaultSettings);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
}
