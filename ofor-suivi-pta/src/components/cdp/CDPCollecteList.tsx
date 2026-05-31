import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { CDP_FICHE_STATUS_LABELS, CDP_FICHE_STATUS_COLORS } from "@/types/cdp";
import { CDPCollecteSuivi } from "./CDPCollecteForm";
import { cn } from "@/lib/utils";
import { Plus, Eye, FileDown, History, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";
import ExportButtons from "@/components/ui/ExportButtons";

interface CollecteStats {
  collecte: CDPCollecteSuivi;
  totalIndicateurs: number;
  renseignes: number;
  avgPerformance: number;
}

interface CDPCollecteListProps {
  collectes: CollecteStats[];
  onNewCollecte: () => void;
  onViewCollecte: (collecte: CDPCollecteSuivi) => void;
  onExportCollecte: (collecte: CDPCollecteSuivi) => void;
  onCompareCollectes?: () => void;
}

const CDPCollecteList = ({ 
  collectes, 
  onNewCollecte, 
  onViewCollecte,
  onExportCollecte,
  onCompareCollectes
}: CDPCollecteListProps) => {
  const getPerformanceColor = (rate: number) => {
    if (rate >= 100) return "text-green-600 bg-green-50 dark:bg-green-900/20";
    if (rate >= 80) return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
    return "text-red-600 bg-red-50 dark:bg-red-900/20";
  };

  const getStatusIcon = (status: CDPCollecteSuivi["status"]) => {
    switch (status) {
      case "approuve": return <CheckCircle className="w-3 h-3" />;
      case "valide": return <CheckCircle className="w-3 h-3" />;
      case "soumis": return <Clock className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  // Stats globales
  const totalCollectes = collectes.length;
  const approuvees = collectes.filter(c => c.collecte.status === "approuve").length;
  const enCours = collectes.filter(c => c.collecte.status !== "approuve").length;
  const latestPerf = collectes.length > 0 ? collectes[0].avgPerformance : 0;

  return (
    <div className="space-y-4">
      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total collectes</p>
            <p className="text-xl font-bold">{totalCollectes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Approuvées</p>
            <p className="text-xl font-bold text-green-600">{approuvees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">En cours</p>
            <p className="text-xl font-bold text-amber-600">{enCours}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Dernière perf.</p>
            <p className={cn("text-xl font-bold", getPerformanceColor(latestPerf))}>
              {latestPerf > 0 ? `${Math.round(latestPerf)}%` : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center justify-end gap-2">
            {collectes.length >= 2 && onCompareCollectes && (
              <Button size="sm" variant="outline" onClick={onCompareCollectes}>
                <History className="w-4 h-4 mr-1" /> Comparer
              </Button>
            )}
            <Button size="sm" onClick={onNewCollecte}>
              <Plus className="w-4 h-4 mr-1" /> Nouvelle fiche
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Liste des collectes */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4" />
            Historique des fiches de suivi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {collectes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-center">Indicateurs</TableHead>
                  <TableHead className="w-32">Progression</TableHead>
                  <TableHead className="text-center">Performance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectes.map(({ collecte, totalIndicateurs, renseignes, avgPerformance }) => (
                  <TableRow 
                    key={collecte.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onViewCollecte(collecte)}
                  >
                    <TableCell className="font-medium">
                      {format(new Date(collecte.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{collecte.libelle}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{renseignes}</span>
                      <span className="text-muted-foreground"> / {totalIndicateurs}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={(renseignes / totalIndicateurs) * 100} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-8">
                          {Math.round((renseignes / totalIndicateurs) * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {avgPerformance > 0 ? (
                        <Badge variant="outline" className={cn("text-xs", getPerformanceColor(avgPerformance))}>
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {Math.round(avgPerformance)}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", CDP_FICHE_STATUS_COLORS[collecte.status])}>
                        {getStatusIcon(collecte.status)}
                        <span className="ml-1">{CDP_FICHE_STATUS_LABELS[collecte.status]}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); onViewCollecte(collecte); }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); onExportCollecte(collecte); }}
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Aucune fiche de suivi créée</p>
              <p className="text-sm">Créez une première fiche pour commencer le suivi</p>
              <Button className="mt-4" onClick={onNewCollecte}>
                <Plus className="w-4 h-4 mr-1" /> Créer une fiche
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CDPCollecteList;
