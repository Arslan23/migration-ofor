import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  mockPersonnel, 
  ROLE_LABELS, 
  RoleProjet, 
  AffectationPersonnel,
  getPersonnelById,
  getPersonnelFullName 
} from "@/data/personnel";
import { User, Mail, Phone, X } from "lucide-react";

interface PersonnelSelectorProps {
  value: AffectationPersonnel[];
  onChange: (value: AffectationPersonnel[]) => void;
}

const ROLES: RoleProjet[] = [
  "chef_projet",
  "charge_suivi_operationnel",
  "charge_suivi_financier",
  "responsable_passation_marche",
];

const PersonnelSelector = ({ value, onChange }: PersonnelSelectorProps) => {
  const activePersonnel = mockPersonnel.filter(p => p.actif);

  const getAffectationForRole = (role: RoleProjet) => {
    return value.find(a => a.role === role);
  };

  const handleSelectPersonnel = (role: RoleProjet, personnelId: string) => {
    const newValue = value.filter(a => a.role !== role);
    if (personnelId && personnelId !== "none") {
      newValue.push({ role, personnelId });
    }
    onChange(newValue);
  };

  const handleRemovePersonnel = (role: RoleProjet) => {
    onChange(value.filter(a => a.role !== role));
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Équipe projet</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ROLES.map((role) => {
          const affectation = getAffectationForRole(role);
          const personnel = affectation ? getPersonnelById(affectation.personnelId) : null;

          return (
            <div key={role} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {ROLE_LABELS[role]}
              </Label>
              <div className="flex gap-2">
                <Select
                  value={affectation?.personnelId || "none"}
                  onValueChange={(val) => handleSelectPersonnel(role, val)}
                >
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">Non assigné</span>
                    </SelectItem>
                    {activePersonnel.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span>{getPersonnelFullName(p)}</span>
                          <span className="text-muted-foreground text-xs">
                            ({p.matricule})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {affectation && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleRemovePersonnel(role)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              {personnel && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground pl-1">
                  {personnel.email && (
                    <span className="flex items-center gap-0.5">
                      <Mail className="w-3 h-3" />
                      {personnel.email}
                    </span>
                  )}
                  {personnel.telephone && (
                    <span className="flex items-center gap-0.5">
                      <Phone className="w-3 h-3" />
                      {personnel.telephone}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PersonnelSelector;
