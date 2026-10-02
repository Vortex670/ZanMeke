import type { Readable } from "node:stream";

// ============================================================================
// Storage provider types — enotni interface za vse providere (R2, Supabase, …)
// ----------------------------------------------------------------------------
// TA DATOTEKA JE ENAKA NA VSEH PROJEKTIH (zanmeke.com, second-home.hr, …).
// Razlikuje se samo ponudnik, ki ga projekt dejansko uporablja (`index.ts`).
// ============================================================================

/**
 * Ponudnik shrambe. Ta stran uporablja samo R2; druge vrednosti so tu zato,
 * ker si tip delimo z zanmeke.com, kjer zaradi starih datotek še živi Supabase.
 */
export type StorageProviderName = "r2" | "supabase" | "b2" | "local";

/**
 * Vedro (bucket), v katerem objekt leži. Če ga ne podaš, provider uporabi
 * svojega privzetega (public/private glede na `visibility` oz. pot ključa).
 * Projekti z več vedri (npr. second-home: `media-assets`, `avatars`,
 * `documents`) ga podajo eksplicitno, da ostanejo poti nespremenjene.
 */
export type BucketOptions = {
  bucket?: string;
};

export type UploadInput = BucketOptions & {
  /** Pot v bucket-u, npr. "originals/2026/05/abc123.jpg". */
  key: string;
  /** Vsebina datoteke. */
  body: Buffer | Uint8Array | ReadableStream;
  /** MIME tip (npr. "image/jpeg", "image/webp"). */
  contentType: string;
  /** Cache-Control header (privzeto immutable za hash-cuid datoteke). */
  cacheControl?: string;
  /** Dodatni metadata pari, ki gredo na object. */
  metadata?: Record<string, string>;
  /** Public-readable (R2 public bucket) ali privatno (signed URL). */
  visibility?: "public" | "private";
  /**
   * Ali sme upload prepisati obstoječ objekt na istem ključu. Privzeto `true`
   * (ključi so hash/random, prepis je no-op). `false` = varovalo pred
   * nenamernim prepisom (npr. fiskalni PDF-ji, ZIP izvozi, avatarji).
   */
  upsert?: boolean;
};

export type UploadResult = {
  key: string;
  /** Public URL če `visibility=public`, sicer null (uporabi signedUrl()). */
  publicUrl: string | null;
  /** Velikost v bytes. */
  size: number;
  /** Storage provider, ki je sprejel upload. */
  provider: StorageProviderName;
};

export type SignedUrlOptions = BucketOptions & {
  /** Veljavnost v sekundah (privzeto 15 min). */
  expiresInSec?: number;
  /** Forsiraj download (Content-Disposition: attachment). */
  asAttachment?: boolean;
  /** Predlagano ime datoteke (samo če asAttachment=true). */
  downloadFilename?: string;
};

export type PresignUploadOptions = BucketOptions & {
  /** Content-Type, ki ga bo browser pošiljal (mora match-at PUT request). */
  contentType: string;
  /** Veljavnost v sekundah (privzeto 1h za bulk uploade). */
  expiresInSec?: number;
};

/**
 * Enotni interface — vsak provider implementira to.
 */
export interface StorageProvider {
  readonly name: StorageProviderName;

  /** Naloži objekt. Vrne public URL če bucket dovoljuje, sicer null. */
  upload(input: UploadInput): Promise<UploadResult>;

  /**
   * Streaming (multipart) upload — body je Node Readable. Za VELIKE datoteke
   * (npr. ZIP arhiv celega albuma), kjer ne želimo držati vsega v pomnilniku.
   * Nizek, konstanten RAM ne glede na velikost.
   */
  uploadStream(
    key: string,
    body: Readable,
    contentType: string,
    options?: BucketOptions,
  ): Promise<void>;

  /** Generiraj presigned PUT URL — browser uploada direktno na storage (bypass server body limit). */
  presignUpload(key: string, options: PresignUploadOptions): Promise<string>;

  /** Generiraj signed URL za time-limited download (R2 + Supabase oba). */
  signedUrl(key: string, options?: SignedUrlOptions): Promise<string>;

  /** Public URL če je bucket public. Throw če ni dostopno. */
  publicUrl(key: string, options?: BucketOptions): string;

  /** Prenesi vsebino objekta v Buffer (server-side process — Sharp ipd). */
  download(key: string, options?: BucketOptions): Promise<Buffer>;

  /** Izbriši objekt. */
  delete(key: string, options?: BucketOptions): Promise<void>;

  /** Preveri ali objekt obstaja (ne fetch-aj contenta). */
  exists(key: string, options?: BucketOptions): Promise<boolean>;

  /**
   * Izbriši vse objekte pod `prefix`, ki so starejši od `olderThanMs`.
   * Za cron čiščenje (npr. zip-cache/). Vrne število izbrisanih.
   */
  purgeOldObjects(prefix: string, olderThanMs: number): Promise<number>;
}
