import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SENEGAL_GEO, ZoneIntervention, Region, Departement } from "@/data/geoData";
import {
  ChevronRight,
  ChevronDown,
  MapPin,
  Building2,
  Home,
  Search,
  X,
  TreeDeciduous,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ZoneTreeSelectorProps {
  value: ZoneIntervention[];
  onChange: (zones: ZoneIntervention[]) => void;
  label?: string;
  disabled?: boolean;
  triggerClassName?: string;
}

// Génère un ID unique pour une zone
const getZoneId = (zone: ZoneIntervention): string => {
  if (zone.communeCode) return zone.communeCode;
  if (zone.departementCode) return zone.departementCode;
  return zone.regionCode;
};

// Vérifie si une zone est sélectionnée
const isZoneSelected = (zones: ZoneIntervention[], zone: ZoneIntervention): boolean => {
  return zones.some((z) => getZoneId(z) === getZoneId(zone));
};

// Composant pour une commune
const CommuneItem: React.FC<{
  commune: { code: string; name: string };
  region: Region;
  departement: Departement;
  isSelected: boolean;
  onToggle: (zone: ZoneIntervention, selected: boolean) => void;
}> = ({ commune, region, departement, isSelected, onToggle }) => {
  const zone: ZoneIntervention = {
    type: "commune",
    regionCode: region.code,
    regionName: region.name,
    departementCode: departement.code,
    departementName: departement.name,
    communeCode: commune.code,
    communeName: commune.name,
  };

  return (
    <div className="flex items-center gap-2 py-1 pl-10 pr-2 hover:bg-muted/50 rounded-sm">
      <Checkbox
        id={commune.code}
        checked={isSelected}
        onCheckedChange={(checked) => onToggle(zone, checked as boolean)}
      />
      <Home className="h-3 w-3 text-muted-foreground" />
      <label
        htmlFor={commune.code}
        className="text-sm cursor-pointer flex-1 truncate"
      >
        {commune.name}
      </label>
    </div>
  );
};

// Composant pour un département
const DepartementItem: React.FC<{
  departement: Departement;
  region: Region;
  selectedZones: ZoneIntervention[];
  onToggle: (zone: ZoneIntervention, selected: boolean) => void;
  searchQuery: string;
}> = ({ departement, region, selectedZones, onToggle, searchQuery }) => {
  const [isOpen, setIsOpen] = useState(false);

  const deptZone: ZoneIntervention = {
    type: "departement",
    regionCode: region.code,
    regionName: region.name,
    departementCode: departement.code,
    departementName: departement.name,
  };

  const isDeptSelected = isZoneSelected(selectedZones, deptZone);

  // Filtrer les communes selon la recherche
  const filteredCommunes = useMemo(() => {
    if (!searchQuery) return departement.communes;
    return departement.communes.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [departement.communes, searchQuery]);

  // Ouvrir automatiquement si des communes matchent la recherche
  React.useEffect(() => {
    if (searchQuery && filteredCommunes.length > 0) {
      setIsOpen(true);
    }
  }, [searchQuery, filteredCommunes.length]);

  if (searchQuery && filteredCommunes.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2 py-1 pl-5 pr-2 hover:bg-muted/50 rounded-sm">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
            {isOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        </CollapsibleTrigger>
        <Checkbox
          id={departement.code}
          checked={isDeptSelected}
          onCheckedChange={(checked) => onToggle(deptZone, checked as boolean)}
        />
        <Building2 className="h-3.5 w-3.5 text-primary" />
        <label
          htmlFor={departement.code}
          className="text-sm font-medium cursor-pointer flex-1 truncate"
        >
          {departement.name}
        </label>
        <Badge variant="secondary" className="text-xs h-5">
          {departement.communes.length}
        </Badge>
      </div>
      <CollapsibleContent className="ml-2 border-l border-border pl-2">
        {filteredCommunes.map((commune) => (
          <CommuneItem
            key={commune.code}
            commune={commune}
            region={region}
            departement={departement}
            isSelected={isZoneSelected(selectedZones, {
              type: "commune",
              regionCode: region.code,
              regionName: region.name,
              departementCode: departement.code,
              departementName: departement.name,
              communeCode: commune.code,
              communeName: commune.name,
            })}
            onToggle={onToggle}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

// Composant pour une région
const RegionItem: React.FC<{
  region: Region;
  selectedZones: ZoneIntervention[];
  onToggle: (zone: ZoneIntervention, selected: boolean) => void;
  searchQuery: string;
}> = ({ region, selectedZones, onToggle, searchQuery }) => {
  const [isOpen, setIsOpen] = useState(false);

  const regionZone: ZoneIntervention = {
    type: "region",
    regionCode: region.code,
    regionName: region.name,
  };

  const isRegionSelected = isZoneSelected(selectedZones, regionZone);

  // Filtrer les départements selon la recherche
  const filteredDepartements = useMemo(() => {
    if (!searchQuery) return region.departements;
    return region.departements.filter(
      (d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.communes.some((c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  }, [region.departements, searchQuery]);

  // Ouvrir automatiquement si des départements matchent la recherche
  React.useEffect(() => {
    if (searchQuery && filteredDepartements.length > 0) {
      setIsOpen(true);
    }
  }, [searchQuery, filteredDepartements.length]);

  const shouldShow =
    !searchQuery ||
    region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    filteredDepartements.length > 0;

  if (!shouldShow) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 rounded-sm">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <Checkbox
          id={region.code}
          checked={isRegionSelected}
          onCheckedChange={(checked) => onToggle(regionZone, checked as boolean)}
        />
        <MapPin className="h-4 w-4 text-primary" />
        <label
          htmlFor={region.code}
          className="text-sm font-semibold cursor-pointer flex-1"
        >
          {region.name}
        </label>
        <Badge variant="outline" className="text-xs h-5">
          {region.departements.length} dép.
        </Badge>
      </div>
      <CollapsibleContent className="ml-3 border-l-2 border-primary/20 pl-2">
        {filteredDepartements.map((departement) => (
          <DepartementItem
            key={departement.code}
            departement={departement}
            region={region}
            selectedZones={selectedZones}
            onToggle={onToggle}
            searchQuery={searchQuery}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const ZoneTreeSelector: React.FC<ZoneTreeSelectorProps> = ({
  value,
  onChange,
  label = "Zones d'intervention",
  disabled = false,
  triggerClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelection, setTempSelection] = useState<ZoneIntervention[]>([]);

  // Ouvrir le dialog et initialiser la sélection temporaire
  const handleOpen = () => {
    setTempSelection([...value]);
    setSearchQuery("");
    setIsOpen(true);
  };

  // Toggle une zone dans la sélection temporaire
  const handleToggle = (zone: ZoneIntervention, selected: boolean) => {
    if (selected) {
      setTempSelection([...tempSelection, zone]);
    } else {
      setTempSelection(
        tempSelection.filter((z) => getZoneId(z) !== getZoneId(zone))
      );
    }
  };

  // Confirmer la sélection
  const handleConfirm = () => {
    onChange(tempSelection);
    setIsOpen(false);
  };

  // Supprimer une zone de la sélection actuelle
  const handleRemoveZone = (index: number) => {
    const newZones = [...value];
    newZones.splice(index, 1);
    onChange(newZones);
  };

  // Obtenir le label d'affichage d'une zone
  const getZoneLabel = (zone: ZoneIntervention): string => {
    if (zone.communeName) return zone.communeName;
    if (zone.departementName) return zone.departementName;
    return zone.regionName;
  };

  // Obtenir le type badge d'une zone
  const getZoneTypeBadge = (zone: ZoneIntervention) => {
    switch (zone.type) {
      case "region":
        return (
          <Badge variant="default" className="text-xs h-4 px-1">
            R
          </Badge>
        );
      case "departement":
        return (
          <Badge variant="secondary" className="text-xs h-4 px-1">
            D
          </Badge>
        );
      case "commune":
        return (
          <Badge variant="outline" className="text-xs h-4 px-1">
            C
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}

      {/* Bouton pour ouvrir le sélecteur */}
      <Button
        type="button"
        variant="outline"
        onClick={handleOpen}
        disabled={disabled}
        className={cn("w-full justify-start gap-2", triggerClassName)}
      >
        <TreeDeciduous className="h-4 w-4" />
        <span>
          {value.length === 0
            ? "Sélectionner des zones"
            : `${value.length} zone(s) sélectionnée(s)`}
        </span>
      </Button>

      {/* Affichage des zones sélectionnées */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-muted/30 max-h-24 overflow-y-auto">
          {value.map((zone, index) => (
            <Badge
              key={getZoneId(zone)}
              variant="secondary"
              className="gap-1 pr-1 text-xs"
            >
              {getZoneTypeBadge(zone)}
              <span className="max-w-[120px] truncate">{getZoneLabel(zone)}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive/20"
                onClick={() => handleRemoveZone(index)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Dialog de sélection */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TreeDeciduous className="h-5 w-5 text-primary" />
              Sélection des zones d'intervention
            </DialogTitle>
          </DialogHeader>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une zone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Légende */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground px-2">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-primary" />
              <span>Région</span>
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3 text-primary" />
              <span>Département</span>
            </div>
            <div className="flex items-center gap-1">
              <Home className="h-3 w-3 text-muted-foreground" />
              <span>Commune</span>
            </div>
            <div className="ml-auto">
              {tempSelection.length} sélectionnée(s)
            </div>
          </div>

          {/* Arbre des zones */}
          <ScrollArea className="flex-1 border rounded-md p-2">
            <div className="space-y-0.5">
              {SENEGAL_GEO.map((region) => (
                <RegionItem
                  key={region.code}
                  region={region}
                  selectedZones={tempSelection}
                  onToggle={handleToggle}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          </ScrollArea>

          {/* Zones sélectionnées dans le dialog */}
          {tempSelection.length > 0 && (
            <div className="border rounded-md p-2 bg-muted/30">
              <div className="text-xs text-muted-foreground mb-1.5">
                Zones sélectionnées:
              </div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {tempSelection.map((zone, index) => (
                  <Badge
                    key={getZoneId(zone)}
                    variant="secondary"
                    className="gap-1 pr-1 text-xs"
                  >
                    {getZoneTypeBadge(zone)}
                    <span className="max-w-[100px] truncate">
                      {getZoneLabel(zone)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive/20"
                      onClick={() =>
                        setTempSelection(
                          tempSelection.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleConfirm}>
              Confirmer ({tempSelection.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ZoneTreeSelector;
