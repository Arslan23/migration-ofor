import { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, PieChart as PieChartIcon, FileText } from "lucide-react";
import { mockProjects } from "@/data/mockProjects";
import { REGIONS } from "@/types/project";
import { mockCDPs } from "@/types/cdp";

type ReportType = "projets" | "pta" | "cdp" | "livrables" | "budget" | "indicateurs";
type ViewMode = "graphique" | "tableau";

interface ReportingFiltersProps {
  reportType: ReportType;
  viewMode: ViewMode;
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
  selectedYear: string;
  setSelectedYear: Dispatch<SetStateAction<string>>;
  selectedPeriod: string;
  setSelectedPeriod: Dispatch<SetStateAction<string>>;
  selectedRegion: string;
  setSelectedRegion: Dispatch<SetStateAction<string>>;
  selectedProject: string;
  setSelectedProject: Dispatch<SetStateAction<string>>;
  selectedCDPId: string;
  setSelectedCDPId: Dispatch<SetStateAction<string>>;
}

export const ReportingFilters = ({
  reportType,
  viewMode,
  setViewMode,
  selectedYear,
  setSelectedYear,
  selectedPeriod,
  setSelectedPeriod,
  selectedRegion,
  setSelectedRegion,
  selectedProject,
  setSelectedProject,
  selectedCDPId,
  setSelectedCDPId,
}: ReportingFiltersProps) => {
  return (
    <Card className="mt-3">
      <CardContent className="py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Filtres:</span>
          </div>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24 h-7 text-xs">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-28 h-7 text-xs">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="annuel">Annuel</SelectItem>
              <SelectItem value="T1">Trimestre 1</SelectItem>
              <SelectItem value="T2">Trimestre 2</SelectItem>
              <SelectItem value="T3">Trimestre 3</SelectItem>
              <SelectItem value="T4">Trimestre 4</SelectItem>
              <SelectItem value="mensuel">Mensuel</SelectItem>
            </SelectContent>
          </Select>

          {reportType !== "cdp" && (
            <>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-36 h-7 text-xs">
                  <SelectValue placeholder="Région" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes régions</SelectItem>
                  {REGIONS.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-44 h-7 text-xs">
                  <SelectValue placeholder="Projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous projets</SelectItem>
                  {mockProjects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {reportType === "cdp" && (
            <Select value={selectedCDPId} onValueChange={setSelectedCDPId}>
              <SelectTrigger className="w-56 h-7 text-xs">
                <SelectValue placeholder="CDP" />
              </SelectTrigger>
              <SelectContent>
                {mockCDPs.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="ml-auto flex items-center gap-1 border rounded-md p-0.5">
            <Button 
              variant={viewMode === "graphique" ? "secondary" : "ghost"} 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => setViewMode("graphique")}
            >
              <PieChartIcon className="w-3 h-3 mr-1" /> Graphiques
            </Button>
            <Button 
              variant={viewMode === "tableau" ? "secondary" : "ghost"} 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => setViewMode("tableau")}
            >
              <FileText className="w-3 h-3 mr-1" /> Tableau
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
