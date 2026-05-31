import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { UniteMesure, UNITES_MESURE_BY_NATURE, ActivityNature } from "@/types/project";

type UnitsByNature = Record<string, UniteMesure[]>;

interface UnitesContextValue {
  unitsByNature: UnitsByNature;
  allUnits: UniteMesure[];
  setUnitsByNature: (data: UnitsByNature) => void;
  addUnit: (nature: string, unit: UniteMesure) => void;
  updateUnit: (oldNature: string, newNature: string, unit: UniteMesure) => void;
  deleteUnit: (nature: string, id: string) => void;
  getUnitById: (id: string) => UniteMesure | undefined;
  getNatureOfUnit: (id: string) => string | undefined;
}

const UnitesContext = createContext<UnitesContextValue | null>(null);

const buildInitial = (): UnitsByNature => {
  const out: UnitsByNature = {};
  Object.entries(UNITES_MESURE_BY_NATURE).forEach(([nature, units]) => {
    out[nature] = units.map((u) => ({ ...u, nature: nature as ActivityNature }));
  });
  return out;
};

export const UnitesProvider = ({ children }: { children: ReactNode }) => {
  const [unitsByNature, setUnitsByNature] = useState<UnitsByNature>(buildInitial);

  const allUnits = useMemo(
    () =>
      Object.entries(unitsByNature).flatMap(([nature, units]) =>
        units.map((u) => ({ ...u, nature: u.nature || (nature as ActivityNature) })),
      ),
    [unitsByNature],
  );

  const addUnit = (nature: string, unit: UniteMesure) =>
    setUnitsByNature((prev) => ({ ...prev, [nature]: [...(prev[nature] || []), unit] }));

  const updateUnit = (oldNature: string, newNature: string, unit: UniteMesure) =>
    setUnitsByNature((prev) => {
      if (oldNature === newNature) {
        return {
          ...prev,
          [newNature]: prev[newNature].map((u) => (u.id === unit.id ? unit : u)),
        };
      }
      return {
        ...prev,
        [oldNature]: prev[oldNature].filter((u) => u.id !== unit.id),
        [newNature]: [...(prev[newNature] || []), unit],
      };
    });

  const deleteUnit = (nature: string, id: string) =>
    setUnitsByNature((prev) => ({
      ...prev,
      [nature]: prev[nature].filter((u) => u.id !== id),
    }));

  const getUnitById = (id: string) => allUnits.find((u) => u.id === id);
  const getNatureOfUnit = (id: string) => {
    for (const [nature, units] of Object.entries(unitsByNature)) {
      if (units.some((u) => u.id === id)) return nature;
    }
    return undefined;
  };

  return (
    <UnitesContext.Provider
      value={{
        unitsByNature,
        allUnits,
        setUnitsByNature,
        addUnit,
        updateUnit,
        deleteUnit,
        getUnitById,
        getNatureOfUnit,
      }}
    >
      {children}
    </UnitesContext.Provider>
  );
};

export const useUnites = () => {
  const ctx = useContext(UnitesContext);
  if (!ctx) throw new Error("useUnites must be used within UnitesProvider");
  return ctx;
};
