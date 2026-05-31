import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { CURRENCIES, Currency, ProjectFinancement } from "@/types/project";
import { getBailleursActifs } from "@/data/bailleurs";
import { cn } from "@/lib/utils";

interface FinancementsEditorProps {
  value: ProjectFinancement[];
  onChange: (next: ProjectFinancement[]) => void;
  budgetTotalFCFA: number;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

const newRow = (): ProjectFinancement => ({
  id: `fin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  bailleur: "",
  amount: 0,
  currency: "XOF",
  amountFCFA: 0,
});

const FinancementsEditor = ({ value, onChange, budgetTotalFCFA }: FinancementsEditorProps) => {
  const bailleurs = useMemo(() => getBailleursActifs(), []);

  const totalFCFA = useMemo(() => value.reduce((s, f) => s + (f.amountFCFA || 0), 0), [value]);
  const diff = totalFCFA - budgetTotalFCFA;
  const coherent = budgetTotalFCFA > 0 && Math.abs(diff) < 1;

  const update = (id: string, patch: Partial<ProjectFinancement>) => {
    onChange(value.map(f => {
      if (f.id !== id) return f;
      const merged = { ...f, ...patch };
      // Si XOF : amountFCFA = amount
      if (merged.currency === "XOF") merged.amountFCFA = merged.amount;
      return merged;
    }));
  };

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Financements (multi-bailleur)</h4>
          <p className="text-[11px] text-muted-foreground">Détaillez la contribution de chaque bailleur. Les parts sont calculées automatiquement.</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...value, newRow()])}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2 text-center">Aucun financement défini.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left p-1.5 font-medium">Bailleur</th>
                <th className="text-right p-1.5 font-medium w-32">Montant</th>
                <th className="text-left p-1.5 font-medium w-24">Devise</th>
                <th className="text-right p-1.5 font-medium w-32">Équiv. FCFA</th>
                <th className="text-right p-1.5 font-medium w-16">Part</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {value.map(f => {
                const part = totalFCFA > 0 ? (f.amountFCFA / totalFCFA) * 100 : 0;
                const isXOF = f.currency === "XOF";
                return (
                  <tr key={f.id} className="border-b last:border-0">
                    <td className="p-1">
                      <Select value={f.bailleur} onValueChange={(v) => update(f.id, { bailleur: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          {bailleurs.map(b => (
                            <SelectItem key={b.id} value={b.nom}>{b.sigle ? `${b.sigle} - ${b.nom}` : b.nom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-1">
                      <Input type="number" className="h-8 text-xs text-right" value={f.amount || ""}
                        onChange={(e) => update(f.id, { amount: Number(e.target.value) })} />
                    </td>
                    <td className="p-1">
                      <Select value={f.currency} onValueChange={(v) => update(f.id, { currency: v as Currency })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          {CURRENCIES.map(c => (<SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-1">
                      <Input type="number" className="h-8 text-xs text-right" value={f.amountFCFA || ""}
                        disabled={isXOF}
                        onChange={(e) => update(f.id, { amountFCFA: Number(e.target.value) })} />
                    </td>
                    <td className="p-1 text-right font-medium">{part.toFixed(1)}%</td>
                    <td className="p-1 text-right">
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                        onClick={() => onChange(value.filter(x => x.id !== f.id))}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-semibold bg-muted/40">
                <td className="p-1.5 text-right" colSpan={3}>Total financements (FCFA)</td>
                <td className="p-1.5 text-right font-mono">{fmt(totalFCFA)}</td>
                <td className="p-1.5 text-right">100%</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {budgetTotalFCFA > 0 && value.length > 0 && (
        <div className={cn("flex items-center gap-2 rounded-md border px-2 py-1.5 text-[11px]",
          coherent ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300")}>
          {coherent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {coherent
            ? <span>Le total des financements correspond au budget du projet.</span>
            : <span>Écart : {fmt(Math.abs(diff))} FCFA ({diff > 0 ? "financements > budget" : "financements < budget"}).</span>}
        </div>
      )}
    </div>
  );
};

export default FinancementsEditor;
