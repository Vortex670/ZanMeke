"use client";

/**
 * RichTextEditor — TipTap-based WYSIWYG za admin vsebinska polja.
 *
 * Design filozofija (v2 — "nov lepši"):
 *   - **Sticky toolbar** znotraj scrollable editorja — vedno dostopen,
 *     ne zlomi page layout.
 *   - **Icon-only gumbi** z tooltip-om + keyboard shortcut hint-om.
 *     Cleaner kot text buttons, a11y-friendly (aria-label).
 *   - **Active state** je accent barva + subtle background, ne border.
 *   - **Brez bloat-a** — samo H2/H3/bold/italic/list/link/quote. Ni
 *     H1 (to je page title, ne editor content), ni barv, ni fontov.
 *     Jasna pravila za content authors.
 *   - **Character count** v footer-u, subtle.
 *   - **Tailwind v4 OKLCH tokens** — vse barve preko CSS spremenljivk
 *     (bg-surface, text-text, border-border, accent).
 *
 * Storage format: HTML string.
 *   - Enostavnejše SSR-anje kot TipTap JSON.
 *   - Brez dodatnih deps za render (server-side DOMPurify sanitize).
 *   - Migration: obstoječe plain-text vrednosti se avtomatsko wrap-ajo v `<p>…</p>`
 *     ob prvi editor load-u (TipTap HTML parse → serialize).
 *
 * A11y:
 *   - Toolbar gumbi imajo aria-label + aria-pressed za active state.
 *   - Editor contentEditable ima aria-label (iz `ariaLabel` prop-a).
 *   - Keyboard shortcuts delujejo native (TipTap `StarterKit`):
 *       ⌘+B = bold, ⌘+I = italic, ⌘+⇧+8 = bullet list, ⌘+Z = undo ipd.
 */

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { cn, formatCount } from "@/lib/utils";
import { IconButton } from "@/components/ui/IconButton";
import { uploadImageAction } from "@/lib/media/actions";

type RichTextEditorProps = {
  /** HTML vsebina (controlled). */
  value: string;
  /** Callback na vsako spremembo — prejme sanitiziran HTML. */
  onChange: (html: string) => void;
  /** Placeholder, ko je editor prazen. */
  placeholder?: string;
  /** ARIA label za contentEditable območje. */
  ariaLabel?: string;
  /** Max dolžina znakov — mehki limit, prikazan v footer-ju. */
  maxLength?: number;
  /** Disable celoten editor (read-only). */
  disabled?: boolean;
  /** Min višina editor-ja v rem (default 12 = 192px). */
  minHeightRem?: number;
  /**
   * `inline` — brez okvirja in ozadja, orodna vrstica se pokaže šele ob
   * fokusu (WordPress-like urejanje "na platnu"). Privzeto `default`.
   */
  appearance?: "default" | "inline";
  /** Dodatne klase na vsebini (npr. serif/italic za citat). */
  contentClassName?: string;
};

/**
 * Prompt za link — v osnovi prompt(); kasneje lahko zamenjamo z Dialog-om.
 * Vrne URL ali null (cancel).
 */
