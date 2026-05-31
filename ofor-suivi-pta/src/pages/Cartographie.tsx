import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Layers, Filter, ZoomIn, ZoomOut, Maximize2, Droplets, Wrench, AlertTriangle, CheckCircle } from "lucide-react";

interface ForagePoint {
  id: string;
  name: string;
  region: string;
  commune: string;
  status: "operationnel" | "panne" | "en_travaux" | "nouveau";
  type: "forage" | "puits" | "aep";
  beneficiaires: number;
}

const foragePoints: ForagePoint[] = [
  { id: "1", name: "Forage Nguer Malal", region: "Louga", commune: "Nguer Malal", status: "operationnel", type: "forage", beneficiaires: 3500 },
  { id: "2", name: "Forage Koki", region: "Louga", commune: "Koki", status: "operationnel", type: "forage", beneficiaires: 2800 },
  { id: "3", name: "Forage Ourossogui", region: "Matam", commune: "Ourossogui", status: "en_travaux", type: "forage", beneficiaires: 5200 },
  { id: "4", name: "AEP Mbour", region: "Thiès", commune: "Mbour", status: "operationnel", type: "aep", beneficiaires: 12000 },
  { id: "5", name: "Forage Tambacounda", region: "Tambacounda", commune: "Tambacounda", status: "panne", type: "forage", beneficiaires: 4100 },
  { id: "6", name: "Forage Kaolack", region: "Kaolack", commune: "Nioro", status: "nouveau", type: "forage", beneficiaires: 0 },
];

const getStatusColor = (status: ForagePoint["status"]) => {
  switch (status) {
    case "operationnel": return "bg-secondary";
    case "panne": return "bg-destructive";
    case "en_travaux": return "bg-amber-500";
    case "nouveau": return "bg-primary";
  }
};

const getStatusLabel = (status: ForagePoint["status"]) => {
  switch (status) {
    case "operationnel": return "Opérationnel";
    case "panne": return "En panne";
    case "en_travaux": return "En travaux";
    case "nouveau": return "Nouveau";
  }
};

const getStatusIcon = (status: ForagePoint["status"]) => {
  switch (status) {
    case "operationnel": return <CheckCircle className="w-4 h-4" />;
    case "panne": return <AlertTriangle className="w-4 h-4" />;
    case "en_travaux": return <Wrench className="w-4 h-4" />;
    case "nouveau": return <Droplets className="w-4 h-4" />;
  }
};

const Cartographie = () => {
  const statsData = [
    { status: "operationnel", count: 1456, label: "Opérationnels", color: "bg-secondary" },
    { status: "panne", count: 89, label: "En panne", color: "bg-destructive" },
    { status: "en_travaux", count: 45, label: "En travaux", color: "bg-amber-500" },
    { status: "nouveau", count: 23, label: "Nouveaux", color: "bg-primary" },
  ];

  return (
    <DashboardLayout
      title="Cartographie"
      subtitle="Visualisation géographique des interventions"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3">
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les régions</SelectItem>
                <SelectItem value="louga">Louga</SelectItem>
                <SelectItem value="matam">Matam</SelectItem>
                <SelectItem value="thies">Thiès</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="operationnel">Opérationnels</SelectItem>
                <SelectItem value="panne">En panne</SelectItem>
                <SelectItem value="en_travaux">En travaux</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Layers className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsData.map((stat) => (
            <Card key={stat.status}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.count}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Map and list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map placeholder */}
          <div className="lg:col-span-2">
            <Card className="h-[500px] relative overflow-hidden">
              <CardContent className="p-0 h-full">
                {/* Senegal map placeholder */}
                <div className="h-full bg-gradient-to-br from-primary/5 to-secondary/5 flex flex-col items-center justify-center relative">
                  {/* Simulated map background */}
                  <div className="absolute inset-0 opacity-10">
                    <svg viewBox="0 0 400 300" className="w-full h-full">
                      {/* Simplified Senegal outline */}
                      <path
                        d="M50,100 Q100,50 200,80 Q300,60 350,100 Q380,150 350,200 Q300,250 200,230 Q100,250 50,200 Q20,150 50,100"
                        fill="hsl(var(--primary))"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>

                  {/* Map points */}
                  <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-secondary animate-pulse" />
                    <div className="absolute top-1/3 left-1/2 w-4 h-4 rounded-full bg-secondary" />
                    <div className="absolute top-1/2 left-1/3 w-4 h-4 rounded-full bg-amber-500" />
                    <div className="absolute top-2/3 left-2/3 w-4 h-4 rounded-full bg-destructive" />
                    <div className="absolute top-1/2 right-1/4 w-4 h-4 rounded-full bg-primary animate-pulse" />
                  </div>

                  {/* Center content */}
                  <div className="relative z-10 text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-10 h-10 text-primary" />
                    </div>
                    <p className="text-lg font-heading font-semibold text-foreground">
                      Carte interactive
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      1,613 points de forages
                    </p>
                    <Button className="mt-4">
                      Ouvrir la carte complète
                    </Button>
                  </div>

                  {/* Zoom controls */}
                  <div className="absolute right-4 bottom-4 flex flex-col gap-2">
                    <Button variant="secondary" size="icon">
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="icon">
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Forage list */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplets className="w-5 h-5 text-primary" />
                Points d'eau récents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border max-h-[430px] overflow-y-auto">
                {foragePoints.map((forage) => (
                  <div
                    key={forage.id}
                    className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(forage.status)}/20`}>
                        {getStatusIcon(forage.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{forage.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {forage.commune}, {forage.region}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(forage.status)}/20 text-foreground`}>
                            {getStatusLabel(forage.status)}
                          </span>
                          {forage.beneficiaires > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {forage.beneficiaires.toLocaleString()} bénéf.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-6 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-secondary" />
                <span className="text-sm text-muted-foreground">Opérationnel</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-destructive" />
                <span className="text-sm text-muted-foreground">En panne</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-500" />
                <span className="text-sm text-muted-foreground">En travaux</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">Nouveau</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Cartographie;
