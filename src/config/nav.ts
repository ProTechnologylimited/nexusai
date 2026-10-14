import {
  LayoutDashboard, Bot, Workflow, Users, Megaphone, Mail, Contact, BarChart3, Plug, CreditCard, Settings, type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/agents", label: "AI Agents", icon: Bot },
  { href: "/automation", label: "Automation", icon: Workflow },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/email", label: "Email", icon: Mail },
  { href: "/crm", label: "CRM", icon: Contact },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];
