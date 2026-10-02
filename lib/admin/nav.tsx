"use client";

import {
  BarChart3,
  Briefcase,
  Home,
  Images,
  Mail,
  LayoutDashboard,
  LayoutTemplate,
  MessageSquare,
  Quote,
  Receipt,
  Tags,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import type { ComponentType } from "react";

// ============================================================================
// lib/admin/nav.tsx — stranska vrstica admina: skupine, vnosi, ikone, napisi.
// ----------------------------------------------------------------------------
// To je NASTAVITEV STRANI, ne komponenta. `AdminSidebar` in `AdminMobileNav`
// sta na vseh projektih isti datoteki in samo izrišeta, kar dobita tu.
// zanmeke.com prinese svoje poti in napise — in ima ves preostali admin brez
// spreminjanja ene same komponente. Enako velja za gostilnica-plus.si in
// second-home.hr.
//
// Vlog tu ni, ker je uporabnik eden. Podpis funkcij je kljub temu enak kot na
// drugih dveh straneh, da komponenta ostane nespremenjena — ko bo nekoč
// računovodkinja imela svoj dostop, se vloge dodajo TU in nikjer drugje.
// ============================================================================

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

type BadgeVariant = "accent" | "destructive";

/** Na zanmeke.com je uporabnik en sam; tip ostane zaradi skupnega podpisa. */
type UporabnikovaVloga = "ADMIN";

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
  roles?: UporabnikovaVloga[];
  badge?: string | number;
  badgeVariant?: BadgeVariant;
  children?: NavItem[];
  muted?: boolean;
  osebni?: boolean;
  labelSkupni?: string;
};

type NavSection = {
  label?: string;
  items: NavItem[];
  adminOnly?: boolean;
  roles?: UporabnikovaVloga[];
};

export type AdminSidebarBadges = {
  /** Povpraševanja, na katera še ni odgovora. */
  sporocila?: number;
};

function buildSections(): NavSection[] {
  return [
    {
      items: [
        { href: "/admin", label: "Pregled", icon: LayoutDashboard },
        { href: "/admin/statistike", label: "Statistike", icon: BarChart3 },
      ],
    },
    {
      label: "Stranke",
      items: [
        { href: "/admin/sporocila", label: "Sporočila", icon: MessageSquare },
        { href: "/admin/posta", label: "Pošta", icon: Mail },
        { href: "/admin/priporocila", label: "Priporočila", icon: Quote },
      ],
    },
    {
      label: "Vsebina",
      items: [
        // Štiri javne strani, vsaka s svojimi odseki. Isti urejevalnik,
        // drug register — zato tu štiri vrstice in ne štiri strani kode.
        { href: "/admin/vsebina/domov", label: "Domov", icon: Home },
        { href: "/admin/vsebina/ponudba", label: "Ponudba", icon: Tags },
        { href: "/admin/vsebina/dela", label: "Dela", icon: Briefcase },
        { href: "/admin/vsebina/kontakt", label: "Kontakt", icon: Mail },
        { href: "/admin/strani", label: "Pravna besedila", icon: LayoutTemplate },
        { href: "/admin/mediji", label: "Mediji", icon: Images },
      ],
    },
    {
      label: "Finance",
      items: [{ href: "/admin/racuni", label: "Računi", icon: Receipt }],
    },
    {
      label: "Nastavitve",
      items: [
        { href: "/admin/racun", label: "Račun", icon: User, osebni: true },
        { href: "/admin/varnost", label: "Varnost", icon: ShieldCheck, osebni: true },
        { href: "/admin/nastavitve", label: "Sistem", icon: Settings },
      ],
    },
  ];
}

export const ADMIN_NAV_ARIA = "Navigacija administracije";

export type AdminNavProps = {
  isAdmin?: boolean;
  skupniRacun?: boolean;
  role?: UporabnikovaVloga;
  badges?: AdminSidebarBadges;
};

export type AdminNavBadge = { count: number; variant: BadgeVariant };

export function useBadgesByHref({
  badges,
}: AdminNavProps): Record<string, AdminNavBadge | undefined> {
  return {
    "/admin/sporocila": { count: badges?.sporocila ?? 0, variant: "accent" },
  };
}

/**
 * Pot brez jezikovne predpone.
 *
 * zanmeke.com je enojezičen, zato tu ni česa odstraniti — funkcija ostane,
 * ker je `AdminSidebar` ista datoteka na vseh treh straneh in jo kliče.
 */
export function normalizeAdminPath(pathname: string): string {
  return pathname || "/";
}

export function adminNavSections(_props: AdminNavProps = {}): NavSection[] {
  void _props;
  return buildSections();
}

export type { NavItem, NavSection, IconType, BadgeVariant };
