import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send, X, Paperclip, Eye, Users } from "lucide-react";
import { mockPersonnel } from "@/data/personnel";
import { toast } from "@/hooks/use-toast";

interface ShareByEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Titre de l'élément partagé (ex: "Synthèse projet PEPAM") */
  subject: string;
  /** Aperçu HTML du corps du mail */
  htmlPreview: string;
  /** Nom du PDF joint simulé (ex: "synthese-projet-pepam.pdf") */
  attachmentName?: string;
  /** Contexte (ex: "Projet", "Activité PTA", "Indicateur") */
  contextLabel?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ShareByEmailDialog = ({
  open,
  onOpenChange,
  subject,
  htmlPreview,
  attachmentName,
  contextLabel,
}: ShareByEmailDialogProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [manualEmails, setManualEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [search, setSearch] = useState("");
  const [editableSubject, setEditableSubject] = useState(subject);
  const [message, setMessage] = useState(
    `Bonjour,\n\nVeuillez trouver ci-joint la synthèse demandée.\n\nCordialement.`
  );
  const [sending, setSending] = useState(false);

  const personnelWithEmail = useMemo(
    () => mockPersonnel.filter((p) => p.actif && p.email),
    []
  );

  const filteredPersonnel = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return personnelWithEmail;
    return personnelWithEmail.filter(
      (p) =>
        `${p.prenom} ${p.nom}`.toLowerCase().includes(q) ||
        p.email!.toLowerCase().includes(q) ||
        p.fonction.toLowerCase().includes(q)
    );
  }, [search, personnelWithEmail]);

  const toggleId = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const addEmail = () => {
    const v = emailInput.trim();
    if (!v) return;
    if (!EMAIL_RE.test(v)) {
      toast({ title: "Email invalide", variant: "destructive" });
      return;
    }
    if (!manualEmails.includes(v)) setManualEmails([...manualEmails, v]);
    setEmailInput("");
  };

  const removeManual = (e: string) =>
    setManualEmails(manualEmails.filter((x) => x !== e));

  const allRecipients = useMemo(() => {
    const fromPers = personnelWithEmail
      .filter((p) => selectedIds.includes(p.id))
      .map((p) => ({ email: p.email!, label: `${p.prenom} ${p.nom}` }));
    const fromManual = manualEmails.map((e) => ({ email: e, label: e }));
    return [...fromPers, ...fromManual];
  }, [selectedIds, manualEmails, personnelWithEmail]);

  const handleSend = async () => {
    if (allRecipients.length === 0) {
      toast({ title: "Aucun destinataire sélectionné", variant: "destructive" });
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    toast({
      title: "Mail envoyé (simulation)",
      description: `${allRecipients.length} destinataire(s) • ${attachmentName ?? "Sans pièce jointe"}`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Partager par email</DialogTitle>
              <DialogDescription>
                {contextLabel && <span className="font-medium">{contextLabel} • </span>}
                Sélectionnez les destinataires et prévisualisez le contenu.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Colonne gauche : destinataires + paramètres */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Objet</Label>
              <Input
                value={editableSubject}
                onChange={(e) => setEditableSubject(e.target.value)}
                className="h-9"
              />
            </div>

            <Tabs defaultValue="personnel" className="w-full">
              <TabsList className="grid grid-cols-2 h-8">
                <TabsTrigger value="personnel" className="text-xs gap-1">
                  <Users className="w-3 h-3" /> Personnel
                </TabsTrigger>
                <TabsTrigger value="manuel" className="text-xs">Saisie libre</TabsTrigger>
              </TabsList>
              <TabsContent value="personnel" className="space-y-2 mt-2">
                <Input
                  placeholder="Rechercher (nom, email, fonction)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 text-sm"
                />
                <ScrollArea className="h-48 border rounded-md p-2">
                  <div className="space-y-1">
                    {filteredPersonnel.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={selectedIds.includes(p.id)}
                          onCheckedChange={() => toggleId(p.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs truncate">
                            {p.prenom} {p.nom}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {p.email} • {p.fonction}
                          </div>
                        </div>
                      </label>
                    ))}
                    {filteredPersonnel.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Aucun résultat
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="manuel" className="space-y-2 mt-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="email@exemple.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addEmail();
                      }
                    }}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" onClick={addEmail} variant="outline">
                    Ajouter
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 min-h-[40px] p-2 border rounded-md">
                  {manualEmails.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      Aucun email ajouté
                    </span>
                  )}
                  {manualEmails.map((e) => (
                    <Badge key={e} variant="secondary" className="gap-1">
                      {e}
                      <button onClick={() => removeManual(e)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <Label className="text-xs">Message d'accompagnement</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="text-sm"
              />
            </div>

            {attachmentName && (
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded text-xs">
                <Paperclip className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">{attachmentName}</span>
                <Badge variant="outline" className="ml-auto text-[10px]">PDF</Badge>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{allRecipients.length} destinataire(s) sélectionné(s)</span>
            </div>
          </div>

          {/* Colonne droite : prévisualisation */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Eye className="w-3.5 h-3.5" /> Prévisualisation
            </div>
            <div className="border rounded-md overflow-hidden bg-white">
              <div className="bg-muted/40 px-3 py-2 border-b text-xs space-y-0.5">
                <div><span className="text-muted-foreground">À : </span>
                  {allRecipients.length > 0
                    ? allRecipients.map((r) => r.email).join(", ")
                    : <em className="text-muted-foreground">aucun</em>}
                </div>
                <div><span className="text-muted-foreground">Objet : </span>
                  <span className="font-medium">{editableSubject}</span>
                </div>
              </div>
              <ScrollArea className="h-[420px]">
                <div className="p-4 text-sm">
                  <div className="whitespace-pre-wrap mb-4 text-foreground/80">
                    {message}
                  </div>
                  <div
                    className="border-t pt-4 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: htmlPreview }}
                  />
                  {attachmentName && (
                    <div className="mt-4 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                      <Paperclip className="w-3 h-3" />
                      Pièce jointe : <span className="font-medium">{attachmentName}</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={sending || allRecipients.length === 0}>
            <Send className="w-4 h-4 mr-2" />
            {sending ? "Envoi..." : "Envoyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareByEmailDialog;
