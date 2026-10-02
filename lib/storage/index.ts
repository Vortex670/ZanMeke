import "server-only";

import { r2Provider } from "./r2";
import type { StorageProvider, StorageProviderName } from "./types";

// ============================================================================
// lib/storage — dostop do shrambe datotek
// ----------------------------------------------------------------------------
// Uporaba:
//   import { storage } from "@/lib/storage";
//   await storage.upload({ key: "photos/jed.webp", body, contentType: "image/webp" });
//
// Ta stran vozi VSE datoteke na Cloudflare R2 — slike jedi, fotografije
// prostora, priloge in listine. Odločitev (Žan, 24. 9. 2026): vse na enem
// mestu, isti račun kot zanmeke.com in second-home.hr, da ni treba za vsako
// datoteko ugibati, kje je.
//
// Zato tu ni ponudnika za Supabase, čeprav ga zanmeke.com še ima zaradi
// starih datotek. Gostilnica se začne na R2 in nima česa prenašati.
// ============================================================================

// Brez možnosti izbire prek okolja: ponudnik je en sam in nastavitev, ki ima
// eno samo veljavno vrednost, je samo priložnost za napako.
const DEFAULT_PROVIDER: StorageProviderName = "r2";

export function getStorageProvider(name: StorageProviderName): StorageProvider {
  switch (name) {
    case "r2":
      return r2Provider;
    case "supabase":
      throw new Error("[shramba] Supabase na tej strani ni v rabi — vse gre na R2");
    case "b2":
      throw new Error("[storage] B2 provider še ni implementiran");
    case "local":
      throw new Error("[storage] LOCAL provider še ni implementiran");
    default: {
      const _exhaustive: never = name;
      throw new Error(`[storage] neznan provider: ${String(_exhaustive)}`);
    }
  }
}

/** Edini ponudnik na tej strani — Cloudflare R2. */
export const storage: StorageProvider = getStorageProvider(DEFAULT_PROVIDER);

export type { StorageProviderName } from "./types";
