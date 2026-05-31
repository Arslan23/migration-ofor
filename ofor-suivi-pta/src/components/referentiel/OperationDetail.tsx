import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Workflow, Ruler, Building2, ListChecks, CheckCircle2 } from "lucide-react";
import { Operation, OperationNature } from "@/data/operations";
import { getServiceById } from "@/data/entitesExecution";
import { DEFAULT_WORKFLOWS, getWorkflowForNature } from "@/types/workflow";
import { useUnites } from "@/contexts/UnitesContext";
import { ActivityNature, ACTIVITY_NATURE_LABELS } from "@/types/project";

// Mapping OperationNature (label) -> ActivityNature (clé technique)
const OP_NATURE_TO_ACTIVITY: Record<OperationNature, ActivityNature> = {
  "Infrastructure": "travaux",
  "Maintenance": "autre",
  "Équipement": "equipement",
  "Formation": "formation",
  "Étude": "etude",
  "Sensibilisation": "sensibilisation",
  "Suivi-évaluation": "suivi",
  "Travaux": "travaux",
};

interface Props {
  operation: Operation | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onEdit?: (op: Operation) => void;
}

const OperationDetail = ({ operation, open, onOpenChange, onEdit }: Props) => {
  const { unitsByNature } = useUnites();

  const service = operation ? getServiceById(operation.serviceId) : undefined;
  const activityNatureKey = useMemo<ActivityNature | undefined>(() => {
    return operation?.nature ? OP_NATURE_TO_ACTIVITY[operation.nature] : undefined;
  }, [operation]);

  const workflow = useMemo(() => {
    return activityNatureKey ? getWorkflowForNature(activityNatureKey, DEFAULT_WORKFLOWS) : undefined;
  }, [activityNatureKey]);

  const units = useMemo(() => {
    return activityNatureKey ? (unitsByNature[activityNatureKey] || []) : [];
  }, [activityNatureKey, unitsByNature]);

  if (!operation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">{operation.code}</Badge>
                {operation.libelle}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 flex-wrap">
                <Building2 className="w-3.5 h-3.5" />
                {service?.nom || "Service inconnu"}
                {service?.code && <Badge variant="secondary" className="text-[10px] font-mono">{service.code}</Badge>}
                <Badge variant={operation.actif ? "default" : "secondary"} className="text-[10px]">
                  {operation.actif ? "Actif" : "Inactif"}
                </Badge>
              </DialogDescription>
            </div>
            {onEdit && (
              <Button size="sm" variant="outline" onClick={() => onEdit(operation)}>
                <Pencil className="w-3.5 h-3.5 mr-1" />
                Modifier
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Identité */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Informations générales</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Code</div>
                <div className="font-mono">{operation.code}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Service responsable</div>
                <div>{service?.nom || "—"}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground">Libellé</div>
                <div className="font-medium">{operation.libelle}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Nature d'activité</div>
                <div>
                  {operation.nature ? (
                    <Badge variant="outline" className="text-xs">{operation.nature}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">Non spécifiée</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Statut</div>
                <Badge variant={operation.actif ? "default" : "secondary"} className="text-xs">
                  {operation.actif ? "Actif" : "Inactif"}
                </Badge>
              </div>
              {operation.description && (
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Description</div>
                  <div className="text-sm">{operation.description}</div>
                </div>
              )}
            </div>
          </section>

          {/* Section nature d'activité */}
          {activityNatureKey ? (
            <>
              <Separator />
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                    Configuration héritée — Nature « {operation.nature} »
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {ACTIVITY_NATURE_LABELS[activityNatureKey]}
                  </Badge>
                </div>

                {/* Workflow */}
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Workflow className="w-4 h-4 text-primary" />
                    Workflow de suivi
                    {workflow && (
                      <Badge variant="outline" className="ml-auto text-[10px] font-mono">{workflow.code}</Badge>
                    )}
                  </div>
                  {workflow ? (
                    <>
                      <div className="text-xs text-muted-foreground">{workflow.name}{workflow.description ? ` — ${workflow.description}` : ""}</div>
                      <div className="flex items-center flex-wrap gap-1.5 pt-1">
                        {workflow.steps.map((s, i) => (
                          <div key={s.id} className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded border bg-muted/40">
                              <span className="text-[10px] font-mono text-muted-foreground">{s.order}.</span>
                              <span className="text-xs font-medium">{s.name}</span>
                              {s.isFinal && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                            </div>
                            {i < workflow.steps.length - 1 && (
                              <span className="text-muted-foreground text-xs">→</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">Aucun workflow associé</div>
                  )}
                </div>

                {/* Unités */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 text-sm font-medium px-3 py-2 bg-muted/40 border-b">
                    <Ruler className="w-4 h-4 text-primary" />
                    Unités de mesure
                    <Badge variant="secondary" className="ml-auto text-[10px]">{units.length}</Badge>
                  </div>
                  {units.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px] h-8 text-xs">Code</TableHead>
                          <TableHead className="h-8 text-xs">Libellé</TableHead>
                          <TableHead className="h-8 text-xs">Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {units.map(u => (
                          <TableRow key={u.id}>
                            <TableCell className="font-mono text-xs py-1.5">{u.code}</TableCell>
                            <TableCell className="text-sm py-1.5">{u.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground py-1.5">{u.description || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                      Aucune unité définie pour cette nature
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <ListChecks className="w-3 h-3" />
                  Workflow et unités sont hérités par défaut par les activités PTA rattachées à cette opération.
                </p>
              </section>
            </>
          ) : (
            <div className="text-xs text-muted-foreground italic border rounded-lg p-3">
              Aucune nature d'activité spécifiée — le workflow et les unités de mesure ne peuvent être déterminés automatiquement.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OperationDetail;