function promptForLink(initialHref: string | undefined): string | null {
  if (typeof window === "undefined") return null;
  const input = window.prompt("Vnesite URL povezave:", initialHref ?? "https://");
  if (input === null) return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return ""; // empty → remove link
  // Safety: ne dovoli javascript: URL-jev.
  if (/^javascript:/i.test(trimmed)) return null;
  return trimmed;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  ariaLabel,
  maxLength,
  disabled = false,
  minHeightRem = 12,
  appearance = "default",
  contentClassName,
}: RichTextEditorProps) {
  const inline = appearance === "inline";
  const extensions = useMemo(
    () => [
      // StarterKit: paragraph, heading, bold, italic, strike, bulletList,
      // orderedList, listItem, blockquote, horizontalRule, history, hardBreak.
      // Onemogočamo H1 (rezervirano za page title izven editorja).
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // Tiptap 3: StarterKit že vsebuje Link — izklopimo ga, ker ga spodaj
        // nastavimo s svojimi atributi (rel/target/class).
        link: false,
        // HorizontalRule ostaja omogočen (za ločila med sekcijami) — markdown
        // input rule `---` na novi vrstici ga dodaja avtomatsko.
        codeBlock: false,
        code: false,
      }),
      // Slika v besedilu. Brez nje je bila novica stolpec besedila in
      // vsaka fotografija je morala na vrh kot naslovna — kar pomeni ENA
      // fotografija na novico, pa naj jih je bilo z dogodka petnajst.
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: "rounded-xl" },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
          class: "text-accent underline underline-offset-2",
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Napišite vsebino …",
        emptyEditorClass:
          "before:text-subtle before:float-left before:pointer-events-none before:h-0 before:content-[attr(data-placeholder)]",
      }),
      ...(maxLength
        ? [CharacterCount.configure({ limit: Math.floor(maxLength * 1.1) })]
        : [CharacterCount]),
    ],
    [placeholder, maxLength],
  );

  const editor = useEditor({
    extensions,
    content: value,
    editable: !disabled,
    // Next.js SSR pitfall: TipTap brez `immediatelyRender: false` klice
    // window med hydration → hydration mismatch. Official workaround.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": ariaLabel ?? "Urejevalnik vsebine",
        class: cn(
          "prose-admin",
          "min-h-[var(--rte-min-h)] outline-none",
          "[&_*]:outline-none",
          contentClassName,
        ),
        style: `--rte-min-h: ${minHeightRem}rem`,
      },
      // Smart paste: če admin paste-a "plain" tekst iz e-pošte/dokumenta
      // (z črticami, **krepkim**, kratkim naslovom pred seznamom), ga
      // prepoznamo in pretvorimo v pravo HTML strukturo — tako editor takoj
      // izgleda kot javna stran, brez ročnega klikanja po toolbaru.
      handlePaste: (view, event) => {
        const clipboard = event.clipboardData;
        if (!clipboard) return false;

        // Ne vmešavamo se, če clipboard že vsebuje HTML (npr. iz Word/Google
        // Docs/našega predogleda) — TipTap to pravilno parsea sam.
        const html = clipboard.getData("text/html");
        if (html && html.trim().length > 0) return false;

        const text = clipboard.getData("text/plain");
        if (!text || text.trim().length === 0) return false;

        // Če je samo ena vrstica brez markdown-značilnosti, pusti TipTap-u.
        if (!/\n|^\s*[*\-•]\s|\*\*/.test(text)) return false;

        const converted = plainTextToHtml(text);
        if (!converted) return false;

        // Insert as HTML → TipTap parsea naslove/sezname/bold.
        editor?.chain().focus().insertContent(converted).run();
        event.preventDefault();
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // TipTap vrne "<p></p>" za prazen editor — mapiraj na prazen string,
      // tako da dirty tracking / validacija prazen vnos zazna pravilno.
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Sync zunanjega value → editor (za npr. "Prevedi" button ki nastavi novo vsebino).
  // Pazimo: če je editor samostojno sprožil onChange, `value` se ujema z editor-jevim
  // getHTML(), zato setContent() preskočimo.
  const lastSyncedValueRef = useRef<string>(value);
  useEffect(() => {
    if (!editor) return;
    if (value === lastSyncedValueRef.current) return;
    const current = editor.getHTML();
    const normalizedCurrent = current === "<p></p>" ? "" : current;
    if (value === normalizedCurrent) {
      lastSyncedValueRef.current = value;
      return;
    }
    // Tiptap 3: setContent(content, { emitUpdate }).
    // `emitUpdate: false` prepreči onUpdate callback, ki bi drugače zagnal loop.
    editor.commands.setContent(value || "", { emitUpdate: false });
    lastSyncedValueRef.current = value;
  }, [editor, value]);

  // Nalaganje fotografije v besedilo.
  const vhodSlike = useRef<HTMLInputElement>(null);
  const [nalagam, setNalagam] = useState(false);

  // Character count display
  const [charCount, setCharCount] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const update = () => {
      const storage = editor.storage.characterCount as
        | { characters: () => number }
        | undefined;
      setCharCount(storage?.characters() ?? 0);
    };
    update();
    editor.on("update", update);
    return () => {
      editor.off("update", update);
    };
  }, [editor]);

  if (!editor) {
    // SSR + hydration: pokaže skeleton do mount-a.
    return (
      <div
        className={cn(
          "animate-pulse rounded-lg",
          inline ? "bg-surface-2/40" : "border-border bg-surface border",
        )}
        style={{ minHeight: `${minHeightRem + 3}rem` }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn(
        "group/rte transition-colors duration-(--dur-quick)",
        inline
          ? "relative rounded-lg"
          : "border-border bg-surface focus-within:border-accent overflow-hidden rounded-lg border",
        disabled && "opacity-60",
      )}
    >
      {/* Sticky toolbar — pri `inline` viden samo ob fokusu (brez skoka
          postavitve: ohrani višino, spremeni le prosojnost). */}
      <div
        role="toolbar"
        aria-label="Oblikovanje besedila"
        className={cn(
          // 8 px razmika na telefonu namesto 2: v orodni vrstici stoji
          // gumb za brisanje tik ob gumbu za premik in 2 px je premalo,
          // da bi ju prst ločil.
          "flex flex-wrap items-center gap-(--s2) p-1.5 sm:gap-0.5",
          inline
            ? cn(
                "bg-surface border-border/60 rounded-lg border shadow-md",
                // Telefon: v toku, prikazana šele ob fokusu (brez prekrivanja naslova).
                "max-sm:mb-2 max-sm:hidden max-sm:group-focus-within/rte:flex",
                // Namizje: lebdi nad besedilom, brez skoka postavitve.
                "sm:pointer-events-none sm:absolute sm:-top-12 sm:left-0 sm:z-20 sm:opacity-0 sm:transition-opacity sm:group-focus-within/rte:pointer-events-auto sm:group-focus-within/rte:opacity-100",
              )
            : "bg-surface/90 border-border/60 supports-backdrop-filter:bg-surface/75 sticky top-0 z-10 border-b backdrop-blur",
        )}
      >
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            disabled={disabled}
            label="Naslov 2"
            shortcut="⌘⌥2"
          >
            <Heading2 className="h-4 w-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            disabled={disabled}
            label="Naslov 3"
            shortcut="⌘⌥3"
          >
            <Heading3 className="h-4 w-4" aria-hidden />
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            disabled={disabled}
            label="Krepko"
            shortcut="⌘B"
          >
            <Bold className="h-4 w-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            disabled={disabled}
            label="Ležeče"
            shortcut="⌘I"
          >
            <Italic className="h-4 w-4" aria-hidden />
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            disabled={disabled}
            label="Nanizan seznam"
            shortcut="⌘⇧8"
          >
            <List className="h-4 w-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            disabled={disabled}
            label="Oštevilčen seznam"
            shortcut="⌘⇧7"
          >
            <ListOrdered className="h-4 w-4" aria-hidden />
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            disabled={disabled}
            label="Citat"
            shortcut="⌘⇧B"
          >
            <Quote className="h-4 w-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            disabled={disabled}
            label="Črta za ločilo"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => handleLink(editor)}
            active={editor.isActive("link")}
            disabled={disabled}
            label="Povezava"
            shortcut="⌘K"
          >
            <LinkIcon className="h-4 w-4" aria-hidden />
          </ToolbarButton>
          {/* Fotografija se naloži z istim dejanjem kot naslovna slika —
              ena pot v shrambo in ne dve, ki bi se sčasoma razšli. */}
          <ToolbarButton
            onClick={() => vhodSlike.current?.click()}
            disabled={disabled || nalagam}
            label={nalagam ? "Nalagam …" : "Fotografija"}
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
          </ToolbarButton>
        </ToolbarGroup>

        <div className="ml-auto flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            label="Razveljavi"
            shortcut="⌘Z"
          >
            <Undo2 className="h-4 w-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            label="Ponovi"
            shortcut="⌘⇧Z"
          >
            <Redo2 className="h-4 w-4" aria-hidden />
          </ToolbarButton>
        </div>
      </div>

      {/* Skrito polje za izbiro datoteke; gumb v orodni vrstici ga sproži. */}
      {/* Edino polje, ki ostane surovo: izbirnik datotek mora biti nativni
          <input type="file">, ker ga odpiramo prek `ref.click()`. Primitiv
          `Input` tega ne zna in ga tudi ne sme — to ni polje za vnos. */}
      <input
        ref={vhodSlike}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const datoteka = e.target.files?.[0];
          e.target.value = "";
          if (!datoteka) return;

          setNalagam(true);
          try {
            const fd = new FormData();
            fd.append("file", datoteka);
            fd.append("folder", "novice");
            const izid = await uploadImageAction(fd);
            if (!izid.ok || !izid.data?.url) {
              toast.error(izid.message ?? "Slike ni bilo mogoče naložiti.");
              return;
            }
            editor.chain().focus().setImage({ src: izid.data.url, alt: "" }).run();
          } finally {
            setNalagam(false);
          }
        }}
      />

      {/* Content area */}
      <div className={inline ? "px-1 py-1" : "px-4 py-3"}>
        <EditorContent editor={editor} />
      </div>

      {/* Footer: character count (pri `inline` samo, ko je blizu meje) */}
      {maxLength && (!inline || charCount > maxLength * 0.8) ? (
        <div
          className={cn(
            "flex justify-end px-4 py-2",
            !inline && "border-border/60 bg-bg/30 border-t",
          )}
        >
          <span
            className={cn(
              "text-muted type-small tabular-nums",
              charCount > maxLength && "text-danger",
            )}
            aria-live="polite"
          >
            {formatCount(charCount)} / {formatCount(maxLength)}
          </span>
        </div>
      ) : null}
    </div>
  );
}

