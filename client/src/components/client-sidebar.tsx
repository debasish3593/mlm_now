import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Users,
  UserPlus,
  FileText, 
  DollarSign,
  CreditCard,
  Settings, 
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  GitBranch,
  BarChart3,
  TrendingUp,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/hooks/use-auth";
import logoPath from "@assets/logo_1755178929997.png";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  subItems?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <Home className="h-5 w-5" />,
    href: "/client"
  },
  {
    id: "plans",
    label: "Plans",
    icon: <BarChart3 className="h-5 w-5" />,
    href: "/client/plans"
  },
  {
    id: "add-client",
    label: "Add New Client",
    icon: <UserPlus className="h-5 w-5" />,
    href: "/client/add-client"
  },
  {
    id: "manage-clients",
    label: "Manage Clients",
    icon: <Users className="h-5 w-5" />,
    subItems: [
      { id: "all-clients", label: "All Users", icon: <Users className="h-4 w-4" />, href: "/client/users" },
      { id: "binary-tree", label: "Binary Tree", icon: <GitBranch className="h-4 w-4" />, href: "/client/binary-tree" }
    ]
  },
  {
    id: "reports",
    label: "Reports",
    icon: <FileText className="h-5 w-5" />,
    href: "/client/reports"
  },
  {
    id: "earnings",
    label: "Earnings",
    icon: <TrendingUp className="h-5 w-5" />,
    href: "/client/earnings"
  },
  {
    id: "withdrawals",
    label: "Withdrawals",
    icon: <CreditCard className="h-5 w-5" />,
    href: "/client/withdrawals"
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="h-5 w-5" />,
    href: "/client/settings"
  }
];

export function ClientSidebar() {
  const [location] = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuthStore();

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    // Exact match for dashboard to prevent other routes from highlighting it
    if (href === "/client") {
      return location === "/client";
    }
    return location === href || location.startsWith(href + "/");
  };

  const renderMenuItem = (item: MenuItem, isSubItem = false) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const active = isActive(item.href);

    if (hasSubItems) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleExpanded(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-violet-600 text-white shadow-lg"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            } ${isSubItem ? "pl-6" : ""}`}
          >
            <div className="flex items-center">
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.subItems?.map((subItem) => renderMenuItem(subItem, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link key={item.id} href={item.href || "#"}>
        <button
          className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            active
              ? "bg-violet-600 text-white shadow-lg"
              : "text-slate-300 hover:bg-slate-700 hover:text-white"
          } ${isSubItem ? "pl-6" : ""}`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {item.icon}
          <span className="ml-3">{item.label}</span>
        </button>
      </Link>
    );
  };

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 z-40 h-full w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      } md:static md:block`}>
        <div className="flex flex-col h-full">
          {/* Logo section */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800">
            <div className="flex items-center">
              <img src={logoPath} alt="MLM Logo" className="h-8 w-8 mr-3" />
              <div>
                <h2 className="text-lg font-semibold text-white">Client Panel</h2>
                <p className="text-xs text-slate-400">MLM System</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Navigation items */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => renderMenuItem(item))}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-slate-800">
            <Button
              variant="outline"
              className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}