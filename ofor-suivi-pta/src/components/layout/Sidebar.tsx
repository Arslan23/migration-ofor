import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  ClipboardCheck,
  BarChart3,
  Settings,
  MapPin,
  Users,
  FileText,
  ChevronDown,
  LogOut,
  Ruler,
  Building2,
  Award,
  Target,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoOfor from "@/assets/logo_OFOR.png";
import { useState } from "react";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  hasSubmenu?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

const NavItem = ({ to, icon, label, isActive, hasSubmenu, isOpen, onToggle }: NavItemProps) => {
  if (hasSubmenu) {
    return (
      <button
        onClick={onToggle}
        className={cn(
          "nav-item w-full justify-between",
          isActive && "nav-item-active"
        )}
      >
        <span className="flex items-center gap-3">
          {icon}
          <span className="font-medium">{label}</span>
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
    );
  }

  return (
    <Link
      to={to}
      className={cn(
        "nav-item",
        isActive && "nav-item-active"
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const [referentielOpen, setReferentielOpen] = useState(false);

  const mainNavItems = [
    { to: "/", icon: <LayoutDashboard className="w-5 h-5" />, label: "Tableau de bord & Reporting" },
    { to: "/projets", icon: <FolderKanban className="w-5 h-5" />, label: "Projets" },
    { to: "/planification", icon: <Calendar className="w-5 h-5" />, label: "Planification PTA" },
    { to: "/suivi", icon: <ClipboardCheck className="w-5 h-5" />, label: "Suivi des réalisations" },
    { to: "/contrat-performance", icon: <Award className="w-5 h-5" />, label: "Contrat de Performance" },
    // { to: "/cartographie", icon: <MapPin className="w-5 h-5" />, label: "Cartographie" },
  ];

  const referentielItems = [
    { to: "/referentiel/personnel", icon: <Users className="w-4 h-4" />, label: "Personnel" },
    { to: "/referentiel/entites", icon: <Building2 className="w-4 h-4" />, label: "Entités & Services" },
    { to: "/referentiel/operations", icon: <Workflow className="w-4 h-4" />, label: "Opérations" },
    { to: "/referentiel/unites", icon: <Ruler className="w-4 h-4" />, label: "Unités de mesure" },
    { to: "/referentiel/indicateurs", icon: <Target className="w-4 h-4" />, label: "Indicateurs" },
    { to: "/referentiel/zones", icon: <MapPin className="w-4 h-4" />, label: "Zones d'intervention" },
    { to: "/referentiel/bailleurs", icon: <FileText className="w-4 h-4" />, label: "Bailleurs" },
    { to: "/referentiel/workflows", icon: <Settings className="w-4 h-4" />, label: "Workflows" },
    { to: "/referentiel/cdp", icon: <Award className="w-4 h-4" />, label: "Référentiel CDP" },
  ];

  return (
    <aside className="w-64 h-screen sidebar-gradient flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border flex-shrink-0">
        <Link to="/" className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-2">
            <img src={logoOfor} alt="OFOR" className="h-8 w-auto" />
          </div>
          <div className="text-sidebar-foreground">
            <h1 className="font-heading font-bold text-lg leading-tight">OFOR</h1>
            <p className="text-xs opacity-80">Suivi des Projets</p>
          </div>
        </Link>
      </div>

      {/* Navigation - scrollable si trop long */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-sidebar-accent scrollbar-track-transparent">
        <p className="text-xs uppercase tracking-wider text-sidebar-foreground/50 px-4 mb-3 font-semibold">
          Menu principal
        </p>
        
        {mainNavItems.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            isActive={location.pathname === item.to}
          />
        ))}

        <div className="pt-4">
          <p className="text-xs uppercase tracking-wider text-sidebar-foreground/50 px-4 mb-3 font-semibold">
            Référentiels
          </p>
          
          <NavItem
            to="#"
            icon={<Settings className="w-5 h-5" />}
            label="Référentiels"
            isActive={location.pathname.startsWith("/referentiel")}
            hasSubmenu
            isOpen={referentielOpen}
            onToggle={() => setReferentielOpen(!referentielOpen)}
          />
          
          {referentielOpen && (
            <div className="ml-4 mt-1 space-y-1 animate-fade-in">
              {referentielItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
                    location.pathname === item.to && "bg-sidebar-accent text-sidebar-foreground"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4">
          <NavItem
            to="/administration"
            icon={<Settings className="w-5 h-5" />}
            label="Administration"
            isActive={location.pathname === "/administration"}
          />
        </div>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sidebar-foreground font-semibold">AD</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">Admin OFOR</p>
            <p className="text-xs text-sidebar-foreground/60">Administrateur</p>
          </div>
          <button className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
