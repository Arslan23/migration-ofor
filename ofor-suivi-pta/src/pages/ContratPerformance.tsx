import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, FileText, Target, TrendingUp } from "lucide-react";
import { CDP, CDP_STATUS_LABELS, CDP_STATUS_COLORS, mockCDPs } from "@/types/cdp";
import { cn } from "@/lib/utils";
import CDPForm from "@/components/cdp/CDPForm";
import { useToast } from "@/hooks/use-toast";

const ContratPerformance = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cdps, setCDPs] = useState<CDP[]>(mockCDPs);
  const [formOpen, setFormOpen] = useState(false);

  const handleCreateCDP = (newCDP: Omit<CDP, "id" | "createdAt" | "createdBy">) => {
    const cdp: CDP = {
      ...newCDP,
      id: `cdp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: "Utilisateur",
    };
    setCDPs(prev => [...prev, cdp]);
    toast({ title: "CDP créé", description: `${cdp.name} a été créé avec succès` });
    navigate(`/contrat-performance/${cdp.id}`);
  };

  return (
    <DashboardLayout title="Contrat de Performance" subtitle="Suivi des objectifs de performance OFOR">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><FileText className="w-5 h-5 text-primary" /></div>
              <div><p className="text-xs text-muted-foreground">CDP actifs</p><p className="text-xl font-bold">{cdps.filter(c => c.status === "actif").length}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Target className="w-5 h-5 text-blue-600" /></div>
              <div><p className="text-xs text-muted-foreground">Indicateurs suivis</p><p className="text-xl font-bold">{cdps.reduce((acc, c) => acc + c.indicateurs.length, 0)}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><TrendingUp className="w-5 h-5 text-green-600" /></div>
              <div><p className="text-xs text-muted-foreground">Performance moyenne</p><p className="text-xl font-bold">94%</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex justify-end items-center">
              <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="w-4 h-4 mr-1" /> Nouveau CDP</Button>
            </CardContent>
          </Card>
        </div>

        {/* Liste des CDP */}
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-base">Contrats de Performance</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Indicateurs</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cdps.map((cdp) => (
                  <TableRow key={cdp.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/contrat-performance/${cdp.id}`)}>
                    <TableCell className="font-mono font-medium">{cdp.code}</TableCell>
                    <TableCell>{cdp.name}</TableCell>
                    <TableCell>{cdp.startYear} - {cdp.endYear}</TableCell>
                    <TableCell>{cdp.indicateurs.length}</TableCell>
                    <TableCell><Badge className={cn("text-xs", CDP_STATUS_COLORS[cdp.status])}>{CDP_STATUS_LABELS[cdp.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); navigate(`/contrat-performance/${cdp.id}`); }}><Eye className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <CDPForm open={formOpen} onOpenChange={setFormOpen} onSave={handleCreateCDP} />
    </DashboardLayout>
  );
};

export default ContratPerformance;
