import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, MapPin } from "lucide-react";
import {
  ZoneIntervention,
  SENEGAL_GEO,
  getDepartementsByRegion,
  getCommunesByDepartement,
  formatZoneIntervention,
  getZoneTypeLabel,
} from "@/data/geoData";

interface ZoneSelectorMultipleProps {
  value: ZoneIntervention[];
  onChange: (zones: ZoneIntervention[]) => void;
  label?: string;
  disabled?: boolean;
}

const ZoneSelectorMultiple = ({
  value = [],
  onChange,
  label = "Zones d'intervention",
  disabled = false,
}: ZoneSelectorMultipleProps) => {
  const [zoneType, setZoneType] = useState<"region" | "departement" | "commune">("region");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedDepartement, setSelectedDepartement] = useState<string>("");
  const [selectedCommune, setSelectedCommune] = useState<string>("");

  const regions = useMemo(() => SENEGAL_GEO.map((r) => ({ code: r.code, name: r.name })), []);
  const departements = useMemo(() => getDepartementsByRegion(selectedRegion), [selectedRegion]);
  const communes = useMemo(() => getCommunesByDepartement(selectedDepartement), [selectedDepartement]);

  const handleZoneTypeChange = (type: "region" | "departement" | "commune") => {
    setZoneType(type);
    setSelectedRegion("");
    setSelectedDepartement("");
    setSelectedCommune("");
  };

  const handleAddZone = () => {
    let newZone: ZoneIntervention | null = null;
    const region = SENEGAL_GEO.find((r) => r.code === selectedRegion);

    if (zoneType === "region" && selectedRegion && region) {
      newZone = {
        type: "region",
        regionCode: region.code,
        regionName: region.name,
      };
    } else if (zoneType === "departement" && selectedDepartement && region) {
      const dept = region.departements.find((d) => d.code === selectedDepartement);
      if (dept) {
        newZone = {
          type: "departement",
          regionCode: region.code,
          regionName: region.name,
          departementCode: dept.code,
          departementName: dept.name,
        };
      }
    } else if (zoneType === "commune" && selectedCommune && region) {
      const dept = region.departements.find((d) => d.code === selectedDepartement);
      const commune = dept?.communes.find((c) => c.code === selectedCommune);
      if (dept && commune) {
        newZone = {
          type: "commune",
          regionCode: region.code,
          regionName: region.name,
          departementCode: dept.code,
          departementName: dept.name,
          communeCode: commune.code,
          communeName: commune.name,
        };
      }
    }

    if (newZone) {
      // Check for duplicates
      const exists = value.some((z) => {
        if (z.type !== newZone!.type) return false;
        if (z.type === "region") return z.regionCode === newZone!.regionCode;
        if (z.type === "departement") return z.departementCode === newZone!.departementCode;
        if (z.type === "commune") return z.communeCode === newZone!.communeCode;
        return false;
      });

      if (!exists) {
        onChange([...value, newZone]);
      }

      // Reset selection
      setSelectedRegion("");
      setSelectedDepartement("");
      setSelectedCommune("");
    }
  };

  const handleRemoveZone = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const canAdd = useMemo(() => {
    if (zoneType === "region") return !!selectedRegion;
    if (zoneType === "departement") return !!selectedDepartement;
    if (zoneType === "commune") return !!selectedCommune;
    return false;
  }, [zoneType, selectedRegion, selectedDepartement, selectedCommune]);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">{label}</label>

      {/* Zone type selector */}
      <div className="flex gap-2">
        {(["region", "departement", "commune"] as const).map((type) => (
          <Button
            key={type}
            type="button"
            variant={zoneType === type ? "default" : "outline"}
            size="sm"
            onClick={() => handleZoneTypeChange(type)}
            disabled={disabled}
          >
            {getZoneTypeLabel(type)}
          </Button>
        ))}
      </div>

      {/* Selectors based on zone type */}
      <div className="flex gap-2 flex-wrap">
        <Select
          value={selectedRegion}
          onValueChange={(val) => {
            setSelectedRegion(val);
            setSelectedDepartement("");
            setSelectedCommune("");
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Région" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {regions.map((r) => (
              <SelectItem key={r.code} value={r.code}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(zoneType === "departement" || zoneType === "commune") && selectedRegion && (
          <Select
            value={selectedDepartement}
            onValueChange={(val) => {
              setSelectedDepartement(val);
              setSelectedCommune("");
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Département" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {departements.map((d) => (
                <SelectItem key={d.code} value={d.code}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {zoneType === "commune" && selectedDepartement && (
          <Select
            value={selectedCommune}
            onValueChange={setSelectedCommune}
            disabled={disabled}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Commune" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50 max-h-60">
              {communes.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={handleAddZone}
          disabled={!canAdd || disabled}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Selected zones display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {value.map((zone, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 py-1"
            >
              <MapPin className="w-3 h-3" />
              <span className="text-xs text-muted-foreground mr-1">
                {getZoneTypeLabel(zone.type)}:
              </span>
              {formatZoneIntervention(zone)}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveZone(index)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Aucune zone sélectionnée. Ajoutez des régions, départements ou communes.
        </p>
      )}
    </div>
  );
};

export default ZoneSelectorMultiple;
