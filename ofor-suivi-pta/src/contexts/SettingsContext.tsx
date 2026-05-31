import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AppSettings, defaultSettings } from "@/types/settings";

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateOrganization: (data: Partial<AppSettings["organization"]>) => void;
  updateReportHeader: (data: Partial<AppSettings["reportHeader"]>) => void;
  updateTechnicalSupport: (data: Partial<AppSettings["technicalSupport"]>) => void;
  updateMailing: (data: Partial<AppSettings["mailing"]>) => void;
  updateSystem: (data: Partial<AppSettings["system"]>) => void;
  updateSecurity: (data: Partial<AppSettings["security"]>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = "ofor_app_settings";

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateOrganization = (data: Partial<AppSettings["organization"]>) => {
    setSettings(prev => ({
      ...prev,
      organization: { ...prev.organization, ...data },
    }));
  };

  const updateReportHeader = (data: Partial<AppSettings["reportHeader"]>) => {
    setSettings(prev => ({
      ...prev,
      reportHeader: { ...prev.reportHeader, ...data },
    }));
  };

  const updateTechnicalSupport = (data: Partial<AppSettings["technicalSupport"]>) => {
    setSettings(prev => ({
      ...prev,
      technicalSupport: { ...prev.technicalSupport, ...data },
    }));
  };

  const updateMailing = (data: Partial<AppSettings["mailing"]>) => {
    setSettings(prev => ({
      ...prev,
      mailing: { ...prev.mailing, ...data },
    }));
  };

  const updateSystem = (data: Partial<AppSettings["system"]>) => {
    setSettings(prev => ({
      ...prev,
      system: { ...prev.system, ...data },
    }));
  };

  const updateSecurity = (data: Partial<AppSettings["security"]>) => {
    setSettings(prev => ({
      ...prev,
      security: { ...prev.security, ...data },
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateOrganization,
        updateReportHeader,
        updateTechnicalSupport,
        updateMailing,
        updateSystem,
        updateSecurity,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

// Hook pour obtenir les paramètres de rapport
export const useReportSettings = () => {
  const { settings } = useSettings();
  return {
    organization: settings.organization,
    reportHeader: settings.reportHeader,
  };
};

// Hook pour obtenir les paramètres de support
export const useSupportSettings = () => {
  const { settings } = useSettings();
  return settings.technicalSupport;
};
