import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, Package, Wallet, User, FolderOpen, FileText, Edit, Paperclip, MessageSquare, CheckCircle, Lock, Unlock, Clock, FileDown, Send } from "lucide-react";
import AttachmentManager from "@/components/ui/AttachmentManager";
import CommentManager from "@/components/ui/CommentManager";
import ShareByEmailDialog from "@/components/share/ShareByEmailDialog";
import { Attachment } from "@/types/attachment";
import { Comment } from "@/types/comment";
import { PTAActivity, PTA_ITEM_VALIDATION_LABELS, PTA_ITEM_VALIDATION_COLORS } from "@/types/pta";
import { exportPTAActivityDetailToPDF } from "@/lib/exportFicheUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUnites } from "@/contexts/UnitesContext";

interface PTAActivityDetailProps {
  activity: PTAActivity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (activity: PTAActivity) => void;
  onValidate?: (activity: PTAActivity) => void;
  onUnlock?: (activity: PTAActivity) => void;
  year: string;
  canUnlock?: boolean;
}

const formatBudget = (amount: number) => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2)} Mds`;
  }
  if (amount >= 1000000) {
    return new Intl.NumberFormat('fr-FR').format(Math.round(amount / 1000000)) + " M";
  }
  if (amount === 0) return "-";
  return new Intl.NumberFormat('fr-FR').format(amount);
};

const trimestreColors: Record<string, { bg: string; text: string }> = {
  T1: { bg: "bg-blue-100 dark:bg-blue-950", text: "text-blue-700 dark:text-blue-300" },
  T2: { bg: "bg-emerald-100 dark:bg-emerald-950", text: "text-emerald-700 dark:text-emerald-300" },
  T3: { bg: "bg-amber-100 dark:bg-amber-950", text: "text-amber-700 dark:text-amber-300" },
  T4: { bg: "bg-purple-100 dark:bg-purple-950", text: "text-purple-700 dark:text-purple-300" },
};

const PTAActivityDetail = ({ 
  activity, 
  open, 
  onOpenChange, 
  onEdit, 
  onValidate,
  onUnlock,
  year,
  canUnlock = false,
}: PTAActivityDetailProps) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const isMobile = useIsMobile();
  const { allUnits } = useUnites();
  const getUnitDesc = (name: string) => {
    const key = (name || "").trim().toLowerCase();
    const u = allUnits.find((x) => (x.name || "").trim().toLowerCase() === key);
    return u?.description || name;
  };
  const fmtN = (n?: number) => (n && n > 0 ? new Intl.NumberFormat("fr-FR").format(n) : "-");

  if (!activity) return null;

  const isValidated = activity.validationStatus === "valide";
  const canModify = !isValidated;

  const budgetData = [
    { label: "T1", value: activity.budgetT1, color: "bg-blue-500" },
    { label: "T2", value: activity.budgetT2, color: "bg-emerald-500" },
    { label: "T3", value: activity.budgetT3, color: "bg-amber-500" },
    { label: "T4", value: activity.budgetT4, color: "bg-purple-500" },
  ];

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-4">
        <DialogHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-sm sm:text-base leading-tight">{activity.name}</DialogTitle>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <Badge className={PTA_ITEM_VALIDATION_COLORS[activity.validationStatus || "brouillon"] + " text-[9px] sm:text-[10px] h-4 sm:h-5"}>
                  {isValidated ? <Lock className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5" /> : <Unlock className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5" />}
                  {PTA_ITEM_VALIDATION_LABELS[activity.validationStatus || "brouillon"]}
                </Badge>
                <Badge variant="secondary" className="text-[9px] sm:text-[10px] h-4 sm:h-5">{activity.nature}</Badge>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              {!isValidated && onValidate && (
                <Button variant="outline" size="sm" onClick={() => onValidate(activity)} className="h-6 sm:h-7 text-[10px] sm:text-xs text-green-600 hover:text-green-700 px-1.5 sm:px-2">
                  <CheckCircle className="h-3 w-3" />
                  <span className="hidden sm:inline ml-1">Valider</span>
                </Button>
              )}
              {isValidated && canUnlock && onUnlock && (
                <Button variant="outline" size="sm" onClick={() => onUnlock(activity)} className="h-6 sm:h-7 text-[10px] sm:text-xs text-amber-600 hover:text-amber-700 px-1.5 sm:px-2">
                  <Unlock className="h-3 w-3" />
                  <span className="hidden sm:inline ml-1">Déverrouiller</span>
                </Button>
              )}
              {canModify && onEdit && (
                <Button variant="ghost" size="icon" onClick={() => onEdit(activity)} className="h-6 w-6 sm:h-7 sm:w-7">
                  <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2 sm:space-y-3">
          {/* Trimestres */}
          <div className="flex flex-wrap gap-1">
            {activity.trimestres.map((t) => (
              <Badge 
                key={t} 
                className={`${trimestreColors[t].bg} ${trimestreColors[t].text} border-0 text-[9px] sm:text-[10px] h-4 sm:h-5`}
              >
                {t} {year}
              </Badge>
            ))}
          </div>

          {/* Mobile: Accordion layout */}
          {isMobile ? (
            <Accordion type="multiple" defaultValue={["info", "budget"]} className="space-y-1.5">
              <AccordionItem value="info" className="border rounded-lg px-2.5">
                <AccordionTrigger className="py-2 hover:no-underline text-xs">
                  <span className="flex items-center gap-1.5">
                    <FolderOpen className="w-3 h-3 text-primary" />
                    Informations
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-2 space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-muted/40 rounded p-1.5">
                      <p className="text-[9px] text-muted-foreground">Projet</p>
                      <p className="text-[11px] font-medium truncate">{activity.project}</p>
                    </div>
                    <div className="bg-muted/40 rounded p-1.5">
                      <p className="text-[9px] text-muted-foreground">Responsable</p>
                      <p className="text-[11px] font-medium truncate">{activity.responsable}</p>
                    </div>
                  </div>
                  {activity.description && (
                    <div className="bg-muted/40 rounded p-1.5">
                      <p className="text-[9px] text-muted-foreground">Description</p>
                      <p className="text-[11px] leading-relaxed">{activity.description}</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {activity.deliverables.length > 0 && (
                <AccordionItem value="livrables" className="border rounded-lg px-2.5">
                  <AccordionTrigger className="py-2 hover:no-underline text-xs">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3 h-3 text-primary" />
                      Livrables ({activity.deliverables.length})
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="space-y-1.5">
                      {activity.deliverables.map((del) => (
                        <div key={del.id} className="rounded border border-border/40 bg-background/60 p-1.5">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <div className="leading-tight min-w-0">
                              <div className="text-[11px] font-medium truncate">{getUnitDesc(del.unit)}</div>
                              <div className="text-[9px] text-muted-foreground lowercase truncate">{del.unit}</div>
                            </div>
                            <span className="font-semibold text-[11px] shrink-0">{fmtN(del.targetValue)}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-0.5">
                            {(["T1","T2","T3","T4"] as const).map((q, i) => {
                              const colors = ["bg-blue-50/60 dark:bg-blue-950/20","bg-emerald-50/60 dark:bg-emerald-950/20","bg-amber-50/60 dark:bg-amber-950/20","bg-purple-50/60 dark:bg-purple-950/20"];
                              const v = Number((del as any)[`target${q}`]) || 0;
                              return (
                                <div key={q} className={`text-center rounded py-0.5 ${colors[i]}`}>
                                  <div className="text-[8px] text-muted-foreground">{q}</div>
                                  <div className="text-[10px] font-medium">{v > 0 ? fmtN(v) : "-"}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="budget" className="border border-primary/20 bg-primary/5 rounded-lg px-2.5">
                <AccordionTrigger className="py-2 hover:no-underline text-xs">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="w-3 h-3 text-primary" />
                    Budget: {formatBudget(activity.budgetTotal)} FCFA
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="grid grid-cols-4 gap-1">
                    {budgetData.map((item) => (
                      <div 
                        key={item.label} 
                        className={`p-1 rounded text-center ${
                          activity.trimestres.includes(item.label) 
                            ? 'bg-background border border-border' 
                            : 'bg-muted/30 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-0.5 mb-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${item.color}`}></span>
                          <span className="text-[9px] font-medium">{item.label}</span>
                        </div>
                        <p className="text-[10px] font-semibold">
                          {item.value > 0 ? formatBudget(item.value) : "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            /* Desktop: en-tête (infos + budget) puis livrables pleine largeur */
            <div className="space-y-3">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                {/* Colonne gauche : Infos + Description (2/3) */}
                <div className="xl:col-span-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40">
                      <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground">Projet</p>
                        <p className="text-xs font-medium truncate">{activity.project}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40">
                      <User className="w-3.5 h-3.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground">Responsable</p>
                        <p className="text-xs font-medium truncate">{activity.responsable}</p>
                      </div>
                    </div>
                  </div>

                  {activity.description && (
                    <div className="p-2 rounded-md bg-muted/40">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium text-muted-foreground">Description</span>
                      </div>
                      <p className="text-xs leading-relaxed">{activity.description}</p>
                    </div>
                  )}
                </div>

                {/* Colonne droite : Budget (1/3) */}
                <div className="xl:col-span-1">
                  <div className="p-2 rounded-md border border-primary/20 bg-primary/5 h-full">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold">Budget total</span>
                      </div>
                      <span className="text-base font-bold text-primary">
                        {formatBudget(activity.budgetTotal)} FCFA
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {budgetData.map((item) => (
                        <div
                          key={item.label}
                          className={`p-1 rounded text-center ${
                            activity.trimestres.includes(item.label)
                              ? 'bg-background border border-border'
                              : 'bg-muted/30 opacity-50'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-0.5 mb-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${item.color}`}></span>
                            <span className="text-[9px] font-medium">{item.label}</span>
                          </div>
                          <p className="text-[10px] font-semibold">
                            {item.value > 0 ? formatBudget(item.value) : "-"}
                          </p>
                        </div>
                      ))}
                    </div>
                    {activity.budgetTotal > 0 && (
                      <div className="mt-2">
                        <div className="h-3 rounded overflow-hidden flex bg-muted">
                          {budgetData.map((item) => {
                            const percentage = (item.value / activity.budgetTotal) * 100;
                            if (percentage === 0) return null;
                            return (
                              <div
                                key={item.label}
                                className={`${item.color} flex items-center justify-center text-[8px] font-medium text-white`}
                                style={{ width: `${percentage}%` }}
                              >
                                {percentage >= 20 && `${item.label}`}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Livrables : tableau pleine largeur avec cibles trimestrielles */}
              {activity.deliverables.length > 0 && (
                <div className="rounded-md border border-border/60 bg-muted/20 overflow-hidden">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 bg-muted/40 border-b border-border/60">
                    <Package className="w-3 h-3 text-primary" />
                    <span className="text-[11px] font-semibold">Livrables ({activity.deliverables.length})</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">Cibles annuelles et par trimestre</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-background/60">
                          <th className="text-left p-1.5 font-medium text-muted-foreground text-[10px]">Livrable</th>
                          <th className="text-right p-1.5 font-medium text-muted-foreground text-[10px] w-20">Annuel</th>
                          <th className="text-right p-1.5 font-medium text-muted-foreground text-[10px] w-14 bg-blue-50/60 dark:bg-blue-950/20">T1</th>
                          <th className="text-right p-1.5 font-medium text-muted-foreground text-[10px] w-14 bg-emerald-50/60 dark:bg-emerald-950/20">T2</th>
                          <th className="text-right p-1.5 font-medium text-muted-foreground text-[10px] w-14 bg-amber-50/60 dark:bg-amber-950/20">T3</th>
                          <th className="text-right p-1.5 font-medium text-muted-foreground text-[10px] w-14 bg-purple-50/60 dark:bg-purple-950/20">T4</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activity.deliverables.map((del) => {
                          const sumQ = (Number(del.targetT1)||0)+(Number(del.targetT2)||0)+(Number(del.targetT3)||0)+(Number(del.targetT4)||0);
                          const mismatch = del.targetValue > 0 && sumQ !== del.targetValue;
                          return (
                            <tr key={del.id} className="border-b border-border/40 last:border-0 hover:bg-background/40">
                              <td className="p-1.5">
                                <div className="leading-tight">
                                  <div className="font-medium text-[11px]">{getUnitDesc(del.unit)}</div>
                                  <div className="text-[9px] text-muted-foreground lowercase">{del.unit}</div>
                                </div>
                              </td>
                              <td className={`p-1.5 text-right font-semibold text-[11px] ${mismatch ? 'text-amber-600' : ''}`}>
                                {fmtN(del.targetValue)}
                                {mismatch && <div className="text-[9px] font-normal text-muted-foreground">Σ {fmtN(sumQ)}</div>}
                              </td>
                              <td className="p-1.5 text-right text-[11px] bg-blue-50/40 dark:bg-blue-950/10">{fmtN(Number(del.targetT1))}</td>
                              <td className="p-1.5 text-right text-[11px] bg-emerald-50/40 dark:bg-emerald-950/10">{fmtN(Number(del.targetT2))}</td>
                              <td className="p-1.5 text-right text-[11px] bg-amber-50/40 dark:bg-amber-950/10">{fmtN(Number(del.targetT3))}</td>
                              <td className="p-1.5 text-right text-[11px] bg-purple-50/40 dark:bg-purple-950/10">{fmtN(Number(del.targetT4))}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation info */}
          {isValidated && activity.validatedAt && (
            <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-md bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300">
              <Clock className="w-3 h-3 shrink-0" />
              <span className="text-[10px] sm:text-[11px]">
                Validé le {new Date(activity.validatedAt).toLocaleDateString('fr-FR')} par {activity.validatedBy}
              </span>
            </div>
          )}

          {/* Documents & Commentaires */}
          <div className="border-t pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground">
                <Paperclip className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Documents & Commentaires</span>
                <span className="sm:hidden">Docs</span>
                {(attachments.length > 0 || comments.length > 0) && (
                  <div className="flex gap-0.5 sm:gap-1 ml-1">
                    {attachments.length > 0 && (
                      <Badge variant="outline" className="h-3.5 sm:h-4 text-[8px] sm:text-[9px] gap-0.5 px-1">
                        <Paperclip className="w-2 h-2" />
                        {attachments.length}
                      </Badge>
                    )}
                    {comments.length > 0 && (
                      <Badge variant="outline" className="h-3.5 sm:h-4 text-[8px] sm:text-[9px] gap-0.5 px-1">
                        <MessageSquare className="w-2 h-2" />
                        {comments.length}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <AttachmentManager
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                  compact
                />
                <CommentManager
                  comments={comments}
                  onCommentsChange={setComments}
                  currentUser="Utilisateur"
                  compact
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-2 border-t mt-2 gap-2">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareOpen(true)}
              className="h-6 sm:h-7 text-[10px] sm:text-xs px-2"
            >
              <Send className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Partager</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => exportPTAActivityDetailToPDF(activity, parseInt(year))} 
              className="h-6 sm:h-7 text-[10px] sm:text-xs px-2"
            >
              <FileDown className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-6 sm:h-7 text-[10px] sm:text-xs px-2">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    <ShareByEmailDialog
      open={shareOpen}
      onOpenChange={setShareOpen}
      subject={`Activité PTA ${year} — ${activity.name}`}
      contextLabel={`Activité PTA • ${activity.nature}`}
      attachmentName={`activite-pta-${activity.id}.pdf`}
      htmlPreview={`
        <h2 style="margin:0 0 8px 0;">${activity.name}</h2>
        <p style="margin:0 0 12px 0;color:#666;font-size:12px;">PTA ${year} • ${activity.nature}</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Budget total</strong></td><td style="padding:4px 8px;">${formatBudget((activity.budgetT1||0)+(activity.budgetT2||0)+(activity.budgetT3||0)+(activity.budgetT4||0))}</td></tr>
          <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>T1</strong></td><td style="padding:4px 8px;">${formatBudget(activity.budgetT1||0)}</td></tr>
          <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>T2</strong></td><td style="padding:4px 8px;">${formatBudget(activity.budgetT2||0)}</td></tr>
          <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>T3</strong></td><td style="padding:4px 8px;">${formatBudget(activity.budgetT3||0)}</td></tr>
          <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>T4</strong></td><td style="padding:4px 8px;">${formatBudget(activity.budgetT4||0)}</td></tr>
          <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Statut</strong></td><td style="padding:4px 8px;">${PTA_ITEM_VALIDATION_LABELS[activity.validationStatus || 'brouillon']}</td></tr>
        </table>
      `}
    />
    </>
  );
};

export default PTAActivityDetail;