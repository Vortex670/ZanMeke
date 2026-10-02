"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_SIDEBAR_SURFACE as SIDEBAR_SURFACE } from "@/components/admin/chrome";
import {
  ADMIN_NAV_ARIA,
  type AdminNavProps,
  adminNavSections,
  normalizeAdminPath,
  type AdminNavBadge,
  type NavItem,
  type NavSection,
  useBadgesByHref,
} from "@/lib/admin/nav";
import { CountChip } from "@/components/admin/kit/CountChip";
import { cn } from "@/lib/utils";

// ============================================================================
// <AdminSidebar> — ISTI markup in ISTI razredi kot second-home (standard §18).
// Razlike med repoma so samo: vir napisov (tu konstante, na SH i18n
// `admin.nav.*` / `admin.groups.*`), vnosi (kar obstaja), barvni tokeni.
// ----------------------------------------------------------------------------
//   Pregled · Statistike
//   Vsebina: Domov, Galerija › Forenzika, Zapisi, Projekti, Ponudba,
//            Fotograf Sevnica, Spletne strani Posavje, Strani
//   Rezervacije
//   Komunikacija: Sporočila, Mnenja, Novičnik, E-poštne predloge › Dnevnik pošte, Pasice
//   Finance: Naročila, Ponudbe, Računi, Popusti, Oglasi
//   Arhiv                                        (samo administrator)
//   Uporabniki: Uporabniki, Zvestoba             (samo administrator)
//   Administracija: Dnevnik, Varnost, Nastavitve (samo administrator)
//
// Videz: širina `w-80`, vse skupine vedno odprte (brez zlaganja), naslov
// skupine `type-eyebrow`, vnos `type-small` / `h-10` z eno ikono, podvnosi
// zamaknjeni z levo črto, aktivni vnos poudarjen, značka števca `type-label`.
// Logotip/ime je v brand bloku AdminTopbar-a (enako širok kot stranska
// vrstica), zato ga tu ne podvajamo.
//
// Desktop: <AdminSidebar> (aside) v AdminShell; mobile: <AdminSidebarNav>
// v <AdminMobileNav>.
// ============================================================================

// ----------------------------------------------------------------------------
// Aktivna pot: točno ujemanje ali podstran (`/admin/foto/nova` → Galerija),
// razen če podstran pripada bolj specifičnemu podvnosu (`/admin/maili/dnevnik`
// → Dnevnik pošte, ne E-poštne predloge). `/admin` je samo točno.
// ----------------------------------------------------------------------------

