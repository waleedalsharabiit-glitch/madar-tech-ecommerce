import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash, randomUUID } from "node:crypto";

type StorageConfig = {
  bucket: string;
  region: string;
  publicBaseUrl: string;
  endpoint?: string;
  credentials?: { accessKeyId: string; secretAccessKey: string };
};

let client: S3Client | undefined;
let clientFingerprint = "";

function readStorageConfig(): StorageConfig | null {
  const bucket = process.env.S3_BUCKET?.trim();
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  if (!bucket || !publicBaseUrl || Boolean(accessKeyId) !== Boolean(secretAccessKey)) return null;

  let parsed: URL;
  try {
    parsed = new URL(publicBaseUrl);
  } catch {
    return null;
  }
  const isLocalDevelopment = process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !isLocalDevelopment) return null;
  if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;

  const endpoint = process.env.S3_ENDPOINT?.trim() || undefined;
  if (endpoint) {
    try {
      const endpointUrl = new URL(endpoint);
      if (endpointUrl.protocol !== "https:" && !(isLocalDevelopment && endpointUrl.protocol === "http:")) return null;
      if (endpointUrl.username || endpointUrl.password || endpointUrl.search || endpointUrl.hash) return null;
    } catch {
      return null;
    }
  }

  return {
    bucket,
    region: process.env.S3_REGION?.trim() || "us-east-1",
    publicBaseUrl,
    endpoint,
    ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
  };
}

function getClient(config: StorageConfig) {
  const secretFingerprint = config.credentials ? createHash("sha256").update(config.credentials.secretAccessKey).digest("hex") : "";
  const fingerprint = [config.region, config.endpoint, config.credentials?.accessKeyId, secretFingerprint, config.bucket].join("|");
  if (!client || clientFingerprint !== fingerprint) {
    client?.destroy();
    client = new S3Client({
      region: config.region,
      ...(config.endpoint ? { endpoint: config.endpoint, forcePathStyle: true } : {}),
      ...(config.credentials ? { credentials: config.credentials } : {}),
    });
    clientFingerprint = fingerprint;
  }
  return client;
}

export function isObjectStorageConfigured() {
  return readStorageConfig() !== null;
}

export function createProductImageKey(productId: string) {
  return `products/${productId}/${randomUUID()}.webp`;
}

export async function putProductImage(key: string, body: Buffer) {
  const config = readStorageConfig();
  if (!config) throw new Error("OBJECT_STORAGE_NOT_CONFIGURED");
  await getClient(config).send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: body,
    ContentLength: body.byteLength,
    ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return `${config.publicBaseUrl}/${key}`;
}

export function getManagedProductImageKey(imageUrl: string, productId: string) {
  const config = readStorageConfig();
  if (!config) return null;
  try {
    const image = new URL(imageUrl);
    const base = new URL(config.publicBaseUrl);
    const basePath = base.pathname.replace(/\/+$/, "");
    if (image.origin !== base.origin || !image.pathname.startsWith(`${basePath}/`)) return null;
    const key = decodeURIComponent(image.pathname.slice(basePath.length + 1));
    if (!key.startsWith(`products/${productId}/`) || !/^products\/[A-Za-z0-9_-]{1,64}\/[a-f0-9-]{36}\.webp$/i.test(key)) return null;
    return key;
  } catch {
    return null;
  }
}

export async function deleteProductImageObject(key: string) {
  const config = readStorageConfig();
  if (!config) throw new Error("OBJECT_STORAGE_NOT_CONFIGURED");
  await getClient(config).send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
}
