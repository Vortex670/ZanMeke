import "server-only";

import { type Readable } from "node:stream";

import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { isDocumentKey, isPrivateKey, isPrivatePhotoKey } from "./buckets";
import type {
  BucketOptions,
  PresignUploadOptions,
  SignedUrlOptions,
  StorageProvider,
  UploadInput,
  UploadResult,
} from "./types";

// ============================================================================
// Cloudflare R2 storage provider — S3-kompatibilen API
// ----------------------------------------------------------------------------
// R2 specifika:
//   - Endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
//   - Region: "auto" (R2 nima regij kot S3)
//   - Public access: prek "R2.dev subdomain" (https://pub-<HASH>.r2.dev) ALI
//     custom domain (cdn.zanmeke.com). Public URL je orthogonal od bucket-a —
//     nastaviš v R2 dashboardu.
// ============================================================================

const ENDPOINT = process.env.R2_ENDPOINT;
const BUCKET = process.env.R2_BUCKET;
const BUCKET_PRIVATE = process.env.R2_BUCKET_PRIVATE;
const BUCKET_DOCUMENTS = process.env.R2_BUCKET_DOCUMENTS;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

function requireConfig(): {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
} {
  if (!ENDPOINT || !BUCKET || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    throw new Error(
      "[storage/r2] R2 ENV manjkajo: R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY",
    );
  }
  return {
    endpoint: ENDPOINT,
    bucket: BUCKET,
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  };
}

/**
 * Vedro za ključ (`lib/storage/buckets.ts`): listine → `R2_BUCKET_DOCUMENTS`,
 * zasebne slike → `R2_BUCKET_PRIVATE`, vse drugo → javno vedro.
 *
 * Nejavna datoteka NE sme nikoli pasti nazaj na javno vedro — raje napaka kot
 * račun ali original, ki ga prebere vsak, ki ugane ključ.
 */
function bucketForKey(key: string, override?: string): string {
  if (override) return override;
  const cfg = requireConfig();
  if (isDocumentKey(key)) {
    const bucket = BUCKET_DOCUMENTS ?? BUCKET_PRIVATE;
    if (!bucket) {
      throw new Error(
        "[storage/r2] R2_BUCKET_DOCUMENTS ni nastavljen — listin ne pišem v javno vedro",
      );
    }
    return bucket;
  }
  if (isPrivatePhotoKey(key)) {
    if (!BUCKET_PRIVATE) {
      throw new Error(
        "[storage/r2] R2_BUCKET_PRIVATE ni nastavljen — originalov ne pišem v javno vedro",
      );
    }
    return BUCKET_PRIVATE;
  }
  return cfg.bucket;
}

let _client: S3Client | null = null;

