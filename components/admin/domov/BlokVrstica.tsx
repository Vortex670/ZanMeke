"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { premakniBlokAction, toggleBlokAction } from "@/lib/domov/actions";
import type { StranKljuc } from "@/lib/domov/bloki";

/**
 * Dejanja pri odseku domače strani: premik in vidnost.
 *
 * Urejanje besedila je na svoji strani — tu je le to, kar se odloči z enim
 * pogledom na seznam.
 */
export function BlokVrsticaDejanja({
  stran,
  kljuc,
  isVisible,
  obvezen,
  prvi,
  zadnji,
}: {
  stran: StranKljuc;
  kljuc: string;
  isVisible: boolean;
  obvezen: boolean;
  prvi: boolean;
  zadnji: boolean;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function izvedi(fn: () => Promise<{ ok: boolean; message?: string }>) {
    start(async () => {
      const izid = await fn();
      if (izid.ok) {
        toast.success(izid.message ?? "Shranjeno.");
        router.refresh();
      } else {
        toast.error(izid.message ?? "Ni šlo.");
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Premakni višje"
        title="Premakni višje"
        disabled={pending || prvi}
        onClick={() => izvedi(() => premakniBlokAction(stran, kljuc, "gor"))}
      >
        <ArrowUp className="h-4 w-4" aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Premakni nižje"
        title="Premakni nižje"
        disabled={pending || zadnji}
        onClick={() => izvedi(() => premakniBlokAction(stran, kljuc, "dol"))}
      >
        <ArrowDown className="h-4 w-4" aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={isVisible ? "Skrij odsek" : "Pokaži odsek"}
        title={
          obvezen
            ? "Nosilnega odseka ni mogoče skriti"
            : isVisible
              ? "Skrij s strani"
              : "Pokaži na strani"
        }
        disabled={pending || obvezen}
        onClick={() => izvedi(() => toggleBlokAction(stran, kljuc))}
      >
        {isVisible ? (
          <Eye className="h-4 w-4" aria-hidden />
        ) : (
          <EyeOff className="h-4 w-4" aria-hidden />
        )}
      </Button>
    </>
  );
}