function pathMatches(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isItemActive(pathname: string, item: NavItem): boolean {
  if (!pathMatches(pathname, item.href)) return false;
  return !(item.children ?? []).some((c) => pathMatches(pathname, c.href));
}

function withBadge(item: NavItem, badge: AdminNavBadge | undefined): NavItem {
  if (!badge || badge.count <= 0) return item;
  return {
    ...item,
    badge: badge.count > 99 ? "99+" : badge.count,
    badgeVariant: badge.variant,
  };
}

// ----------------------------------------------------------------------------
// Skupna površina — uporabljata desktop aside + mobile drawer
// ----------------------------------------------------------------------------

export { ADMIN_SIDEBAR_SURFACE } from "@/components/admin/chrome";

// ----------------------------------------------------------------------------
// <AdminSidebarNav> — vsebina (radialni poudarek + nav); brez ovoja.
// ----------------------------------------------------------------------------

export function AdminSidebarNav({
  isAdmin = true,
  role,
  skupniRacun = false,
  onItemClick,
  ...badgeProps
}: AdminNavProps & { onItemClick?: () => void }) {
  const pathname = normalizeAdminPath(usePathname());
  const badges = useBadgesByHref(badgeProps);

  // Vrstica v meniju, ki pelje na prepovedano stran, je slabša od vrstice,
  // ki je ni: osebje naj ne trka na vrata, ki se mu ne odprejo.
  //
  // Presejati je treba tudi PODREJENE vnose. Dokler se niso, je osebje pod
  // »Jedilnik« videlo »Kategorije« — vnos, ki mu ga straža zavrne.
  const vidi = (it: NavItem) =>
    (!role || !it.roles || it.roles.includes(role)) &&
    // Osebni vnosi odpadejo na skupnem računu blagajne: za njim stoji,
    // kdorkoli je v izmeni, in svoje ure vsaka odpre na svojem telefonu.
    !(it.osebni && skupniRacun);

  const sections = adminNavSections(badgeProps)
    .filter((s) => isAdmin || !s.adminOnly)
    .filter((s) => !role || !s.roles || s.roles.includes(role))
    .map<NavSection>((s) => ({
      ...s,
      items: s.items
        .filter(vidi)
        .map((it) => ({ ...it, children: it.children?.filter(vidi) }))
        // »Moj urnik« je na blagajni napačen napis: za njo ni enega človeka.
        .map((it) =>
          skupniRacun && it.labelSkupni ? { ...it, label: it.labelSkupni } : it,
        )
        .map((it) => withBadge(it, badges[it.href])),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <>
      {/* Subtilen radialni poudarek zgoraj-desno */}
      <div
        aria-hidden
        className="from-accent/6 pointer-events-none absolute top-0 right-0 h-64 w-64 bg-radial from-0% to-transparent to-60% opacity-70"
      />

      <nav className="scrollbar-none relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-(--s2)">
        {sections.map((section, i) => (
          <Section
            key={section.label ?? `plain-${i}`}
            section={section}
            pathname={pathname}
            onItemClick={onItemClick}
          />
        ))}
      </nav>
    </>
  );
}

// ----------------------------------------------------------------------------
// <AdminSidebar> — desktop ovoj (aside, `w-80`, border-r, pt za overlay
// topbar). Apple double-border: border-r + inset top highlight.
// ----------------------------------------------------------------------------

export function AdminSidebar({
  className,
  ...props
}: AdminNavProps & { className?: string }) {
  return (
    <aside
      aria-label={ADMIN_NAV_ARIA}
      className={cn(
        "border-chrome-line hidden h-full w-80 shrink-0 flex-col border-r pt-20 shadow-(--shadow-edge-sidebar) sm:pt-24 lg:flex print:hidden",
        SIDEBAR_SURFACE,
        className,
      )}
      style={
        {
          ["--sidebar-highlight" as string]:
            "color-mix(in oklch, var(--foreground) 4%, transparent)",
        } as React.CSSProperties
      }
    >
      <AdminSidebarNav {...props} />
    </aside>
  );
}

// ----------------------------------------------------------------------------
// <Section> — skupina: naslov (`type-eyebrow`, če obstaja) + vnosi. Vedno
// odprta (brez zlaganja).
// ----------------------------------------------------------------------------

function Section({
  section,
  pathname,
  onItemClick,
}: {
  section: NavSection;
  pathname: string;
  onItemClick?: () => void;
}) {
  return (
    <div className="mt-(--s3) first:mt-0">
      {section.label ? (
        <div className="type-eyebrow text-subtle mb-(--s1) px-3">{section.label}</div>
      ) : null}
      <ul className="space-y-0.5">
        {section.items.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            pathname={pathname}
            onItemClick={onItemClick}
          />
        ))}
      </ul>
    </div>
  );
}

// ----------------------------------------------------------------------------
// <CountBadge> — značka števca (`type-label`)
// ----------------------------------------------------------------------------

function CountBadge({ item }: { item: NavItem }) {
  if (item.badge === undefined) return null;
  return (
    <CountChip
      value={item.badge}
      className={cn(
        item.badgeVariant === "destructive"
          ? "bg-danger text-accent-fg"
          : "bg-accent text-accent-fg",
      )}
    />
  );
}

// ----------------------------------------------------------------------------
// <NavChildList> — zamaknjen seznam podvnosov z levo črto (Forenzika pod
// Galerijo, Dnevnik pošte pod E-poštnimi predlogami). Črta pod ikono starša
// (`ml-5`), podvnos `pl-4` → ikona podvnosa poravnana z napisom starša.
// ----------------------------------------------------------------------------

function NavChildList({
  items,
  pathname,
  onItemClick,
}: {
  items: NavItem[];
  pathname: string;
  onItemClick?: () => void;
}) {
  return (
    <ul className="border-foreground/8 mt-0.5 ml-5 space-y-0.5 border-l">
      {items.map((item) => {
        const ItemIcon = item.icon;
        const isActive = isItemActive(pathname, item);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onItemClick}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "type-small flex h-9 w-full items-center gap-3 rounded-lg pr-3 pl-4 transition-colors",
                isActive
                  ? "bg-foreground/6 text-text font-medium"
                  : "text-muted hover:bg-foreground/4 hover:text-text",
              )}
            >
              <ItemIcon
                className="size-3.5 shrink-0"
                strokeWidth={isActive ? 2 : 1.6}
                aria-hidden
              />
              <span className="flex-1 truncate tracking-tight">{item.label}</span>
              <CountBadge item={item} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// ----------------------------------------------------------------------------
// <SidebarItem> — vnos: ena ikona | napis (`type-small`) | značka
// ----------------------------------------------------------------------------

function SidebarItem({
  item,
  pathname,
  onItemClick,
}: {
  item: NavItem;
  pathname: string;
  onItemClick?: () => void;
}) {
  const Icon = item.icon;
  const isActive = isItemActive(pathname, item);

  return (
    <li>
      <Link
        href={item.href}
        onClick={onItemClick}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "type-small flex h-10 w-full items-center gap-3 rounded-lg px-3 transition-colors",
          isActive
            ? "bg-foreground/6 text-text font-medium"
            : "text-muted hover:bg-foreground/4 hover:text-text",
        )}
      >
        <Icon
          className="size-4 shrink-0"
          strokeWidth={isActive ? 2 : 1.6}
          aria-hidden
        />
        <span className="flex-1 truncate tracking-tight">{item.label}</span>
        <CountBadge item={item} />
      </Link>

      {item.children && item.children.length > 0 ? (
        <NavChildList
          items={item.children}
          pathname={pathname}
          onItemClick={onItemClick}
        />
      ) : null}
    </li>
  );
}