function client(): S3Client {
  if (_client) return _client;
  const cfg = requireConfig();
  _client = new S3Client({
    region: "auto",
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  return _client;
}

export const r2Provider: StorageProvider = {
  name: "r2",

  async upload(input: UploadInput): Promise<UploadResult> {
    const body =
      input.body instanceof ReadableStream
        ? await streamToBuffer(input.body)
        : Buffer.isBuffer(input.body)
          ? input.body
          : Buffer.from(input.body);

    const cmd = new PutObjectCommand({
      Bucket: bucketForKey(input.key, input.bucket),
      Key: input.key,
      Body: body,
      ContentType: input.contentType,
      CacheControl: input.cacheControl ?? "public, max-age=31536000, immutable",
      Metadata: input.metadata,
    });

    await client().send(cmd);

    const publicUrl =
      input.visibility === "public" && PUBLIC_URL
        ? `${PUBLIC_URL.replace(/\/+$/, "")}/${input.key}`
        : null;

    return {
      key: input.key,
      publicUrl,
      size: body.byteLength,
      provider: "r2",
    };
  },

  async uploadStream(
    key: string,
    body: Readable,
    contentType: string,
    options?: BucketOptions,
  ): Promise<void> {
    // Multipart upload (lib-storage) — streama body v 5 MB delih, nizek RAM
    // ne glede na velikost. Idealno za velike ZIP arhive.
    const upload = new Upload({
      client: client(),
      params: {
        Bucket: bucketForKey(key, options?.bucket),
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "private, max-age=86400",
      },
      queueSize: 4, // 4 deli vzporedno
      partSize: 8 * 1024 * 1024, // 8 MB na del
    });
    await upload.done();
  },

  async presignUpload(key: string, options: PresignUploadOptions): Promise<string> {
    const cmd = new PutObjectCommand({
      Bucket: bucketForKey(key, options.bucket),
      Key: key,
      ContentType: options.contentType,
    });
    return getSignedUrl(client(), cmd, {
      expiresIn: options.expiresInSec ?? 3600,
    });
  },

  async signedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const expiresIn = options?.expiresInSec ?? 60 * 15; // 15 min default

    const cmd = new GetObjectCommand({
      Bucket: bucketForKey(key, options?.bucket),
      Key: key,
      ...(options?.asAttachment
        ? {
            ResponseContentDisposition: `attachment${
              options.downloadFilename ? `; filename="${options.downloadFilename}"` : ""
            }`,
          }
        : {}),
    });

    return getSignedUrl(client(), cmd, { expiresIn });
  },

  // Javni naslov je vezan na domeno `R2_PUBLIC_URL`, ki kaže na JAVNO vedro —
  // `options.bucket` je tu zato brez učinka. Ključi iz zaprtega vedra prek
  // te poti ne obstajajo; zahtevaj `signedUrl()`.
  publicUrl(key: string): string {
    if (isPrivateKey(key)) {
      throw new Error(
        `[storage/r2] "${key}" sodi v zaprto vedro in nima javnega naslova — uporabi signedUrl()`,
      );
    }
    if (!PUBLIC_URL) {
      throw new Error(
        "[storage/r2] R2_PUBLIC_URL ni nastavljen — bucket nima public access ON",
      );
    }
    return `${PUBLIC_URL.replace(/\/+$/, "")}/${key}`;
  },

  async download(key: string, options?: BucketOptions): Promise<Buffer> {
    const cmd = new GetObjectCommand({
      Bucket: bucketForKey(key, options?.bucket),
      Key: key,
    });
    const res = await client().send(cmd);
    if (!res.Body) {
      throw new Error(`[storage/r2] empty body za key: ${key}`);
    }
    const bytes = await res.Body.transformToByteArray();
    return Buffer.from(bytes);
  },

  async delete(key: string, options?: BucketOptions): Promise<void> {
    await client().send(
      new DeleteObjectCommand({ Bucket: bucketForKey(key, options?.bucket), Key: key }),
    );
  },

  async purgeOldObjects(
    prefix: string,
    olderThanMs: number,
    options?: BucketOptions,
  ): Promise<number> {
    const bucket = bucketForKey(prefix, options?.bucket);
    const cutoff = Date.now() - olderThanMs;
    let deleted = 0;
    let token: string | undefined;
    do {
      const list = await client().send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: token,
          MaxKeys: 1000,
        }),
      );
      const oldKeys = (list.Contents ?? [])
        .filter((o) => o.Key && o.LastModified && o.LastModified.getTime() < cutoff)
        .map((o) => ({ Key: o.Key as string }));
      if (oldKeys.length > 0) {
        await client().send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: oldKeys, Quiet: true },
          }),
        );
        deleted += oldKeys.length;
      }
      token = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (token);
    return deleted;
  },

  async exists(key: string, options?: BucketOptions): Promise<boolean> {
    try {
      await client().send(
        new HeadObjectCommand({ Bucket: bucketForKey(key, options?.bucket), Key: key }),
      );
      return true;
    } catch (err) {
      // S3 throw-a NotFound (404). Vsi drugi error-ji rethrow.
      if ((err as { name?: string })?.name === "NotFound") return false;
      if (
        (err as { $metadata?: { httpStatusCode?: number } })?.$metadata
          ?.httpStatusCode === 404
      ) {
        return false;
      }
      throw err;
    }
  },
};

async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}
