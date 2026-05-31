import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  FileText,
  HeadphonesIcon,
  Mail,
  Settings,
  Shield,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  Palette,
  ImageIcon,
  Upload,
} from "lucide-react";

const Administration = () => {
  const { settings, updateOrganization, updateReportHeader, updateTechnicalSupport, updateMailing, updateSystem, updateSecurity, resetSettings } = useSettings();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("organisation");
  
  // États locaux pour l'édition
  const [orgForm, setOrgForm] = useState(settings.organization);
  const [reportForm, setReportForm] = useState(settings.reportHeader);
  const [supportForm, setSupportForm] = useState(settings.technicalSupport);
  const [mailingForm, setMailingForm] = useState(settings.mailing);
  const [systemForm, setSystemForm] = useState(settings.system);
  const [securityForm, setSecurityForm] = useState(settings.security);
  const [newEmail, setNewEmail] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const handleSaveOrganization = () => {
    updateOrganization(orgForm);
    toast({ title: "Paramètres sauvegardés", description: "Les informations de l'organisation ont été mises à jour." });
  };

  const handleSaveReportHeader = () => {
    updateReportHeader(reportForm);
    toast({ title: "Paramètres sauvegardés", description: "Les entêtes de rapport ont été mis à jour." });
  };

  const handleSaveSupport = () => {
    updateTechnicalSupport(supportForm);
    toast({ title: "Paramètres sauvegardés", description: "Les informations de support ont été mises à jour." });
  };

  const handleSaveMailing = () => {
    updateMailing(mailingForm);
    toast({ title: "Paramètres sauvegardés", description: "Les paramètres de messagerie ont été mis à jour." });
  };

  const handleSaveSystem = () => {
    updateSystem(systemForm);
    toast({ title: "Paramètres sauvegardés", description: "Les paramètres système ont été mis à jour." });
  };

  const handleSaveSecurity = () => {
    updateSecurity(securityForm);
    toast({ title: "Paramètres sauvegardés", description: "Les paramètres de sécurité ont été mis à jour." });
  };

  const handleReset = () => {
    resetSettings();
    setOrgForm(settings.organization);
    setReportForm(settings.reportHeader);
    setSupportForm(settings.technicalSupport);
    setMailingForm(settings.mailing);
    setSystemForm(settings.system);
    setSecurityForm(settings.security);
    toast({ title: "Réinitialisation", description: "Tous les paramètres ont été réinitialisés aux valeurs par défaut." });
  };

  const addEmailToGroup = (groupId: string) => {
    if (!newEmail.trim()) return;
    setMailingForm(prev => ({
      ...prev,
      recipientGroups: prev.recipientGroups.map(g =>
        g.id === groupId ? { ...g, emails: [...g.emails, newEmail.trim()] } : g
      ),
    }));
    setNewEmail("");
  };

  const removeEmailFromGroup = (groupId: string, email: string) => {
    setMailingForm(prev => ({
      ...prev,
      recipientGroups: prev.recipientGroups.map(g =>
        g.id === groupId ? { ...g, emails: g.emails.filter(e => e !== email) } : g
      ),
    }));
  };

  const addRecipientGroup = () => {
    const newGroup = {
      id: Date.now().toString(),
      name: "Nouveau groupe",
      emails: [],
      active: true,
    };
    setMailingForm(prev => ({
      ...prev,
      recipientGroups: [...prev.recipientGroups, newGroup],
    }));
  };

  return (
    <DashboardLayout title="Administration" subtitle="Personnalisation et configuration du système">
      <div className="space-y-3 sm:space-y-4">
        {/* Actions */}
        <div className="flex justify-end mb-2 sm:mb-4">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1 p-1 sm:grid sm:grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="organisation" className="text-xs py-1.5 px-2 sm:py-2 flex-1 sm:flex-none">
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Organisation</span>
            </TabsTrigger>
            <TabsTrigger value="rapports" className="text-xs py-1.5 px-2 sm:py-2 flex-1 sm:flex-none">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Rapports</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="text-xs py-1.5 px-2 sm:py-2 flex-1 sm:flex-none">
              <HeadphonesIcon className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
            <TabsTrigger value="mailing" className="text-xs py-1.5 px-2 sm:py-2 flex-1 sm:flex-none">
              <Mail className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Mailing</span>
            </TabsTrigger>
            <TabsTrigger value="systeme" className="text-xs py-1.5 px-2 sm:py-2 flex-1 sm:flex-none">
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Système</span>
            </TabsTrigger>
            <TabsTrigger value="securite" className="text-xs py-1.5 px-2 sm:py-2 flex-1 sm:flex-none">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Sécurité</span>
            </TabsTrigger>
          </TabsList>

          {/* Organisation */}
          <TabsContent value="organisation" className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                <CardTitle className="text-base sm:text-lg">Informations de l'Organisation</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Ces informations apparaîtront sur les rapports et documents exportés</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="org-name" className="text-xs sm:text-sm">Nom complet</Label>
                    <Input
                      id="org-name"
                      value={orgForm.name}
                      onChange={e => setOrgForm(prev => ({ ...prev, name: e.target.value }))}
                      className="h-8 sm:h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="org-acronym" className="text-xs sm:text-sm">Sigle / Acronyme</Label>
                    <Input
                      id="org-acronym"
                      value={orgForm.acronym}
                      onChange={e => setOrgForm(prev => ({ ...prev, acronym: e.target.value }))}
                      className="h-8 sm:h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="org-slogan" className="text-xs sm:text-sm">Slogan / Devise</Label>
                  <Input
                    id="org-slogan"
                    value={orgForm.slogan}
                    onChange={e => setOrgForm(prev => ({ ...prev, slogan: e.target.value }))}
                    className="h-8 sm:h-9 text-sm"
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="org-address" className="text-xs sm:text-sm">Adresse</Label>
                    <Input
                      id="org-address"
                      value={orgForm.address}
                      onChange={e => setOrgForm(prev => ({ ...prev, address: e.target.value }))}
                      className="h-8 sm:h-9 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="org-city" className="text-xs sm:text-sm">Ville</Label>
                      <Input
                        id="org-city"
                        value={orgForm.city}
                        onChange={e => setOrgForm(prev => ({ ...prev, city: e.target.value }))}
                        className="h-8 sm:h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="org-country" className="text-xs sm:text-sm">Pays</Label>
                      <Input
                        id="org-country"
                        value={orgForm.country}
                        onChange={e => setOrgForm(prev => ({ ...prev, country: e.target.value }))}
                        className="h-8 sm:h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="org-phone" className="text-xs sm:text-sm">Téléphone</Label>
                    <Input
                      id="org-phone"
                      value={orgForm.phone}
                      onChange={e => setOrgForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="h-8 sm:h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="org-email" className="text-xs sm:text-sm">Email</Label>
                    <Input
                      id="org-email"
                      type="email"
                      value={orgForm.email}
                      onChange={e => setOrgForm(prev => ({ ...prev, email: e.target.value }))}
                      className="h-8 sm:h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="org-website" className="text-xs sm:text-sm">Site web</Label>
                    <Input
                      id="org-website"
                      value={orgForm.website}
                      onChange={e => setOrgForm(prev => ({ ...prev, website: e.target.value }))}
                      className="h-8 sm:h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveOrganization} size="sm" className="h-8 sm:h-9">
                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    <span className="text-xs sm:text-sm">Enregistrer</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rapports */}
          <TabsContent value="rapports" className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                <CardTitle className="text-base sm:text-lg">Personnalisation des Entêtes</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Configurez l'apparence des bannières et exports PDF/Excel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
                {/* Section Logo */}
                <div className="space-y-2 sm:space-y-3">
                  <h4 className="font-medium text-xs sm:text-sm flex items-center gap-2">
                    <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    Logo de l'organisation
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="logo-url" className="text-xs sm:text-sm">URL du logo (image)</Label>
                      <Input
                        id="logo-url"
                        placeholder="https://example.com/logo.png..."
                        value={reportForm.logoUrl || ""}
                        onChange={e => setReportForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                        className="h-8 sm:h-9 text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Collez une URL d'image ou une image en base64
                      </p>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label className="text-xs sm:text-sm">Aperçu du logo</Label>
                      <div className="w-full h-16 sm:h-20 border rounded-md flex items-center justify-center bg-muted/30">
                        {reportForm.logoUrl ? (
                          <img 
                            src={reportForm.logoUrl} 
                            alt="Logo preview" 
                            className="max-h-12 sm:max-h-16 max-w-24 sm:max-w-32 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">Aucun logo configuré</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="font-medium text-xs sm:text-sm">Configuration de la bannière</h4>
                    
                    {/* Style de bannière */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="banner-style" className="text-xs sm:text-sm">Style de bannière</Label>
                      <Select
                        value={reportForm.bannerStyle || "modern"}
                        onValueChange={value => setReportForm(prev => ({ ...prev, bannerStyle: value as any }))}
                      >
                        <SelectTrigger className="h-8 sm:h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          <SelectItem value="simple">Simple - Minimaliste</SelectItem>
                          <SelectItem value="gradient">Dégradé - Élégant</SelectItem>
                          <SelectItem value="modern">Moderne - Professionnel</SelectItem>
                          <SelectItem value="classic">Classique - Bordures</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-logo">Afficher le logo</Label>
                        <Switch
                          id="show-logo"
                          checked={reportForm.showLogo}
                          onCheckedChange={checked => setReportForm(prev => ({ ...prev, showLogo: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-org-name">Afficher le nom de l'organisation</Label>
                        <Switch
                          id="show-org-name"
                          checked={reportForm.showOrganizationName}
                          onCheckedChange={checked => setReportForm(prev => ({ ...prev, showOrganizationName: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-slogan">Afficher le slogan</Label>
                        <Switch
                          id="show-slogan"
                          checked={reportForm.showSlogan}
                          onCheckedChange={checked => setReportForm(prev => ({ ...prev, showSlogan: checked }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="header-title">Titre par défaut</Label>
                      <Input
                        id="header-title"
                        value={reportForm.headerTitle}
                        onChange={e => setReportForm(prev => ({ ...prev, headerTitle: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="header-subtitle">Sous-titre</Label>
                      <Input
                        id="header-subtitle"
                        value={reportForm.headerSubtitle}
                        onChange={e => setReportForm(prev => ({ ...prev, headerSubtitle: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Couleurs et pied de page</h4>
                    
                    {/* Couleurs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="header-color">Couleur principale</Label>
                        <div className="flex gap-2">
                          <Input
                            id="header-color"
                            type="color"
                            value={reportForm.headerColor}
                            onChange={e => setReportForm(prev => ({ ...prev, headerColor: e.target.value }))}
                            className="w-12 h-9 p-1"
                          />
                          <Input
                            value={reportForm.headerColor}
                            onChange={e => setReportForm(prev => ({ ...prev, headerColor: e.target.value }))}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="header-secondary-color">Couleur secondaire</Label>
                        <div className="flex gap-2">
                          <Input
                            id="header-secondary-color"
                            type="color"
                            value={reportForm.headerSecondaryColor || reportForm.headerColor}
                            onChange={e => setReportForm(prev => ({ ...prev, headerSecondaryColor: e.target.value }))}
                            className="w-12 h-9 p-1"
                          />
                          <Input
                            value={reportForm.headerSecondaryColor || reportForm.headerColor}
                            onChange={e => setReportForm(prev => ({ ...prev, headerSecondaryColor: e.target.value }))}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="space-y-2">
                      <Label htmlFor="footer-left">Texte gauche pied de page</Label>
                      <Input
                        id="footer-left"
                        value={reportForm.footerLeftText}
                        onChange={e => setReportForm(prev => ({ ...prev, footerLeftText: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footer-right">Texte droit pied de page</Label>
                      <Input
                        id="footer-right"
                        value={reportForm.footerRightText}
                        onChange={e => setReportForm(prev => ({ ...prev, footerRightText: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-page-numbers">Numéros de page</Label>
                      <Switch
                        id="show-page-numbers"
                        checked={reportForm.showPageNumbers}
                        onCheckedChange={checked => setReportForm(prev => ({ ...prev, showPageNumbers: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-gen-date">Date de génération</Label>
                      <Switch
                        id="show-gen-date"
                        checked={reportForm.showGenerationDate}
                        onCheckedChange={checked => setReportForm(prev => ({ ...prev, showGenerationDate: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confidentiality">Mention de confidentialité</Label>
                      <Textarea
                        id="confidentiality"
                        value={reportForm.confidentialityNotice}
                        onChange={e => setReportForm(prev => ({ ...prev, confidentialityNotice: e.target.value }))}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Aperçu de la bannière */}
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Aperçu de la bannière
                  </h4>
                  <div 
                    className="rounded-md overflow-hidden border"
                    style={{
                      background: reportForm.bannerStyle === 'classic' 
                        ? '#fff' 
                        : reportForm.bannerStyle === 'gradient'
                          ? `linear-gradient(135deg, ${reportForm.headerColor} 0%, ${reportForm.headerSecondaryColor || reportForm.headerColor} 100%)`
                          : `linear-gradient(90deg, ${reportForm.headerColor} 0%, ${reportForm.headerColor}ee 100%)`,
                      borderColor: reportForm.bannerStyle === 'classic' ? reportForm.headerColor : 'transparent',
                      borderWidth: reportForm.bannerStyle === 'classic' ? '3px' : '0',
                      borderTopWidth: reportForm.bannerStyle === 'classic' ? '6px' : '0',
                    }}
                  >
                    <div className="flex items-center gap-4 p-4">
                      {reportForm.showLogo && (
                        <div className="flex-shrink-0">
                          {reportForm.logoUrl ? (
                            <img 
                              src={reportForm.logoUrl} 
                              alt="Logo" 
                              className="h-12 w-auto max-w-24 object-contain"
                            />
                          ) : (
                            <div 
                              className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg"
                              style={{
                                background: reportForm.bannerStyle === 'classic' ? reportForm.headerColor : 'rgba(255,255,255,0.95)',
                                color: reportForm.bannerStyle === 'classic' ? 'white' : reportForm.headerColor,
                              }}
                            >
                              {settings.organization.acronym.substring(0, 3)}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {reportForm.showOrganizationName && (
                          <p 
                            className="text-xs uppercase tracking-wide"
                            style={{ color: reportForm.bannerStyle === 'classic' ? reportForm.headerColor : 'rgba(255,255,255,0.9)' }}
                          >
                            {settings.organization.name}
                          </p>
                        )}
                        <h3 
                          className="text-lg font-bold"
                          style={{ color: reportForm.bannerStyle === 'classic' ? reportForm.headerColor : 'white' }}
                        >
                          {reportForm.headerTitle || "Titre du rapport"}
                        </h3>
                        {reportForm.showSlogan && settings.organization.slogan && (
                          <p 
                            className="text-xs italic"
                            style={{ color: reportForm.bannerStyle === 'classic' ? '#666' : 'rgba(255,255,255,0.8)' }}
                          >
                            {settings.organization.slogan}
                          </p>
                        )}
                      </div>
                      {reportForm.showGenerationDate && (
                        <div 
                          className="text-right text-xs border-l pl-3"
                          style={{ 
                            color: reportForm.bannerStyle === 'classic' ? '#666' : 'rgba(255,255,255,0.9)',
                            borderColor: reportForm.bannerStyle === 'classic' ? '#ddd' : 'rgba(255,255,255,0.3)'
                          }}
                        >
                          {new Date().toLocaleDateString("fr-FR")}
                        </div>
                      )}
                    </div>
                    {reportForm.bannerStyle === 'modern' && (
                      <div 
                        className="h-1" 
                        style={{ background: `linear-gradient(90deg, ${reportForm.headerSecondaryColor || reportForm.headerColor} 0%, ${reportForm.headerColor}80 100%)` }}
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveReportHeader}>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support technique */}
          <TabsContent value="support" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Contact Support Technique</CardTitle>
                <CardDescription>Informations affichées pour l'assistance aux utilisateurs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="support-name">Nom du contact</Label>
                    <Input
                      id="support-name"
                      value={supportForm.contactName}
                      onChange={e => setSupportForm(prev => ({ ...prev, contactName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-email">Email</Label>
                    <Input
                      id="support-email"
                      type="email"
                      value={supportForm.contactEmail}
                      onChange={e => setSupportForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="support-phone">Téléphone</Label>
                    <Input
                      id="support-phone"
                      value={supportForm.contactPhone}
                      onChange={e => setSupportForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency-phone">Téléphone urgences</Label>
                    <Input
                      id="emergency-phone"
                      value={supportForm.emergencyPhone}
                      onChange={e => setSupportForm(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-hours">Horaires de support</Label>
                  <Input
                    id="support-hours"
                    value={supportForm.supportHours}
                    onChange={e => setSupportForm(prev => ({ ...prev, supportHours: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticket-url">URL système de tickets</Label>
                    <Input
                      id="ticket-url"
                      value={supportForm.ticketUrl}
                      placeholder="https://support.example.com"
                      onChange={e => setSupportForm(prev => ({ ...prev, ticketUrl: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc-url">URL documentation</Label>
                    <Input
                      id="doc-url"
                      value={supportForm.documentationUrl}
                      placeholder="https://docs.example.com"
                      onChange={e => setSupportForm(prev => ({ ...prev, documentationUrl: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveSupport}>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mailing */}
          <TabsContent value="mailing" className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Configuration SMTP
                    <Badge variant={mailingForm.enabled ? "default" : "secondary"}>
                      {mailingForm.enabled ? "Actif" : "Inactif"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>Paramètres du serveur de messagerie</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mailing-enabled">Activer l'envoi d'emails</Label>
                    <Switch
                      id="mailing-enabled"
                      checked={mailingForm.enabled}
                      onCheckedChange={checked => setMailingForm(prev => ({ ...prev, enabled: checked }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">Serveur SMTP</Label>
                      <Input
                        id="smtp-host"
                        value={mailingForm.smtpHost}
                        placeholder="smtp.example.com"
                        onChange={e => setMailingForm(prev => ({ ...prev, smtpHost: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">Port</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        value={mailingForm.smtpPort}
                        onChange={e => setMailingForm(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-user">Utilisateur</Label>
                      <Input
                        id="smtp-user"
                        value={mailingForm.smtpUser}
                        onChange={e => setMailingForm(prev => ({ ...prev, smtpUser: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-pass">Mot de passe</Label>
                      <Input
                        id="smtp-pass"
                        type="password"
                        value={mailingForm.smtpPassword}
                        onChange={e => setMailingForm(prev => ({ ...prev, smtpPassword: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="sender-name">Nom de l'expéditeur</Label>
                    <Input
                      id="sender-name"
                      value={mailingForm.senderName}
                      onChange={e => setMailingForm(prev => ({ ...prev, senderName: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="sender-email">Email expéditeur</Label>
                      <Input
                        id="sender-email"
                        type="email"
                        value={mailingForm.senderEmail}
                        onChange={e => setMailingForm(prev => ({ ...prev, senderEmail: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reply-email">Email de réponse</Label>
                      <Input
                        id="reply-email"
                        type="email"
                        value={mailingForm.replyToEmail}
                        onChange={e => setMailingForm(prev => ({ ...prev, replyToEmail: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Types de Notifications</CardTitle>
                  <CardDescription>Notifications automatiques à envoyer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Nouveau projet créé</Label>
                    <Switch
                      checked={mailingForm.notifications.newProject}
                      onCheckedChange={checked => setMailingForm(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, newProject: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Échéance d'activité (3 jours avant)</Label>
                    <Switch
                      checked={mailingForm.notifications.activityDeadline}
                      onCheckedChange={checked => setMailingForm(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, activityDeadline: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Rappel évaluation CDP</Label>
                    <Switch
                      checked={mailingForm.notifications.cdpReminder}
                      onCheckedChange={checked => setMailingForm(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, cdpReminder: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Digest hebdomadaire</Label>
                    <Switch
                      checked={mailingForm.notifications.weeklyDigest}
                      onCheckedChange={checked => setMailingForm(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, weeklyDigest: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Rapport mensuel automatique</Label>
                    <Switch
                      checked={mailingForm.notifications.monthlyReport}
                      onCheckedChange={checked => setMailingForm(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, monthlyReport: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Alerte dépassement budget</Label>
                    <Switch
                      checked={mailingForm.notifications.budgetAlert}
                      onCheckedChange={checked => setMailingForm(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, budgetAlert: checked }
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Groupes de Destinataires</CardTitle>
                    <CardDescription>Gérez les listes de diffusion pour les notifications</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={addRecipientGroup}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un groupe
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mailingForm.recipientGroups.map(group => (
                    <div key={group.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Input
                            value={group.name}
                            className="w-48 h-8"
                            onChange={e => setMailingForm(prev => ({
                              ...prev,
                              recipientGroups: prev.recipientGroups.map(g =>
                                g.id === group.id ? { ...g, name: e.target.value } : g
                              )
                            }))}
                          />
                          <Switch
                            checked={group.active}
                            onCheckedChange={checked => setMailingForm(prev => ({
                              ...prev,
                              recipientGroups: prev.recipientGroups.map(g =>
                                g.id === group.id ? { ...g, active: checked } : g
                              )
                            }))}
                          />
                          <span className="text-xs text-muted-foreground">
                            {group.active ? "Actif" : "Inactif"}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setMailingForm(prev => ({
                            ...prev,
                            recipientGroups: prev.recipientGroups.filter(g => g.id !== group.id)
                          }))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {group.emails.map(email => (
                          <Badge key={email} variant="secondary" className="text-xs">
                            {email}
                            <button
                              className="ml-1 hover:text-destructive"
                              onClick={() => removeEmailFromGroup(group.id, email)}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="Ajouter un email..."
                          className="h-8 flex-1"
                          value={selectedGroupId === group.id ? newEmail : ""}
                          onFocus={() => setSelectedGroupId(group.id)}
                          onChange={e => setNewEmail(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addEmailToGroup(group.id)}
                        />
                        <Button size="sm" variant="outline" onClick={() => addEmailToGroup(group.id)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSaveMailing}>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Système */}
          <TabsContent value="systeme" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Préférences Régionales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Langue par défaut</Label>
                    <Select
                      value={systemForm.defaultLanguage}
                      onValueChange={value => setSystemForm(prev => ({ ...prev, defaultLanguage: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuseau horaire</Label>
                    <Select
                      value={systemForm.timezone}
                      onValueChange={value => setSystemForm(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Dakar">Africa/Dakar (UTC+0)</SelectItem>
                        <SelectItem value="Africa/Lagos">Africa/Lagos (UTC+1)</SelectItem>
                        <SelectItem value="Europe/Paris">Europe/Paris (UTC+1/+2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Format de date</Label>
                    <Select
                      value={systemForm.dateFormat}
                      onValueChange={value => setSystemForm(prev => ({ ...prev, dateFormat: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd/MM/yyyy">JJ/MM/AAAA</SelectItem>
                        <SelectItem value="MM/dd/yyyy">MM/JJ/AAAA</SelectItem>
                        <SelectItem value="yyyy-MM-dd">AAAA-MM-JJ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Symbole monétaire</Label>
                    <Input
                      id="currency"
                      value={systemForm.currencySymbol}
                      onChange={e => setSystemForm(prev => ({ ...prev, currencySymbol: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Paramètres Techniques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fiscal-year">Début de l'année fiscale</Label>
                    <Select
                      value={String(systemForm.fiscalYearStart)}
                      onValueChange={value => setSystemForm(prev => ({ ...prev, fiscalYearStart: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map((month, idx) => (
                          <SelectItem key={idx} value={String(idx + 1)}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Timeout session (minutes)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={systemForm.sessionTimeout}
                      onChange={e => setSystemForm(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-upload">Taille max. upload (MB)</Label>
                    <Input
                      id="max-upload"
                      type="number"
                      value={systemForm.maxUploadSize}
                      onChange={e => setSystemForm(prev => ({ ...prev, maxUploadSize: parseInt(e.target.value) }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenance">Mode maintenance</Label>
                      <p className="text-xs text-muted-foreground">Désactive l'accès pour les utilisateurs</p>
                    </div>
                    <Switch
                      id="maintenance"
                      checked={systemForm.maintenanceMode}
                      onCheckedChange={checked => setSystemForm(prev => ({ ...prev, maintenanceMode: checked }))}
                    />
                  </div>
                  {systemForm.maintenanceMode && (
                    <Textarea
                      placeholder="Message de maintenance..."
                      value={systemForm.maintenanceMessage}
                      onChange={e => setSystemForm(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                      rows={2}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveSystem}>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </TabsContent>

          {/* Sécurité */}
          <TabsContent value="securite" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Politique de Mot de Passe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pwd-length">Longueur minimale</Label>
                    <Input
                      id="pwd-length"
                      type="number"
                      min={6}
                      max={32}
                      value={securityForm.passwordMinLength}
                      onChange={e => setSecurityForm(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Majuscule requise</Label>
                    <Switch
                      checked={securityForm.passwordRequireUppercase}
                      onCheckedChange={checked => setSecurityForm(prev => ({ ...prev, passwordRequireUppercase: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Chiffre requis</Label>
                    <Switch
                      checked={securityForm.passwordRequireNumbers}
                      onCheckedChange={checked => setSecurityForm(prev => ({ ...prev, passwordRequireNumbers: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Caractère spécial requis</Label>
                    <Switch
                      checked={securityForm.passwordRequireSpecial}
                      onCheckedChange={checked => setSecurityForm(prev => ({ ...prev, passwordRequireSpecial: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Contrôle d'Accès</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-attempts">Tentatives de connexion max.</Label>
                    <Input
                      id="max-attempts"
                      type="number"
                      min={3}
                      max={10}
                      value={securityForm.maxLoginAttempts}
                      onChange={e => setSecurityForm(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lockout">Durée de verrouillage (minutes)</Label>
                    <Input
                      id="lockout"
                      type="number"
                      value={securityForm.lockoutDuration}
                      onChange={e => setSecurityForm(prev => ({ ...prev, lockoutDuration: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session-expiry">Expiration session (heures)</Label>
                    <Input
                      id="session-expiry"
                      type="number"
                      value={securityForm.sessionExpiry}
                      onChange={e => setSecurityForm(prev => ({ ...prev, sessionExpiry: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Authentification 2 facteurs</Label>
                      <p className="text-xs text-muted-foreground">Requiert un code supplémentaire</p>
                    </div>
                    <Switch
                      checked={securityForm.twoFactorEnabled}
                      onCheckedChange={checked => setSecurityForm(prev => ({ ...prev, twoFactorEnabled: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveSecurity}>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Administration;
