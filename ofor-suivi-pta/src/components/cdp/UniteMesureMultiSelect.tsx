import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ChevronsUpDown } from "lucide-react";
import { ActivityNature, UNITES_MESURE_BY_NATURE, getAllUnitesMesure, ACTIVITY_NATURE_LABELS } from "@/types/project";

interface UniteMesureMultiSelectProps {
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const NATURE_ORDER: ActivityNature[] = [
  "etude", "travaux", "formation", "equipement", "sensibilisation", "suivi", "autre",
];

const UniteMesureMultiSelect = ({ value, onChange, placeholder = "Sélectionner les unités…", disabled }: UniteMesureMultiSelectProps) => {
  const all = getAllUnitesMesure();
  const selectedNames = value
    .map((id) => all.find((u) => u.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled} className="w-full justify-between font-normal">
          <span className="truncate text-left">
            {value.length === 0 ? placeholder : `${value.length} unité(s) — ${selectedNames.slice(0, 2).join(", ")}${value.length > 2 ? "…" : ""}`}
          </span>
          <ChevronsUpDown className="w-4 h-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-background z-50" align="start">
        <div className="max-h-80 overflow-auto">
          {NATURE_ORDER.map((nature, idx) => {
            const units = UNITES_MESURE_BY_NATURE[nature] || [];
            if (!units.length) return null;
            const ids = units.map((u) => u.id);
            const selectedInGroup = ids.filter((id) => value.includes(id)).length;
            const allSel = selectedInGroup === ids.length;
            return (
              <div key={nature} className={idx > 0 ? "border-t" : ""}>
                <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2 bg-muted/80 backdrop-blur border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide">{ACTIVITY_NATURE_LABELS[nature] || nature}</span>
                    <Badge variant="outline" className="h-5 text-[10px] px-1.5">{selectedInGroup}/{ids.length}</Badge>
                  </div>
                  <button
                    type="button"
                    className="text-[11px] text-primary hover:underline"
                    onClick={() => {
                      if (allSel) onChange(value.filter((v) => !ids.includes(v)));
                      else onChange(Array.from(new Set([...value, ...ids])));
                    }}
                  >
                    {allSel ? "Tout désélectionner" : "Tout sélectionner"}
                  </button>
                </div>
                <div className="p-1">
                  {units.map((u) => {
                    const checked = value.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs ${checked ? "bg-primary/10" : "hover:bg-muted/60"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) onChange(value.filter((v) => v !== u.id));
                            else onChange([...value, u.id]);
                          }}
                        />
                        <span className="font-mono text-[10px] text-muted-foreground shrink-0">{u.code}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium leading-tight">{u.name}</div>
                          {u.description && (
                            <div className="text-[10px] text-muted-foreground leading-tight truncate" title={u.description}>
                              {u.description}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UniteMesureMultiSelect;
