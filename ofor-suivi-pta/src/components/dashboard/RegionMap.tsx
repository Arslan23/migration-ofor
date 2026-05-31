import { MapPin } from "lucide-react";

interface RegionData {
  name: string;
  projects: number;
  forages: number;
}

const regions: RegionData[] = [
  { name: "Louga", projects: 12, forages: 245 },
  { name: "Matam", projects: 8, forages: 189 },
  { name: "Thiès", projects: 15, forages: 312 },
  { name: "Tambacounda", projects: 10, forages: 178 },
  { name: "Saint-Louis", projects: 9, forages: 203 },
  { name: "Kaolack", projects: 7, forages: 156 },
];

const RegionMap = () => {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-heading font-semibold text-lg">Zones d'intervention</h3>
          <p className="text-sm text-muted-foreground">Répartition par région</p>
        </div>
        <button className="text-sm font-medium text-primary hover:underline">
          Voir la carte →
        </button>
      </div>

      {/* Simplified map placeholder */}
      <div className="relative bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 mb-6 min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Carte interactive des interventions
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            14 régions couvertes
          </p>
        </div>
      </div>

      {/* Region stats */}
      <div className="grid grid-cols-2 gap-3">
        {regions.map((region) => (
          <div
            key={region.name}
            className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
          >
            <p className="font-medium text-sm text-foreground">{region.name}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                {region.projects} projets
              </span>
              <span className="text-xs text-primary font-medium">
                {region.forages} forages
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegionMap;