// ==================================================================
// plainTextToHtml — pametni paste: plain tekst → TipTap-compatible HTML
// ==================================================================

/**
 * Preprost markdown-like parser za tekst, ki ga admin prilepi iz e-pošte,
 * dokumenta ali mojih odgovorov. Pravila (po vrsti pomembnosti):
 *
 *   - Vrstica, ki se začne s `*`, `-` ali `•` (+ presledek) → element seznama.
 *     Zaporedne take vrstice se združijo v en `<ul>`.
 *   - Kratka vrstica (< 80 znakov), ki ji sledi PRAZNA vrstica ali
 *     seznam → `<h3>` naslov. Razkriva patterne kot:
 *         Prostori
 *
 *         - item 1
 *         - item 2
 *   - `**tekst**` → `<strong>tekst</strong>` (znotraj vsake vrstice).
 *   - Vse ostalo → `<p>` odstavek.
 *
 * Ni popoln markdown — namenjen samo temu scenarju "admin kopira strukturiran
 * tekst iz Claude odgovora". HTML je whitelist-compatible s TipTap
 * StarterKit-om (paragraph, heading, bulletList, listItem, strong).
 */
function plainTextToHtml(raw: string): string {
  // Normaliziraj newline-e in odstrani Windows \r.
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");

  const out: string[] = [];
  let i = 0;

  const isListLine = (s: string) => /^\s*[*\-•]\s+/.test(s);
  const stripListMarker = (s: string) => s.replace(/^\s*[*\-•]\s+/, "");
  const isBlank = (s: string) => s.trim().length === 0;

  // Inline bold `**text**` + escape HTML
  const inlineMd = (s: string): string => {
    const escaped = s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
  };

  while (i < lines.length) {
    const line = lines[i];

    // 1) Prazno vrstico preskoči
    if (isBlank(line)) {
      i++;
      continue;
    }

    // 2) Seznam (ena ali več zaporednih `- item` vrstic)
    if (isListLine(line)) {
      const items: string[] = [];
      while (i < lines.length && isListLine(lines[i])) {
        items.push(inlineMd(stripListMarker(lines[i]).trim()));
        i++;
      }
      out.push(`<ul>${items.map((it) => `<li>${it}</li>`).join("")}</ul>`);
      continue;
    }

    // 3) Potencialni naslov — kratka vrstica brez končnih ločil, ki ji sledi
    //    prazna vrstica ali seznam.
    const trimmed = line.trim();
    const next = lines[i + 1] ?? "";
    const isShort = trimmed.length > 0 && trimmed.length <= 80;
    const endsSoft = !/[.!?:;,]$/.test(trimmed);
    const nextIsBlankOrList = isBlank(next) || isListLine(next.trim());
    if (isShort && endsSoft && nextIsBlankOrList) {
      out.push(`<h3>${inlineMd(trimmed)}</h3>`);
      i++;
      continue;
    }

    // 4) Odstavek — združi zaporedne ne-prazne vrstice v en `<p>`.
    const buf: string[] = [trimmed];
    i++;
    while (i < lines.length && !isBlank(lines[i]) && !isListLine(lines[i])) {
      buf.push(lines[i].trim());
      i++;
    }
    out.push(`<p>${inlineMd(buf.join(" "))}</p>`);
  }

  return out.join("");
}

// ==================================================================
// Sub-primitives
// ==================================================================

function handleLink(editor: Editor): void {
  const previous = editor.getAttributes("link").href as string | undefined;
  const next = promptForLink(previous);
  if (next === null) return; // cancel

  const chain = editor.chain().focus().extendMarkRange("link");
  if (next === "") {
    chain.unsetLink().run();
  } else {
    chain.setLink({ href: next, target: "_blank" }).run();
  }
}

function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return (
    <div
      className="bg-border/70 mx-1 h-5 w-px shrink-0"
      aria-hidden
      role="presentation"
    />
  );
}

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  /** A11y label + tooltip text. */
  label: string;
  /** Opcijski keyboard shortcut hint v tooltip-u. */
  shortcut?: string;
  children: ReactNode;
};

function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  label,
  shortcut,
  children,
}: ToolbarButtonProps) {
  const tooltip = shortcut ? `${label} (${shortcut})` : label;
  return (
    <IconButton
      size="sm"
      label={label}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active || undefined}
      title={tooltip}
      className={cn(
        "hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent",
        active && "bg-accent/10 text-accent hover:bg-accent/15",
      )}
    >
      {children}
    </IconButton>
  );
}
