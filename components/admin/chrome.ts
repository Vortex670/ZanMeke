/**
 * Skupne klase admin chrome-a (port zanmeke.com `IconButton variant="pill"`).
 *
 * Uporabljajo jih: hamburger (AdminMobileNav), ThemeToggle + LocaleSwitcher
 * (`variant="pill"`), NotificationBell in AdminUserMenu — tako so vsi
 * gumbi v topbar-u enako visoki (48 px) in enako "frosted".
 *
 * Barve gredo skozi SH tokene: `bg-surface/70` + `ring-border/60` +
 * `shadow-(--shadow-glass)`; hover dvigne na polni `bg-surface`.
 */
export const CHROME_PILL =
  "inline-flex shrink-0 items-center justify-center rounded-full " +
  "bg-surface/70 text-text/80 ring-1 ring-border/60 shadow-(--shadow-glass) backdrop-blur-sm " +
  "transition-all duration-200 hover:bg-surface hover:text-text hover:ring-border-strong/80 " +
  "active:scale-[0.96] " +
  "focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2";

/** 48 px ikonski pill (zanmeke IconButton size="lg"). */
export const CHROME_PILL_ICON = "size-12 [&_svg]:size-[18px]";

/**
 * Desni slot v glavi sekcije (`AdminSection` / `SectionHeader` /
 * `SectionCard`). Majhne stvari (značka s številom) ostanejo ob naslovu
 * tudi na telefonu; šele če slot vsebuje gumbe/povezave (širše akcije),
 * gre na telefonu v svojo vrstico pod naslov (`pl-14` = poravnava z
 * besedilom za ikono).
 */
/**
 * Predal za dejanja v glavi odseka.
 *
 * Na telefonu gumbi padejo v SVOJO vrstico pod naslov (`basis-full`) —
 * sicer stisnejo naslov v stolpec po eno besedo.
 *
 * Vrstica teče čez VSO širino kartice. Prej je imela `pl-14`, da bi se
 * začela pod naslovom in ne pod ikono; izmerjeno pri 375 px je to
 * pomenilo 77 px odmika levo proti 21 desno — gumbi so viseli v stolpcu
 * naslova, medtem ko se je koš držal roba kartice. Poravnava pod
 * besedilom naslova je poravnava proti nevidni črti; poravnava proti
 * robu kartice je poravnava proti tisti, ki jo oko vidi.
 */
export const HEADER_ACTION_SLOT =
  "ml-auto shrink-0 max-sm:has-[button]:ml-0 max-sm:has-[button]:basis-full max-sm:has-[a]:ml-0 max-sm:has-[a]:basis-full";

/** Gradient surface sidebar-ja — deli ga desktop aside + mobile drawer. */
export const ADMIN_SIDEBAR_SURFACE =
  "from-bg via-bg to-bg/95 relative overflow-hidden bg-linear-to-b";
